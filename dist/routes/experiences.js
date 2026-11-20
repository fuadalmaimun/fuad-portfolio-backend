"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function experienceIdQuery(id) {
    const choices = [{ id }];
    if (id.trim() !== "" && Number.isFinite(Number(id)))
        choices.push({ id: Number(id) });
    if (mongodb_1.ObjectId.isValid(id))
        choices.push({ _id: new mongodb_1.ObjectId(id) });
    return { $or: choices };
}
/**
 * GET /api/experiences
 * Public: List all experiences
 */
router.get("/", async (req, res) => {
    try {
        const experiencesCollection = (0, db_1.getCollection)("experiences");
        const experiences = await experiencesCollection
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        res.json({
            success: true,
            data: experiences,
            count: experiences.length,
        });
    }
    catch (error) {
        console.error("[experiences] Failed to fetch experiences:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch experiences",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const experience = await (0, db_1.getCollection)("experiences").findOne(experienceIdQuery(req.params.id));
        if (!experience) {
            res.status(404).json({ success: false, message: "Experience item not found" });
            return;
        }
        res.json({ success: true, data: experience });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch experience item" });
    }
});
/**
 * POST /api/experiences
 * Protected: Admin creates an experience item
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const experiencesCollection = (0, db_1.getCollection)("experiences");
        const body = req.body;
        if (!body.title || !body.description) {
            res.status(400).json({
                success: false,
                message: "Experience title and description are required",
            });
            return;
        }
        const newExperience = {
            id: body.id || `exp_${Date.now()}`,
            title: body.title,
            description: body.description,
            date: body.date || "Present",
            type: body.type || "learning",
            icon: body.icon || "BookOpen",
            details: Array.isArray(body.details) ? body.details : [],
            tags: Array.isArray(body.tags) ? body.tags : [],
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await experiencesCollection.insertOne(newExperience);
        res.status(201).json({
            success: true,
            message: "Experience item created successfully",
            data: { ...newExperience, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[experiences] Failed to create experience:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create experience item",
        });
    }
});
/**
 * PUT /api/experiences/:id
 * Protected: Admin updates an experience item
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const experiencesCollection = (0, db_1.getCollection)("experiences");
        const body = req.body;
        const query = experienceIdQuery(id);
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await experiencesCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Experience with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Experience item updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[experiences] Failed to update experience ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update experience item",
        });
    }
});
/**
 * DELETE /api/experiences/:id
 * Protected: Admin deletes an experience item
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const experiencesCollection = (0, db_1.getCollection)("experiences");
        const query = experienceIdQuery(id);
        const result = await experiencesCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Experience with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Experience item deleted successfully",
        });
    }
    catch (error) {
        console.error(`[experiences] Failed to delete experience ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete experience item",
        });
    }
});
exports.default = router;
