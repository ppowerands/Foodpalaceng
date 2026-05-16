import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, usersTable, productsTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router = Router();

router.get("/admin/analytics", requireAdmin, async (_req, res) => {
  try {
    const [totals] = await db.select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
    }).from(ordersTable).where(eq(ordersTable.paymentStatus, "confirmed"));

    const today = new Date().toISOString().split("T")[0]!;
    const [todayStats] = await db.select({
      todayOrders: sql<number>`count(*)::int`,
      todayRevenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
    }).from(ordersTable).where(sql`DATE(created_at) = ${today}`);

    const [pendingStats] = await db.select({
      pendingOrders: sql<number>`count(*)::int`,
    }).from(ordersTable).where(eq(ordersTable.status, "pending"));

    const [activeStats] = await db.select({
      activeOrders: sql<number>`count(*)::int`,
    }).from(ordersTable).where(sql`status IN ('preparing', 'out_for_delivery')`);

    const [customerCount] = await db.select({
      total: sql<number>`count(*)::int`,
    }).from(usersTable).where(eq(usersTable.role, "customer"));

    const avgResult = (totals?.totalOrders ?? 0) > 0 ? (totals?.totalRevenue ?? 0) / (totals?.totalOrders ?? 1) : 0;

    return res.json({
      totalOrders: totals?.totalOrders ?? 0,
      totalRevenue: totals?.totalRevenue ?? 0,
      todayOrders: todayStats?.todayOrders ?? 0,
      todayRevenue: todayStats?.todayRevenue ?? 0,
      pendingOrders: pendingStats?.pendingOrders ?? 0,
      activeOrders: activeStats?.activeOrders ?? 0,
      totalCustomers: customerCount?.total ?? 0,
      averageOrderValue: avgResult,
    });
  } catch {
    return res.status(500).json({ error: "Failed to get analytics" });
  }
});

router.get("/admin/analytics/best-sellers", requireAdmin, async (_req, res) => {
  try {
    const results = await db
      .select({
        productId: orderItemsTable.productId,
        productName: orderItemsTable.productName,
        productImage: orderItemsTable.productImage,
        orderCount: sql<number>`sum(quantity)::int`,
        revenue: sql<number>`sum(subtotal::numeric)::float`,
      })
      .from(orderItemsTable)
      .groupBy(orderItemsTable.productId, orderItemsTable.productName, orderItemsTable.productImage)
      .orderBy(desc(sql`sum(quantity)`))
      .limit(10);
    return res.json(results);
  } catch {
    return res.status(500).json({ error: "Failed to get best sellers" });
  }
});

router.get("/admin/analytics/daily-revenue", requireAdmin, async (_req, res) => {
  try {
    const results = await db
      .select({
        date: sql<string>`DATE(created_at)::text`,
        revenue: sql<number>`coalesce(sum(total::numeric), 0)::float`,
        orderCount: sql<number>`count(*)::int`,
      })
      .from(ordersTable)
      .where(sql`created_at >= NOW() - INTERVAL '30 days'`)
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);
    return res.json(results);
  } catch {
    return res.status(500).json({ error: "Failed to get daily revenue" });
  }
});

export default router;
