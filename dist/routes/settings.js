"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSettings = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.defaultSettings = {
    siteTitle: "Fuad Al Maimun | Full Stack Developer",
    siteDescription: "Fuad Al Maimun is a web developer building responsive websites and full-stack web applications using React, Next.js, and Node.js.",
    author: "Fuad Al Maimun",
    keywords: [
        "Fuad Al Maimun",
        "Fuad",
        "Maimun",
        "Next.js Developer",
        "React Developer",
        "Full Stack Developer",
        "Web Developer Bangladesh",
    ],
    ogImage: "/images/og-image.png",
    footerText: "Built with React, Next.js and Tailwind CSS. Have a project in mind? Head back to the contact section and let's talk.",
    socials: {
        github: "https://github.com/fuadalmaimun",
        linkedin: "https://www.linkedin.com/in/fuad-al-maimun-97ba42399/",
        whatsapp: "https://api.whatsapp.com/send/?phone=%2B8801300725948&text&type=phone_number&app_absent=0",
        facebook: "https://www.facebook.com/fuad.fuadalmaimun",
        email: "fuadmaymun0@gmail.com",
        phone: "+880 1300 725948",
    },
    seo: {
        metaTitle: "Fuad Al Maimun | Full Stack Developer Portfolio",
        metaDescription: "Explore my portfolio, web development projects, and technical skills.",
        canonicalUrl: "https://fuad-al-maimun.vercel.app",
    },
    updatedAt: new Date(),
};
/**
 * GET /api/settings
 * Public: Get site settings & SEO
 */
router.get("/", async (req, res) => {
    try {
        const settingsCollection = (0, db_1.getCollection)("settings");
        const settings = await settingsCollection.findOne({});
        if (!settings) {
            res.json({ success: true, data: exports.defaultSettings });
            return;
        }
        res.json({ success: true, data: settings });
    }
    catch (error) {
        console.error("[settings] Failed to fetch settings:", error);
        res.json({ success: true, data: exports.defaultSettings, fallback: true });
    }
});
/**
 * PUT /api/settings
 * Protected: Admin updates website settings, SEO, and socials
 */
router.put("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const settingsCollection = (0, db_1.getCollection)("settings");
        const body = req.body;
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await settingsCollection.findOneAndUpdate({}, { $set: updateDoc }, { upsert: true, returnDocument: "after" });
        res.json({
            success: true,
            message: "Website settings updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("[settings] Failed to update settings:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update website settings",
        });
    }
});
exports.default = router;
