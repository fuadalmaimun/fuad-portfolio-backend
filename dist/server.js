"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const profile_1 = __importDefault(require("./routes/profile"));
const about_1 = __importDefault(require("./routes/about"));
const projects_1 = __importDefault(require("./routes/projects"));
const skills_1 = __importDefault(require("./routes/skills"));
const experiences_1 = __importDefault(require("./routes/experiences"));
const education_1 = __importDefault(require("./routes/education"));
const services_1 = __importDefault(require("./routes/services"));
const testimonials_1 = __importDefault(require("./routes/testimonials"));
const messages_1 = __importDefault(require("./routes/messages"));
const settings_1 = __importDefault(require("./routes/settings"));
const upload_1 = __importDefault(require("./routes/upload"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;
// CORS configuration
const allowedOrigins = [
    FRONTEND_URL,
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
].filter((origin) => Boolean(origin));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:"))) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-token"],
}));
// Body and cookie parsing
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "15mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "15mb" }));
app.use(async (req, res, next) => {
    try {
        await (0, db_1.connectDB)();
        next();
    }
    catch (error) {
        console.error("[database] Request could not connect to MongoDB:", error);
        res.status(503).json({ success: false, message: "Database unavailable" });
    }
});
// Health check
app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "Fuad Portfolio CMS Backend",
    });
});
// API Routes
app.use("/api/auth", auth_1.default);
app.use("/api/profile", profile_1.default);
app.use("/api/about", about_1.default);
app.use("/api/projects", projects_1.default);
app.use("/api/skills", skills_1.default);
app.use("/api/experiences", experiences_1.default);
app.use("/api/education", education_1.default);
app.use("/api/services", services_1.default);
app.use("/api/testimonials", testimonials_1.default);
app.use("/api/messages", messages_1.default);
app.use("/api/settings", settings_1.default);
app.use("/api/upload", upload_1.default);
// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint "${req.method} ${req.originalUrl}" not found.`,
    });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error("[server-error]", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected internal server error occurred.",
    });
});
// Start Server and Connect DB
async function startServer() {
    try {
        await (0, db_1.connectDB)();
        app.listen(PORT, () => {
            console.log(`[server] Fuad Portfolio CMS backend is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error("[server] Failed to start server:", error);
        process.exit(1);
    }
}
if (require.main === module) {
    void startServer();
}
exports.default = app;
