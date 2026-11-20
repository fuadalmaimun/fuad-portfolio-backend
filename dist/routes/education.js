"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function educationIdQuery(id) {
    const choices = [{ id }];
    if (id.trim() !== "" && Number.isFinite(Number(id)))
        choices.push({ id: Number(id) });
    if (mongodb_1.ObjectId.isValid(id))
        choices.push({ _id: new mongodb_1.ObjectId(id) });
    return { $or: choices };
}
/**
 * GET /api/education
 * Public: List all education items
 */
router.get("/", async (req, res) => {
    try {
        const educationCollection = (0, db_1.getCollection)("education");
        const education = await educationCollection
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        res.json({
            success: true,
            data: education,
            count: education.length,
        });
    }
    catch (error) {
        console.error("[education] Failed to fetch education:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch education",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const education = await (0, db_1.getCollection)("education").findOne(educationIdQuery(req.params.id));
        if (!education) {
            res.status(404).json({ success: false, message: "Education record not found" });
            return;
        }
        res.json({ success: true, data: education });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch education record" });
    }
});
/**
 * POST /api/education
 * Protected: Admin creates an education record
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const educationCollection = (0, db_1.getCollection)("education");
        const body = req.body;
        if (!body.degree || !body.institution) {
            res.status(400).json({
                success: false,
                message: "Degree and institution are required",
            });
            return;
        }
        const newEdu = {
            id: body.id || `edu_${Date.now()}`,
            degree: body.degree,
            institution: body.institution,
            period: body.period || "",
            type: body.type || "Academic Education",
            icon: body.icon || "GraduationCap",
            grade: body.grade || "",
            location: body.location || "Bangladesh",
            description: body.description || "",
            skills: Array.isArray(body.skills) ? body.skills : [],
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await educationCollection.insertOne(newEdu);
        res.status(201).json({
            success: true,
            message: "Education record created successfully",
            data: { ...newEdu, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[education] Failed to create education record:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create education record",
        });
    }
});
/**
 * PUT /api/education/:id
 * Protected: Admin updates an education record
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const educationCollection = (0, db_1.getCollection)("education");
        const body = req.body;
        const query = educationIdQuery(id);
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await educationCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Education record with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Education record updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[education] Failed to update education ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update education record",
        });
    }
});
/**
 * DELETE /api/education/:id
 * Protected: Admin deletes an education record
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const educationCollection = (0, db_1.getCollection)("education");
        const query = educationIdQuery(id);
        const result = await educationCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Education record with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Education record deleted successfully",
        });
    }
    catch (error) {
        console.error(`[education] Failed to delete education ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete education record",
        });
    }
});
exports.default = router;
