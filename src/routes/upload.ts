import { Router, Response } from "express";
import { uploadSingleImage } from "../middleware/upload";
import { requireAdmin, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

/**
 * POST /api/upload
 * Protected: Requires Admin authentication
 * Uploads an image to ImageBB and returns the hosted URL.
 */
router.post(
  "/",
  requireAdmin,
  (req: AuthenticatedRequest, res: Response): void => {
    uploadSingleImage(req, res, async (err) => {
      if (err) {
        res.status(400).json({
          success: false,
          message: err.message || "Failed to process image file upload.",
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No image file provided in request (expected field name: 'image').",
        });
        return;
      }

      const apiKey = process.env.IMGBB_API_KEY;
      if (!apiKey || apiKey.trim() === "") {
        res.status(503).json({
          success: false,
          message:
            "ImageBB API key is not configured in backend environment. Please set IMGBB_API_KEY in backend/.env",
        });
        return;
      }

      try {
        const formData = new FormData();
        // Copy into a standalone ArrayBuffer so Node's Buffer<ArrayBufferLike>
        // is accepted by the DOM BlobPart type definitions.
        const imageBytes = Uint8Array.from(req.file.buffer);
        const blob = new Blob([imageBytes], {
          type: req.file.mimetype || "image/png",
        });
        formData.append("image", blob, req.file.originalname || "image.png");

        if (req.file.originalname) {
          formData.append("name", req.file.originalname.replace(/\.[^/.]+$/, ""));
        }

        const response = await fetch(
          `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey.trim())}`,
          {
            method: "POST",
            body: formData,
          }
        );

        const result: any = await response.json();

        if (result.success && result.data?.url) {
          res.json({
            success: true,
            message: "Image uploaded successfully to ImageBB",
            data: {
              url: result.data.url,
              display_url: result.data.display_url || result.data.url,
              thumb_url: result.data.thumb?.url || result.data.url,
              delete_url: result.data.delete_url,
              size: result.data.size,
              width: result.data.width,
              height: result.data.height,
            },
          });
        } else {
          console.error("[upload] ImageBB error response:", result);
          res.status(502).json({
            success: false,
            message:
              result.error?.message ||
              "ImageBB rejected the upload. Verify that your API key is valid.",
          });
        }
      } catch (uploadError: any) {
        console.error("[upload] Failed to connect to ImageBB:", uploadError);
        res.status(502).json({
          success: false,
          message:
            "Could not connect to ImageBB API. Please check network connectivity or try again later.",
        });
      }
    });
  }
);

export default router;
