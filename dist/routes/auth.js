"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const admin_otp_1 = require("../services/admin-otp");
const router = (0, express_1.Router)();
const sessionToken = (req) => req.session.token;
const sessionExpiry = (req) => new Date(req.session.expiresAt);
router.get("/me", auth_1.requireAdmin, (req, res) => {
    res.json({ success: true, user: req.user });
});
router.get("/otp/status", auth_1.requireAdminSession, async (req, res) => {
    res.json({ success: true, ...(await (0, admin_otp_1.getAdminOtpStatus)(sessionToken(req))) });
});
router.post("/otp/request", auth_1.requireAdminSession, async (req, res) => {
    try {
        const result = await (0, admin_otp_1.requestAdminOtp)(sessionToken(req), req.user.email, sessionExpiry(req));
        res.status(result.sent ? 200 : 429).json({ success: result.sent, ...result, message: result.sent ? "Verification code sent." : "Wait before requesting another code." });
    }
    catch (error) {
        const locked = error instanceof Error && error.message === "OTP_ATTEMPTS_EXCEEDED";
        res.status(locked ? 429 : 502).json({ success: false, message: locked ? "Maximum verification attempts reached." : "Could not send verification email." });
    }
});
router.post("/otp/resend", auth_1.requireAdminSession, async (req, res) => {
    try {
        const result = await (0, admin_otp_1.requestAdminOtp)(sessionToken(req), req.user.email, sessionExpiry(req));
        res.status(result.sent ? 200 : 429).json({ success: result.sent, ...result, message: result.sent ? "A new verification code was sent." : "Wait before requesting another code." });
    }
    catch (error) {
        const locked = error instanceof Error && error.message === "OTP_ATTEMPTS_EXCEEDED";
        res.status(locked ? 429 : 502).json({ success: false, message: locked ? "Maximum verification attempts reached." : "Could not send verification email." });
    }
});
router.post("/otp/verify", auth_1.requireAdminSession, async (req, res) => {
    const code = typeof req.body?.code === "string" ? req.body.code : "";
    if (!/^\d{6}$/.test(code)) {
        res.status(400).json({ success: false, message: "Enter the six-digit verification code." });
        return;
    }
    const result = await (0, admin_otp_1.verifyAdminOtp)(sessionToken(req), code);
    if (!result.verified) {
        const status = result.reason === "locked" ? 429 : result.reason === "expired" ? 410 : 400;
        res.status(status).json({ success: false, reason: result.reason, message: result.reason === "locked" ? "Maximum attempts reached." : result.reason === "expired" ? "Code expired. Request a new code." : "Incorrect verification code." });
        return;
    }
    res.json({ success: true, verified: true });
});
exports.default = router;
