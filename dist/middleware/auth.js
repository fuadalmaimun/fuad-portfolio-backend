"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
exports.requireAdminSession = requireAdminSession;
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
async function authenticateAdmin(req, res, next, requireOtp) {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer "))
            token = authHeader.substring(7).trim();
        if (!token && req.cookies)
            token = req.cookies["better-auth.session_token"] || req.cookies["__Secure-better-auth.session_token"];
        if (!token && req.headers["x-session-token"])
            token = String(req.headers["x-session-token"]).trim();
        if (!token) {
            res.status(401).json({ success: false, message: "Authentication required." });
            return;
        }
        const session = await (0, db_1.getCollection)("session").findOne({ token });
        if (!session || (session.expiresAt && new Date(session.expiresAt) <= new Date())) {
            res.status(401).json({ success: false, message: "Invalid or expired session." });
            return;
        }
        const userQueries = [{ id: String(session.userId) }, { _id: session.userId }];
        if (typeof session.userId === "string" && mongodb_1.ObjectId.isValid(session.userId))
            userQueries.push({ _id: new mongodb_1.ObjectId(session.userId) });
        const user = await (0, db_1.getCollection)("user").findOne({ $or: userQueries });
        if (!user) {
            res.status(401).json({ success: false, message: "Authenticated user not found." });
            return;
        }
        if (user.role !== "admin") {
            res.status(403).json({ success: false, message: "Administrator access required." });
            return;
        }
        req.user = { id: user.id || String(user._id), name: user.name, email: user.email, role: user.role };
        req.session = { id: session.id || String(session._id), token: session.token, userId: session.userId, expiresAt: session.expiresAt };
        if (requireOtp) {
            const { isAdminOtpVerified } = await import("../services/admin-otp.js");
            if (!(await isAdminOtpVerified(token))) {
                res.status(403).json({ success: false, code: "OTP_REQUIRED", message: "Email verification required." });
                return;
            }
        }
        next();
    }
    catch (error) {
        console.error("[auth-middleware] Admin authorization failed:", error);
        res.status(500).json({ success: false, message: "Authorization verification failed." });
    }
}
/**
 * Backend middleware to enforce admin role verification.
 * Extracts the Better Auth session token from cookies or Authorization header,
 * verifies it against the MongoDB session collection, checks expiration,
 * and confirms user.role === 'admin'.
 *
 * Never trusts frontend-supplied role information.
 */
async function requireAdmin(req, res, next) {
    return authenticateAdmin(req, res, next, true);
}
async function requireAdminSession(req, res, next) {
    return authenticateAdmin(req, res, next, false);
}
