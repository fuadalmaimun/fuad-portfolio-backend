"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/projects
 * Public: List all projects, ordered by sort order or createdAt
 */
router.get("/", async (req, res) => {
    try {
        const projectsCollection = (0, db_1.getCollection)("projects");
        const projects = await projectsCollection
            .find({})
            .sort({ createdAt: -1, _id: -1 })
            .toArray();
        res.json({
            success: true,
            data: projects,
            count: projects.length,
        });
    }
    catch (error) {
        console.error("[projects] Failed to fetch projects:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch projects",
        });
    }
});
/**
 * GET /api/projects/:id
 * Public: Get a single project by id or slug
 */
router.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const projectsCollection = (0, db_1.getCollection)("projects");
        let query = { id };
        if (mongodb_1.ObjectId.isValid(id)) {
            query = { $or: [{ id }, { _id: new mongodb_1.ObjectId(id) }] };
        }
        const project = await projectsCollection.findOne(query);
        if (!project) {
            res.status(404).json({
                success: false,
                message: `Project with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            data: project,
        });
    }
    catch (error) {
        console.error(`[projects] Failed to fetch project ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch project details",
        });
    }
});
/**
 * POST /api/projects
 * Protected: Admin creates a new project
 */
router.post("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const projectsCollection = (0, db_1.getCollection)("projects");
        const body = req.body;
        if (!body.title || !body.description) {
            res.status(400).json({
                success: false,
                message: "Project title and description are required",
            });
            return;
        }
        const newProject = {
            id: body.id || `proj_${Date.now()}`,
            title: body.title,
            category: body.category || "Full Stack Web Application",
            description: body.description,
            detailedDescription: body.detailedDescription || body.description,
            technologies: Array.isArray(body.technologies) ? body.technologies : [],
            image: body.image || "",
            githubUrl: body.githubUrl || "",
            backendGithubUrl: body.backendGithubUrl || "",
            liveUrl: body.liveUrl || "",
            role: body.role || "Full Stack Developer",
            status: body.status || "Completed",
            features: Array.isArray(body.features) ? body.features : [],
            challenges: Array.isArray(body.challenges) ? body.challenges : [],
            stateManagement: body.stateManagement || { summary: "", highlights: [] },
            backendArchitecture: body.backendArchitecture || { summary: "", highlights: [] },
            futurePlans: Array.isArray(body.futurePlans) ? body.futurePlans : [],
            order: typeof body.order === "number" ? body.order : 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const result = await projectsCollection.insertOne(newProject);
        res.status(201).json({
            success: true,
            message: "Project created successfully",
            data: { ...newProject, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[projects] Failed to create project:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to create project",
        });
    }
});
/**
 * PUT /api/projects/:id
 * Protected: Admin updates an existing project
 */
router.put("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const projectsCollection = (0, db_1.getCollection)("projects");
        const body = req.body;
        let query = { id };
        if (mongodb_1.ObjectId.isValid(id)) {
            query = { $or: [{ id }, { _id: new mongodb_1.ObjectId(id) }] };
        }
        const updateDoc = {
            ...body,
            updatedAt: new Date(),
        };
        delete updateDoc._id; // prevent updating immutable _id
        const result = await projectsCollection.findOneAndUpdate(query, { $set: updateDoc }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Project with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Project updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[projects] Failed to update project ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update project",
        });
    }
});
/**
 * DELETE /api/projects/:id
 * Protected: Admin deletes a project
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const projectsCollection = (0, db_1.getCollection)("projects");
        let query = { id };
        if (mongodb_1.ObjectId.isValid(id)) {
            query = { $or: [{ id }, { _id: new mongodb_1.ObjectId(id) }] };
        }
        const result = await projectsCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Project with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Project deleted successfully",
        });
    }
    catch (error) {
        console.error(`[projects] Failed to delete project ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete project",
        });
    }
});
exports.default = router;
