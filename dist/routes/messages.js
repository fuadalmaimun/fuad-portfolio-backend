"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongodb_1 = require("mongodb");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS = {
    name: { min: 2, max: 80 },
    subject: { max: 120 },
    message: { min: 10, max: 2000 },
};
/**
 * POST /api/messages
 * Public: Validate and save a visitor's contact message into MongoDB.
 */
router.post("/", async (req, res) => {
    try {
        const { name, email, subject, message, company } = req.body;
        // Honeypot check: bots fill hidden company field
        if (company) {
            res.json({
                ok: true,
                success: true,
                message: "Message received successfully.",
            });
            return;
        }
        const errors = {};
        const cleanName = String(name ?? "").trim();
        const cleanEmail = String(email ?? "").trim();
        const cleanSubject = String(subject ?? "").trim();
        const cleanMessage = String(message ?? "").trim();
        if (!cleanName) {
            errors.name = "Please enter your name.";
        }
        else if (cleanName.length < LIMITS.name.min) {
            errors.name = `Name must be at least ${LIMITS.name.min} characters.`;
        }
        else if (cleanName.length > LIMITS.name.max) {
            errors.name = `Name must be under ${LIMITS.name.max} characters.`;
        }
        if (!cleanEmail) {
            errors.email = "Please enter your email address.";
        }
        else if (!EMAIL_PATTERN.test(cleanEmail)) {
            errors.email = "Enter a valid email address.";
        }
        if (cleanSubject.length > LIMITS.subject.max) {
            errors.subject = `Subject must be under ${LIMITS.subject.max} characters.`;
        }
        if (!cleanMessage) {
            errors.message = "Please write a message.";
        }
        else if (cleanMessage.length < LIMITS.message.min) {
            errors.message = `Message must be at least ${LIMITS.message.min} characters.`;
        }
        else if (cleanMessage.length > LIMITS.message.max) {
            errors.message = `Message must be under ${LIMITS.message.max} characters.`;
        }
        if (Object.keys(errors).length > 0) {
            res.status(400).json({
                ok: false,
                success: false,
                code: "VALIDATION",
                errors,
                message: "Validation failed. Please correct the errors and try again.",
            });
            return;
        }
        const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            "unknown";
        const messagesCollection = (0, db_1.getCollection)("messages");
        const newMessage = {
            id: `msg_${Date.now()}`,
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject || "New portfolio enquiry",
            message: cleanMessage,
            isRead: false,
            ip: clientIp,
            createdAt: new Date(),
        };
        const result = await messagesCollection.insertOne(newMessage);
        res.status(201).json({
            ok: true,
            success: true,
            message: "Thanks! Your message has been sent — I'll get back to you within 24 hours.",
            data: { ...newMessage, _id: result.insertedId },
        });
    }
    catch (error) {
        console.error("[messages] Error saving message:", error);
        res.status(500).json({
            ok: false,
            success: false,
            message: "Internal server error saving your message. Please try again or email directly.",
        });
    }
});
/**
 * GET /api/messages
 * Protected: Admin view all messages
 */
router.get("/", auth_1.requireAdmin, async (req, res) => {
    try {
        const messagesCollection = (0, db_1.getCollection)("messages");
        const messages = await messagesCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
        const unreadCount = messages.filter((m) => !m.isRead).length;
        res.json({
            success: true,
            data: messages,
            count: messages.length,
            unreadCount,
        });
    }
    catch (error) {
        console.error("[messages] Failed to retrieve messages:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve messages",
        });
    }
});
/**
 * PATCH /api/messages/:id/read
 * Protected: Admin toggle read status
 */
router.patch("/:id/read", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { isRead } = req.body;
        const messagesCollection = (0, db_1.getCollection)("messages");
        let query = { id };
        if (mongodb_1.ObjectId.isValid(id)) {
            query = { $or: [{ id }, { _id: new mongodb_1.ObjectId(id) }] };
        }
        const result = await messagesCollection.findOneAndUpdate(query, { $set: { isRead: typeof isRead === "boolean" ? isRead : true, readAt: new Date() } }, { returnDocument: "after" });
        if (!result) {
            res.status(404).json({
                success: false,
                message: `Message with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Message status updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error(`[messages] Failed to update message ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to update message status",
        });
    }
});
/**
 * DELETE /api/messages/:id
 * Protected: Admin delete a message
 */
router.delete("/:id", auth_1.requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const messagesCollection = (0, db_1.getCollection)("messages");
        let query = { id };
        if (mongodb_1.ObjectId.isValid(id)) {
            query = { $or: [{ id }, { _id: new mongodb_1.ObjectId(id) }] };
        }
        const result = await messagesCollection.deleteOne(query);
        if (result.deletedCount === 0) {
            res.status(404).json({
                success: false,
                message: `Message with ID "${id}" was not found`,
            });
            return;
        }
        res.json({
            success: true,
            message: "Message deleted successfully",
        });
    }
    catch (error) {
        console.error(`[messages] Failed to delete message ${req.params.id}:`, error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to delete message",
        });
    }
});
exports.default = router;
