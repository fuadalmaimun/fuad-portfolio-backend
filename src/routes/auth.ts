import { Router, Response } from "express";
import { AuthenticatedRequest, requireAdmin, requireAdminSession } from "../middleware/auth";
import { getAdminOtpStatus, requestAdminOtp, verifyAdminOtp } from "../services/admin-otp";

const router = Router();
const sessionToken = (req: AuthenticatedRequest) => req.session!.token;
const sessionExpiry = (req: AuthenticatedRequest) => new Date(req.session!.expiresAt);

router.get("/me", requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

router.get("/otp/status", requireAdminSession, async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, ...(await getAdminOtpStatus(sessionToken(req))) });
});

router.post("/otp/request", requireAdminSession, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await requestAdminOtp(sessionToken(req), req.user!.email, sessionExpiry(req));
    res.status(result.sent ? 200 : 429).json({ success: result.sent, ...result, message: result.sent ? "Verification code sent." : "Wait before requesting another code." });
  } catch (error) {
    const locked = error instanceof Error && error.message === "OTP_ATTEMPTS_EXCEEDED";
    res.status(locked ? 429 : 502).json({ success: false, message: locked ? "Maximum verification attempts reached." : "Could not send verification email." });
  }
});

router.post("/otp/resend", requireAdminSession, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await requestAdminOtp(sessionToken(req), req.user!.email, sessionExpiry(req));
    res.status(result.sent ? 200 : 429).json({ success: result.sent, ...result, message: result.sent ? "A new verification code was sent." : "Wait before requesting another code." });
  } catch (error) {
    const locked = error instanceof Error && error.message === "OTP_ATTEMPTS_EXCEEDED";
    res.status(locked ? 429 : 502).json({ success: false, message: locked ? "Maximum verification attempts reached." : "Could not send verification email." });
  }
});

router.post("/otp/verify", requireAdminSession, async (req: AuthenticatedRequest, res: Response) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  if (!/^\d{6}$/.test(code)) { res.status(400).json({ success: false, message: "Enter the six-digit verification code." }); return; }
  const result = await verifyAdminOtp(sessionToken(req), code);
  if (!result.verified) {
    const status = result.reason === "locked" ? 429 : result.reason === "expired" ? 410 : 400;
    res.status(status).json({ success: false, reason: result.reason, message: result.reason === "locked" ? "Maximum attempts reached." : result.reason === "expired" ? "Code expired. Request a new code." : "Incorrect verification code." });
    return;
  }
  res.json({ success: true, verified: true });
});

export default router;
