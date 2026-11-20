import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { getCollection } from "../config/db";

type Challenge = {
  [key: string]: any;
  sessionTokenHash: string;
  otpHash?: string;
  attempts: number;
  expiresAt?: Date;
  resendAvailableAt: Date;
  verifiedAt?: Date;
  sessionExpiresAt: Date;
};
const collection = () => getCollection<Challenge>("admin_email_otp");
const sessionHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
const otpHash = (token: string, code: string) => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not configured.");
  return createHmac("sha256", secret)
    .update(`${sessionHash(token)}:${code}`)
    .digest("hex");
};

async function ensureIndexes() {
  await collection().createIndex({ sessionTokenHash: 1 }, { unique: true });
  await collection().createIndex(
    { sessionExpiresAt: 1 },
    { expireAfterSeconds: 0 },
  );
}

async function sendEmail(to: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Email delivery is not configured.");
  const configuredFrom = process.env.EMAIL_FROM?.trim();
  // Resend's onboarding sender only supports test delivery to the verified
  // account recipient. Never try to send it to the admin's email address.
  const testing =
    process.env.RESEND_TEST_MODE === "true" ||
    configuredFrom === "onboarding@resend.dev";
  const recipient = testing ? process.env.RESEND_TEST_RECIPIENT : to;
  const from = testing ? "onboarding@resend.dev" : configuredFrom;
  if (!recipient || !from) {
    throw new Error(
      testing
        ? "RESEND_TEST_RECIPIENT is required when using the Resend test sender."
        : "EMAIL_FROM is not configured.",
    );
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "Your Portfolio Admin Verification Code",
      text: `Your verification code is ${code}. It expires in 5 minutes.`,
      html: `
    <div style="background:#f4f7fb;padding:40px 15px;font-family:Arial,sans-serif;">
      <div style="max-width:450px;margin:auto;background:white;padding:35px;border-radius:16px;text-align:center;">
        <h2 style="color:#173D32;">Admin Verification</h2>
        <p style="color:#64748b;">Use this code to access your dashboard.</p>

        <div style="background:#f0fdf4;padding:20px;border-radius:12px;margin:25px 0;">
          <h1 style="color:#173D32;font-size:36px;letter-spacing:10px;margin:0;">
            ${code}
          </h1>
        </div>

        <p style="color:#dc2626;font-size:14px;">
          This code expires in 5 minutes.
        </p>

        <p style="color:#94a3b8;font-size:12px;">
          If you didn't request this code, ignore this email.
        </p>
        <p style="color:#64748b;font-size:12px;">
          © Fuad Al Maimun | Portfolio
        </p>
      </div>
    </div>
  `,
    }),
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    console.error(
      "[admin-otp] Resend delivery failed:",
      response.status,
      details?.message || "unknown error",
    );
    throw new Error("Could not send verification email.");
  }
}

export async function requestAdminOtp(
  token: string,
  email: string,
  sessionExpiresAt: Date,
) {
  await ensureIndexes();
  const now = new Date();
  const key = sessionHash(token);
  const current = await collection().findOne({ sessionTokenHash: key });
  if (current?.verifiedAt) return { sent: true, verified: true, retryAfter: 0 };
  if (current && current.resendAvailableAt > now)
    return {
      sent: false,
      verified: false,
      retryAfter: Math.ceil(
        (current.resendAvailableAt.getTime() - now.getTime()) / 1000,
      ),
    };
  if (current && current.attempts >= 5)
    throw new Error("OTP_ATTEMPTS_EXCEEDED");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  const resendAvailableAt = new Date(now.getTime() + 60_000);
  await sendEmail(email, code);
  await collection().updateOne(
    { sessionTokenHash: key },
    {
      $set: {
        otpHash: otpHash(token, code),
        expiresAt,
        resendAvailableAt,
        sessionExpiresAt,
      },
      $setOnInsert: { attempts: 0 },
    },
    { upsert: true },
  );
  return { sent: true, verified: false, retryAfter: 60 };
}

export async function verifyAdminOtp(token: string, code: string) {
  await ensureIndexes();
  const key = sessionHash(token);
  const challenge = await collection().findOne({ sessionTokenHash: key });
  const now = new Date();
  if (!challenge) return { verified: false, reason: "invalid" as const };
  if (challenge.verifiedAt) return { verified: true };
  if (challenge.attempts >= 5)
    return { verified: false, reason: "locked" as const };
  if (!challenge.otpHash || !challenge.expiresAt || challenge.expiresAt <= now)
    return { verified: false, reason: "expired" as const };
  const provided = Buffer.from(otpHash(token, code), "hex");
  const stored = Buffer.from(challenge.otpHash, "hex");
  const matches =
    provided.length === stored.length && timingSafeEqual(provided, stored);
  if (!matches) {
    await collection().updateOne(
      { sessionTokenHash: key, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
    );
    return { verified: false, reason: "invalid" as const };
  }
  await collection().updateOne(
    {
      sessionTokenHash: key,
      verifiedAt: { $exists: false },
      otpHash: challenge.otpHash,
    },
    { $set: { verifiedAt: now }, $unset: { otpHash: "", expiresAt: "" } },
  );
  return { verified: await isAdminOtpVerified(token) };
}

export async function isAdminOtpVerified(token: string) {
  await ensureIndexes();
  const record = await collection().findOne({
    sessionTokenHash: sessionHash(token),
    verifiedAt: { $exists: true },
    sessionExpiresAt: { $gt: new Date() },
  });
  return Boolean(record);
}

export async function getAdminOtpStatus(token: string) {
  await ensureIndexes();
  const record = await collection().findOne({
    sessionTokenHash: sessionHash(token),
  });
  return {
    verified: Boolean(
      record?.verifiedAt && record.sessionExpiresAt > new Date(),
    ),
    retryAfter:
      record && record.resendAvailableAt > new Date()
        ? Math.ceil((record.resendAvailableAt.getTime() - Date.now()) / 1000)
        : 0,
    attemptsRemaining: Math.max(0, 5 - (record?.attempts || 0)),
  };
}
