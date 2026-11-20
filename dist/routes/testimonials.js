"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function testimonialIdQuery(id) {
    const choices = [{ id }];
    if (id.trim() !== "" && Number.isFinite(Number(id)))
        choices.push({ id: Number(id) });
    if (mongodb_1.ObjectId.isValid(id))
        choices.push({ _id: new mongodb_1.ObjectId(id) });
    return { $or: choices };
}
/**
 * GET /api/testimonials
 * Public: List all testimonials
 */
router.get("/", async (req, res) => {
    try {
        const testimonialsCollection = (0, db_1.getCollection)("testimonials");
        const testimonials = await testimonialsCollection
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        res.json({
            success: true,
            data: testimonials,
            count: testimonials.length,
        });
    }
    catch (error) {
        console.error("[testimonials] Failed to fetch testimonials:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch testimonials",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const testimonial = await (0, db_1.getCollection)("testimonials").findOne(testimonialIdQuery(req.params.id));
        if (!testimonial) {
            res.status(404).json({ success: false, message: "Testimonial not found" });
            return;
        }
        res.json({ success: true, data: testimonial });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch testimonial" });
    }
});
/**
 * POST /api/testimonials
 * Protected: Admin creates a testimonial
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const testimonialsCollection = (0, db_1.getCollection)("testimonials");
        const body = req.body;
        if (!body.name || !body.text) {
            res.status(400).json({
                success: false,
                message: "Testimonial name and text are required",
            });
            return;
        }
        const newTestimonial = {
            id: body.id || `testi_${Date.now()}`,
            name: body.name,
            role: body.role || "Client",
            company: body.company || "",
            avatar: body.avatar || "",
            text: body.text,
            rating: typeof body.rating === "number" ? body.rating : 5,
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await testimonialsCollection.insertOne(newTestimonial);
        res.status(201).json({
            success: true,
            message: "Testimonial created successfully",
            data: { ...newTestimonial, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[testimonials] Failed to create testimonial:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create testimonial",
        });
    }
});
/**
 * PUT /api/testimonials/:id
 * Protected: Admin updates a testimonial
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const testimonialsCollection = (0, db_1.getCollection)("testimonials");
        const body = req.body;
        const query = testimonialIdQuery(id);
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await testimonialsCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Testimonial with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Testimonial updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[testimonials] Failed to update testimonial ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update testimonial",
        });
    }
});
/**
 * DELETE /api/testimonials/:id
 * Protected: Admin deletes a testimonial
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const testimonialsCollection = (0, db_1.getCollection)("testimonials");
        const query = testimonialIdQuery(id);
        const result = await testimonialsCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Testimonial with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Testimonial deleted successfully",
        });
    }
    catch (error) {
        console.error(`[testimonials] Failed to delete testimonial ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete testimonial",
        });
    }
});
exports.default = router;
