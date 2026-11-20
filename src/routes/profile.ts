import { Router, Request, Response } from "express";
import { getCollection } from "../config/db";
import { requireAdmin, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Fallback profile default data
export const defaultProfile = {
  name: "Fuad Al Maimun",
  rotatingTexts: [
    "Fuad Al Maimun",
    "Full Stack Developer",
    "Passionate Web Developer",
    "Building Modern Web Apps",
  ],
  welcomeBadge: "Welcome to my portfolio",
  headlinePrefix: "Hi, I'm",
  description:
    "I specialize in crafting high-performance, modern web applications using React, Next.js, TypeScript, and clean architecture.",
  profileImage: "/images/profile.png.jpeg",
  resumeUrl: "/Fuad Al Maimun_Full Stack_ Resume.pdf",
  resumeDownloadName: "Fuad Al Maimun_Full Stack_ Resume.pdf",
  email: "fuadmaymun0@gmail.com",
  phone: "+880 1300 725948",
  updatedAt: new Date(),
};

/**
 * GET /api/profile
 * Public: Returns profile data
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const profileCollection = getCollection("profile");
    const profile = await profileCollection.findOne({});
    if (!profile) {
      res.json({ success: true, data: defaultProfile });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error("[profile] Failed to fetch profile:", error);
    res.json({ success: true, data: defaultProfile, fallback: true });
  }
});

/**
 * PUT /api/profile
 * Protected: Admin updates profile information
 */
router.put("/", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const profileCollection = getCollection("profile");
    const body = req.body;

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };

    delete updateDoc._id; // prevent immutable _id update error

    const result = await profileCollection.findOneAndUpdate(
      {},
      { $set: updateDoc },
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("[profile] Failed to update profile:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
});

export default router;
