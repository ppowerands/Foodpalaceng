// @ts-nocheck
import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);
    const counts = await db
      .select({ categoryId: productsTable.categoryId, count: sql<number>`count(*)::int` })
      .from(productsTable)
      .groupBy(productsTable.categoryId);
    const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c.count]));
    return res.json(cats.map((c) => ({ ...c, productCount: countMap[c.id] ?? 0 })));
  } catch {
    return res.status(500).json({ error: "Failed to list categories" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, imageUrl, sortOrder } = req.body;
    const [cat] = await db.insert(categoriesTable).values({ name, slug, description, imageUrl, sortOrder: sortOrder ?? 0 }).returning();
    return res.status(201).json({ ...cat, productCount: 0 });
  } catch {
    return res.status(500).json({ error: "Failed to create category" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));
    const { name, slug, description, imageUrl, sortOrder } = req.body;
    const [cat] = await db.update(categoriesTable).set({ name, slug, description, imageUrl, sortOrder }).where(eq(categoriesTable.id, id)).returning();
    return res.json({ ...cat, productCount: 0 });
  } catch {
    return res.status(500).json({ error: "Failed to update category" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to delete category" });
  }
});

export default router;
