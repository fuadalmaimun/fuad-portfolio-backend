"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function skillIdQuery(id) {
    const choices = [{ id }];
    if (id.trim() !== "" && Number.isFinite(Number(id)))
        choices.push({ id: Number(id) });
    if (mongodb_1.ObjectId.isValid(id))
        choices.push({ _id: new mongodb_1.ObjectId(id) });
    return { $or: choices };
}
/**
 * GET /api/skills
 * Public: List all skills
 */
router.get("/", async (req, res) => {
    try {
        const skillsCollection = (0, db_1.getCollection)("skills");
        const skills = await skillsCollection.find({}).sort({ order: 1, name: 1 }).toArray();
        res.json({
            success: true,
            data: skills,
            count: skills.length,
        });
    }
    catch (error) {
        console.error("[skills] Failed to fetch skills:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch skills",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const skill = await (0, db_1.getCollection)("skills").findOne(skillIdQuery(req.params.id));
        if (!skill) {
            res.status(404).json({ success: false, message: "Skill not found" });
            return;
        }
        res.json({ success: true, data: skill });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch skill" });
    }
});
/**
 * POST /api/skills
 * Protected: Admin creates a skill
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const skillsCollection = (0, db_1.getCollection)("skills");
        const body = req.body;
        if (!body.name || !body.category) {
            res.status(400).json({
                success: false,
                message: "Skill name and category are required",
            });
            return;
        }
        const newSkill = {
            id: body.id || `skill_${Date.now()}`,
            name: body.name,
            category: body.category,
            proficiency: body.proficiency || "intermediate",
            icon: body.icon || "Code",
            description: body.description || "",
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await skillsCollection.insertOne(newSkill);
        res.status(201).json({
            success: true,
            message: "Skill created successfully",
            data: { ...newSkill, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[skills] Failed to create skill:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create skill",
        });
    }
});
/**
 * PUT /api/skills/:id
 * Protected: Admin updates a skill
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const skillsCollection = (0, db_1.getCollection)("skills");
        const body = req.body;
        const query = skillIdQuery(id);
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await skillsCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Skill with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Skill updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[skills] Failed to update skill ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update skill",
        });
    }
});
/**
 * DELETE /api/skills/:id
 * Protected: Admin deletes a skill
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const skillsCollection = (0, db_1.getCollection)("skills");
        const query = skillIdQuery(id);
        const result = await skillsCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Skill with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Skill deleted successfully",
        });
    }
    catch (error) {
        console.error(`[skills] Failed to delete skill ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete skill",
        });
    }
});
exports.default = router;
