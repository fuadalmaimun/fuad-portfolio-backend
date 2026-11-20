"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleImage = void 0;
const multer_1 = __importDefault(require("multer"));
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WebP, GIF, SVG.`));
    }
};
exports.uploadSingleImage = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
}).single("image");
