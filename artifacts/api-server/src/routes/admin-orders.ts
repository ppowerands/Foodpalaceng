import { Router } from "express";
import { db } from "../../../lib/db/src/index.js";
import { ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";
import { buildOrderResponse } from "./orders.js";

const router = Router();

router.get("/admin/orders", requireAdmin, async (req, res) => {
  try {
    const status = String(req.query.status ?? "");
    const paymentStatus = String(req.query.paymentStatus ?? "");

    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));

    let filtered = orders;

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (paymentStatus) {
      filtered = filtered.filter((o) => o.paymentStatus === paymentStatus);
    }

    const result = await Promise.all(filtered.map(buildOrderResponse));
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Failed to list orders" });
  }
});

router.patch("/admin/orders/:id/status", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const { status } = req.body;

    const [order] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json(await buildOrderResponse(order));
  } catch {
    return res.status(500).json({ error: "Failed to update order status" });
  }
});

router.patch(
  "/admin/orders/:id/payment-status",
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseInt(String(req.params["id"]));

      const { paymentStatus } = req.body;

      const [order] = await db
        .update(ordersTable)
        .set({ paymentStatus })
        .where(eq(ordersTable.id, id))
        .returning();

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.json(await buildOrderResponse(order));
    } catch {
      return res.status(500).json({ error: "Failed to update payment status" });
    }
  }
);

export default router;