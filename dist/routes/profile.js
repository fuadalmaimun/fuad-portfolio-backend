"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultProfile = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Fallback profile default data
exports.defaultProfile = {
    name: "Fuad Al Maimun",
    rotatingTexts: [
        "Fuad Al Maimun",
        "Full Stack Developer",
        "Passionate Web Developer",
        "Building Modern Web Apps",
    ],
    welcomeBadge: "Welcome to my portfolio",
    headlinePrefix: "Hi, I'm",
    description: "I specialize in crafting high-performance, modern web applications using React, Next.js, TypeScript, and clean architecture.",
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
router.get("/", async (req, res) => {
    try {
        const profileCollection = (0, db_1.getCollection)("profile");
        const profile = await profileCollection.findOne({});
        if (!profile) {
            res.json({ success: true, data: exports.defaultProfile });
            return;
        }
        res.json({ success: true, data: profile });
    }
    catch (error) {
        console.error("[profile] Failed to fetch profile:", error);
        res.json({ success: true, data: exports.defaultProfile, fallback: true });
    }
});
/**
 * PUT /api/profile
 * Protected: Admin updates profile information
 */
router.put("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const profileCollection = (0, db_1.getCollection)("profile");
        const body = req.body;
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id; // prevent immutable _id update error
        const result = await profileCollection.findOneAndUpdate({}, { $set: updateDoc }, { upsert: true, returnDocument: "after" });
        res.json({
            success: true,
            message: "Profile updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("[profile] Failed to update profile:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
});
exports.default = router;
