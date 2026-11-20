"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAdminOtp = requestAdminOtp;
exports.verifyAdminOtp = verifyAdminOtp;
exports.isAdminOtpVerified = isAdminOtpVerified;
exports.getAdminOtpStatus = getAdminOtpStatus;
const node_crypto_1 = require("node:crypto");
const db_1 = require("../config/db");
const collection = () => (0, db_1.getCollection)("admin_email_otp");
const sessionHash = (token) => (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
const otpHash = (token, code) => {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret)
        throw new Error("BETTER_AUTH_SECRET is not configured.");
    return (0, node_crypto_1.createHmac)("sha256", secret).update(`${sessionHash(token)}:${code}`).digest("hex");
};
async function ensureIndexes() {
    await collection().createIndex({ sessionTokenHash: 1 }, { unique: true });
    await collection().createIndex({ sessionExpiresAt: 1 }, { expireAfterSeconds: 0 });
}
async function sendEmail(to, code) {
    const key = process.env.RESEND_API_KEY;
    if (!key)
        throw new Error("Email delivery is not configured.");
    const configuredFrom = process.env.EMAIL_FROM?.trim();
    // Resend's onboarding sender only supports test delivery to the verified
    // account recipient. Never try to send it to the admin's email address.
    const testing = process.env.RESEND_TEST_MODE === "true" || configuredFrom === "onboarding@resend.dev";
    const recipient = testing ? process.env.RESEND_TEST_RECIPIENT : to;
    const from = testing ? "onboarding@resend.dev" : configuredFrom;
    if (!recipient || !from) {
        throw new Error(testing
            ? "RESEND_TEST_RECIPIENT is required when using the Resend test sender."
            : "EMAIL_FROM is not configured.");
    }
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [recipient], subject: "Your portfolio admin verification code", text: `Your verification code is ${code}. It expires in 5 minutes.` }) });
    if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        console.error("[admin-otp] Resend delivery failed:", response.status, details?.message || "unknown error");
        throw new Error("Could not send verification email.");
    }
}
async function requestAdminOtp(token, email, sessionExpiresAt) {
    await ensureIndexes();
    const now = new Date();
    const key = sessionHash(token);
    const current = await collection().findOne({ sessionTokenHash: key });
    if (current?.verifiedAt)
        return { sent: true, verified: true, retryAfter: 0 };
    if (current && current.resendAvailableAt > now)
        return { sent: false, verified: false, retryAfter: Math.ceil((current.resendAvailableAt.getTime() - now.getTime()) / 1000) };
    if (current && current.attempts >= 5)
        throw new Error("OTP_ATTEMPTS_EXCEEDED");
    const code = String((0, node_crypto_1.randomInt)(0, 1_000_000)).padStart(6, "0");
    const expiresAt = new Date(now.getTime() + 5 * 60_000);
    const resendAvailableAt = new Date(now.getTime() + 60_000);
    await sendEmail(email, code);
    await collection().updateOne({ sessionTokenHash: key }, { $set: { otpHash: otpHash(token, code), expiresAt, resendAvailableAt, sessionExpiresAt }, $setOnInsert: { attempts: 0 } }, { upsert: true });
    return { sent: true, verified: false, retryAfter: 60 };
}
async function verifyAdminOtp(token, code) {
    await ensureIndexes();
    const key = sessionHash(token);
    const challenge = await collection().findOne({ sessionTokenHash: key });
    const now = new Date();
    if (!challenge)
        return { verified: false, reason: "invalid" };
    if (challenge.verifiedAt)
        return { verified: true };
    if (challenge.attempts >= 5)
        return { verified: false, reason: "locked" };
    if (!challenge.otpHash || !challenge.expiresAt || challenge.expiresAt <= now)
        return { verified: false, reason: "expired" };
    const provided = Buffer.from(otpHash(token, code), "hex");
    const stored = Buffer.from(challenge.otpHash, "hex");
    const matches = provided.length === stored.length && (0, node_crypto_1.timingSafeEqual)(provided, stored);
    if (!matches) {
        await collection().updateOne({ sessionTokenHash: key, attempts: { $lt: 5 } }, { $inc: { attempts: 1 } });
        return { verified: false, reason: "invalid" };
    }
    await collection().updateOne({ sessionTokenHash: key, verifiedAt: { $exists: false }, otpHash: challenge.otpHash }, { $set: { verifiedAt: now }, $unset: { otpHash: "", expiresAt: "" } });
    return { verified: await isAdminOtpVerified(token) };
}
async function isAdminOtpVerified(token) {
    await ensureIndexes();
    const record = await collection().findOne({ sessionTokenHash: sessionHash(token), verifiedAt: { $exists: true }, sessionExpiresAt: { $gt: new Date() } });
    return Boolean(record);
}
async function getAdminOtpStatus(token) {
    await ensureIndexes();
    const record = await collection().findOne({ sessionTokenHash: sessionHash(token) });
    return { verified: Boolean(record?.verifiedAt && record.sessionExpiresAt > new Date()), retryAfter: record && record.resendAvailableAt > new Date() ? Math.ceil((record.resendAvailableAt.getTime() - Date.now()) / 1000) : 0, attemptsRemaining: Math.max(0, 5 - (record?.attempts || 0)) };
}
