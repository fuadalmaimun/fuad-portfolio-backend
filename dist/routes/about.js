"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAbout = void 0;
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.defaultAbout = {
    badge: "Get To Know Me",
    title: "About",
    titleHighlight: "Me",
    summary: "A developer dedicated to engineering modern, responsive, and human-friendly web applications with clean code and high attention to detail.",
    pillars: [
        {
            id: "journey",
            title: "Programming Journey",
            icon: "Compass",
            description: "Started with HTML, CSS, and modern JavaScript, discovering a passion for building interactive interfaces. Today, I build full-stack web applications using React, Next.js, Node.js, and MongoDB.",
            details: [
                "Continuous learning and skill refinement",
                "Focused on full-stack web application development",
                "Passionate about responsive and accessible UI design",
            ],
        },
        {
            id: "preferred",
            title: "Preferred Work & Focus",
            icon: "Briefcase",
            description: "I thrive when building responsive frontends, clean design systems, and robust backend APIs. I prioritize type safety, modular component architecture, and seamless user experiences.",
            details: [
                "Modern frontend architectures with Next.js & React",
                "REST API development with Express & Node.js",
                "Database modeling with MongoDB native driver",
            ],
        },
        {
            id: "hobbies",
            title: "Hobbies & Outside Code",
            icon: "Heart",
            description: "Beyond programming, I enjoy exploring new tech gadgets, reading tech publications, participating in developer communities, and learning about UI/UX design trends.",
            details: [
                "Exploring tech articles and design trends",
                "Active learner in developer bootcamps and communities",
                "Continuous exploration of modern web frameworks",
            ],
        },
    ],
    strengths: [
        {
            title: "Fast Learner",
            desc: "Quickly adopt modern libraries, frameworks, and workflows",
        },
        {
            title: "Clean Code",
            desc: "Focus on readability, maintainable architectures, and reusability",
        },
        {
            title: "Team Player",
            desc: "Open communication, agile collaboration, and git-based workflows",
        },
        {
            title: "Problem Solver",
            desc: "Patient debugger with analytical approach to challenges",
        },
    ],
    updatedAt: new Date(),
};
/**
 * GET /api/about
 * Public: Returns about data
 */
router.get("/", async (req, res) => {
    try {
        const aboutCollection = (0, db_1.getCollection)("about");
        const about = await aboutCollection.findOne({});
        if (!about) {
            res.json({ success: true, data: exports.defaultAbout });
            return;
        }
        res.json({ success: true, data: about });
    }
    catch (error) {
        console.error("[about] Failed to fetch about:", error);
        res.json({ success: true, data: exports.defaultAbout, fallback: true });
    }
});
/**
 * PUT /api/about
 * Protected: Admin updates about section
 */
router.put("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const aboutCollection = (0, db_1.getCollection)("about");
        const body = req.body;
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await aboutCollection.findOneAndUpdate({}, { $set: updateDoc }, { upsert: true, returnDocument: "after" });
        res.json({
            success: true,
            message: "About section updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("[about] Failed to update about:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update about section",
        });
    }
});
exports.default = router;
