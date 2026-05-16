import { Router } from "express";
import { db } from "@workspace/db";
import { restaurantSettingsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

async function getOrCreateSettings() {
  const existing = await db.select().from(restaurantSettingsTable).limit(1);
  if (existing.length > 0) return existing[0]!;
  const [settings] = await db.insert(restaurantSettingsTable).values({}).returning();
  return settings;
}

router.get("/settings", async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch {
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    const settings = await getOrCreateSettings();
    return res.json(settings);
  } catch {
    return res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/admin/settings", requireAdmin, async (req, res) => {
  try {
    const { isOpen, openingTime, closingTime, estimatedDeliveryMin, estimatedDeliveryMax, bankName, accountName, accountNumber, whatsappNumber } = req.body;
    const settings = await getOrCreateSettings();
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (isOpen !== undefined) updateData["isOpen"] = isOpen;
    if (openingTime !== undefined) updateData["openingTime"] = openingTime;
    if (closingTime !== undefined) updateData["closingTime"] = closingTime;
    if (estimatedDeliveryMin !== undefined) updateData["estimatedDeliveryMin"] = estimatedDeliveryMin;
    if (estimatedDeliveryMax !== undefined) updateData["estimatedDeliveryMax"] = estimatedDeliveryMax;
    if (bankName !== undefined) updateData["bankName"] = bankName;
    if (accountName !== undefined) updateData["accountName"] = accountName;
    if (accountNumber !== undefined) updateData["accountNumber"] = accountNumber;
    if (whatsappNumber !== undefined) updateData["whatsappNumber"] = whatsappNumber;
    const { eq } = await import("drizzle-orm");
    const [updated] = await db.update(restaurantSettingsTable).set(updateData).where(eq(restaurantSettingsTable.id, settings.id)).returning();
    return res.json(updated);
  } catch {
    return res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
