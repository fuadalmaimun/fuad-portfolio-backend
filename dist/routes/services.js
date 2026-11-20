"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
function serviceIdQuery(id) {
    const choices = [{ id }];
    if (id.trim() !== "" && Number.isFinite(Number(id)))
        choices.push({ id: Number(id) });
    if (mongodb_1.ObjectId.isValid(id))
        choices.push({ _id: new mongodb_1.ObjectId(id) });
    return { $or: choices };
}
/**
 * GET /api/services
 * Public: List all services
 */
router.get("/", async (req, res) => {
    try {
        const servicesCollection = (0, db_1.getCollection)("services");
        const services = await servicesCollection
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray();
        res.json({
            success: true,
            data: services,
            count: services.length,
        });
    }
    catch (error) {
        console.error("[services] Failed to fetch services:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch services",
        });
    }
});
router.get("/:id", async (req, res) => {
    try {
        const service = await (0, db_1.getCollection)("services").findOne(serviceIdQuery(req.params.id));
        if (!service) {
            res.status(404).json({ success: false, message: "Service not found" });
            return;
        }
        res.json({ success: true, data: service });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch service" });
    }
});
/**
 * POST /api/services
 * Protected: Admin creates a service
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const servicesCollection = (0, db_1.getCollection)("services");
        const body = req.body;
        if (!body.title || !body.description) {
            res.status(400).json({
                success: false,
                message: "Service title and description are required",
            });
            return;
        }
        const newService = {
            id: body.id || `srv_${Date.now()}`,
            title: body.title,
            description: body.description,
            longDescription: body.longDescription || body.description,
            icon: body.icon || "Code",
            features: Array.isArray(body.features) ? body.features : [],
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await servicesCollection.insertOne(newService);
        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: { ...newService, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[services] Failed to create service:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create service",
        });
    }
});
/**
 * PUT /api/services/:id
 * Protected: Admin updates a service
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const servicesCollection = (0, db_1.getCollection)("services");
        const body = req.body;
        const query = serviceIdQuery(id);
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id;
        const result = await servicesCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Service with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Service updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[services] Failed to update service ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update service",
        });
    }
});
/**
 * DELETE /api/services/:id
 * Protected: Admin deletes a service
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const servicesCollection = (0, db_1.getCollection)("services");
        const query = serviceIdQuery(id);
        const result = await servicesCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Service with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Service deleted successfully",
        });
    }
    catch (error) {
        console.error(`[services] Failed to delete service ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete service",
        });
    }
});
exports.default = router;
