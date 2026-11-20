import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../config/db";
import { requireAdmin, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function skillIdQuery(id: string) {
  const choices: any[] = [{ id }];
  if (id.trim() !== "" && Number.isFinite(Number(id))) choices.push({ id: Number(id) });
  if (ObjectId.isValid(id)) choices.push({ _id: new ObjectId(id) });
  return { $or: choices };
}

/**
 * GET /api/skills
 * Public: List all skills
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const skillsCollection = getCollection("skills");
    const skills = await skillsCollection.find({}).sort({ order: 1, name: 1 }).toArray();

    res.json({
      success: true,
      data: skills,
      count: skills.length,
    });
  } catch (error: any) {
    console.error("[skills] Failed to fetch skills:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch skills",
    });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const skill = await getCollection("skills").findOne(skillIdQuery(req.params.id as string));
    if (!skill) { res.status(404).json({ success: false, message: "Skill not found" }); return; }
    res.json({ success: true, data: skill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch skill" });
  }
});

/**
 * POST /api/skills
 * Protected: Admin creates a skill
 */
router.post("/", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const skillsCollection = getCollection("skills");
    const body = req.body;

    if (!body.name || !body.category) {
      res.status(400).json({
        success: false,
        message: "Skill name and category are required",
      });
      return;
    }

    const newSkill = {
      id: body.id || `skill_${Date.now()}`,
      name: body.name,
      category: body.category,
      proficiency: body.proficiency || "intermediate",
      icon: body.icon || "Code",
      description: body.description || "",
      order: typeof body.order === "number" ? body.order : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await skillsCollection.insertOne(newSkill);

    res.status(201).json({
      success: true,
      message: "Skill created successfully",
      data: { ...newSkill, _id: result.insertedId },
    });
  } catch (error: any) {
    console.error("[skills] Failed to create skill:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create skill",
    });
  }
});

/**
 * PUT /api/skills/:id
 * Protected: Admin updates a skill
 */
router.put("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const skillsCollection = getCollection("skills");
    const body = req.body;

    const query = skillIdQuery(id);

    const updateDoc = {
      ...body,
      updatedAt: new Date(),
    };
    delete updateDoc._id;

    const result = await skillsCollection.findOneAndUpdate(
      query,
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      res.status(404).json({
        success: false,
        message: `Skill with ID "${id}" was not found`,
      });
      return;
    }

    res.json({
      success: true,
      message: "Skill updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(`[skills] Failed to update skill ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update skill",
    });
  }
});

/**
 * DELETE /api/skills/:id
 * Protected: Admin deletes a skill
 */
router.delete("/:id", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const skillsCollection = getCollection("skills");

    const query = skillIdQuery(id);

    const result = await skillsCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      res.status(404).json({
        success: false,
        message: `Skill with ID "${id}" was not found`,
      });
      return;
    }

    res.json({
      success: true,
      message: "Skill deleted successfully",
    });
  } catch (error: any) {
    console.error(`[skills] Failed to delete skill ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete skill",
    });
  }
});

export default router;
