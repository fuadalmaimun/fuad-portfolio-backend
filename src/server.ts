import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDB } from "./config/db";

// Routes
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import aboutRouter from "./routes/about";
import projectsRouter from "./routes/projects";
import skillsRouter from "./routes/skills";
import experiencesRouter from "./routes/experiences";
import educationRouter from "./routes/education";
import servicesRouter from "./routes/services";
import testimonialsRouter from "./routes/testimonials";
import messagesRouter from "./routes/messages";
import settingsRouter from "./routes/settings";
import uploadRouter from "./routes/upload";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// CORS configuration
const allowedOrigins = [
  FRONTEND_URL,
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
].filter((origin): origin is string => Boolean(origin));

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:"))) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-session-token"],
  })
);

// Body and cookie parsing
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("[database] Request could not connect to MongoDB:", error);
    res.status(503).json({ success: false, message: "Database unavailable" });
  }
});

// Health check
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Fuad Portfolio CMS Backend",
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/about", aboutRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/skills", skillsRouter);
app.use("/api/experiences", experiencesRouter);
app.use("/api/education", educationRouter);
app.use("/api/services", servicesRouter);
app.use("/api/testimonials", testimonialsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/upload", uploadRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint "${req.method} ${req.originalUrl}" not found.`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[server-error]", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected internal server error occurred.",
  });
});

// Start Server and Connect DB
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`[server] Fuad Portfolio CMS backend is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("[server] Failed to start server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  void startServer();
}
export default app;
