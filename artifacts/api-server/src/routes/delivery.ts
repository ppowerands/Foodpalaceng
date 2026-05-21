import { Router } from "express";
import { db } from "@workspace/db";
import { deliveryZonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const zones = await db
      .select()
      .from(deliveryZonesTable)
      .orderBy(deliveryZonesTable.fee);

    return res.json(
      zones.map((z) => ({
        ...z,
        fee: parseFloat(z.fee as unknown as string),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to list delivery zones" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const { name, fee, areas, estimatedMinutes } = req.body;

    const [zone] = await db
      .insert(deliveryZonesTable)
      .values({
        name,
        fee: String(fee),
        areas: areas ?? [],
        estimatedMinutes: estimatedMinutes ?? 45,
      })
      .returning();

    return res.status(201).json({
      ...zone,
      fee: parseFloat(zone.fee as unknown as string),
    });
  } catch {
    return res.status(500).json({ error: "Failed to create delivery zone" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const { name, fee, areas, estimatedMinutes } = req.body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (fee !== undefined) updateData.fee = String(fee);
    if (areas !== undefined) updateData.areas = areas;
    if (estimatedMinutes !== undefined) updateData.estimatedMinutes = estimatedMinutes;

    const [zone] = await db
      .update(deliveryZonesTable)
      .set(updateData)
      .where(eq(deliveryZonesTable.id, id))
      .returning();

    return res.json({
      ...zone,
      fee: parseFloat(zone.fee as unknown as string),
    });
  } catch {
    return res.status(500).json({ error: "Failed to update delivery zone" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    await db.delete(deliveryZonesTable).where(eq(deliveryZonesTable.id, id));

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to delete delivery zone" });
  }
});

export default router;