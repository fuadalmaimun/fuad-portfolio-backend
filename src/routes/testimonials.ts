import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db";
import { requireAdmin, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function testimonialIdQuery(id: string) {
  const choices: any[] = [{ id }];
  if (id.trim() !== "" && Number.isFinite(Number(id))) choices.push({ id: Number(id) });
  if (ObjectId.isValid(id)) choices.push({ _id: new ObjectId(id) });
  return { $or: choices };
}

/**
 * GET /api/testimonials
 * Public: List all testimonials
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const testimonialsCollection = getCollection("testimonials");
    const testimonials = await testimonialsCollection
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error: any) {
    console.error("[testimonials] Failed to fetch testimonials:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch testimonials",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const testimonial = await getCollection("testimonials").findOne(testimonialIdQuery(req.params.id as string));
    if (!testimonial) { res.status(404).json({ success: false, message: "Testimonial not found" }); return; }
    res.json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch testimonial" });
  }
});

/**
 * POST /api/testimonials
 * Protected: Admin creates a testimonial
 */
router.post("/", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const testimonialsCollection = getCollection("testimonials");
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
  } catch (error: any) {
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
router.put("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const testimonialsCollection = getCollection("testimonials");
    const body = req.body;

    const query = testimonialIdQuery(id);

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };
    delete updateDoc._id;

    const result = await testimonialsCollection.findOneAndUpdate(
      query,
      { $set: updateDoc },
      { returnDocument: "after" }
    );

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
  } catch (error: any) {
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
router.delete("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const testimonialsCollection = getCollection("testimonials");

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
  } catch (error: any) {
    console.error(`[testimonials] Failed to delete testimonial ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete testimonial",
    });
  }
});

export default router;
