import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  session?: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    [key: string]: any;
  };
}

async function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  requireOtp: boolean
): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) token = authHeader.substring(7).trim();
    if (!token && req.cookies) token = req.cookies["better-auth.session_token"] || req.cookies["__Secure-better-auth.session_token"];
    if (!token && req.headers["x-session-token"]) token = String(req.headers["x-session-token"]).trim();
    if (!token) { res.status(401).json({ success: false, message: "Authentication required." }); return; }

    const session = await getCollection("session").findOne({ token });
    if (!session || (session.expiresAt && new Date(session.expiresAt) <= new Date())) {
      res.status(401).json({ success: false, message: "Invalid or expired session." }); return;
    }
    const userQueries: any[] = [{ id: String(session.userId) }, { _id: session.userId as any }];
    if (typeof session.userId === "string" && ObjectId.isValid(session.userId)) userQueries.push({ _id: new ObjectId(session.userId) });
    const user = await getCollection("user").findOne({ $or: userQueries });
    if (!user) { res.status(401).json({ success: false, message: "Authenticated user not found." }); return; }
    if (user.role !== "admin") { res.status(403).json({ success: false, message: "Administrator access required." }); return; }

    req.user = { id: user.id || String(user._id), name: user.name, email: user.email, role: user.role };
    req.session = { id: session.id || String(session._id), token: session.token, userId: session.userId, expiresAt: session.expiresAt };
    if (requireOtp) {
      const { isAdminOtpVerified } = await import("../services/admin-otp.js");
      if (!(await isAdminOtpVerified(token))) { res.status(403).json({ success: false, code: "OTP_REQUIRED", message: "Email verification required." }); return; }
    }
    next();
  } catch (error) {
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
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  return authenticateAdmin(req, res, next, true);
}

export async function requireAdminSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  return authenticateAdmin(req, res, next, false);
}

