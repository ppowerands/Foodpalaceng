import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, cartItemsTable, productsTable, productVariantsTable, addonsTable, deliveryZonesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin, AuthRequest } from "../lib/auth.js";

const router = Router();

export async function buildOrderResponse(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
  let deliveryZoneName: string | null = null;
  if (order.deliveryZoneId) {
    const [zone] = await db.select({ name: deliveryZonesTable.name }).from(deliveryZonesTable).where(eq(deliveryZonesTable.id, order.deliveryZoneId)).limit(1);
    deliveryZoneName = zone?.name ?? null;
  }
  return {
    id: order.id,
    userId: order.userId,
    customerName: user?.name ?? null,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: parseFloat(order.subtotal as unknown as string),
    deliveryFee: parseFloat(order.deliveryFee as unknown as string),
    total: parseFloat(order.total as unknown as string),
    deliveryAddress: order.deliveryAddress,
    deliveryZoneId: order.deliveryZoneId,
    deliveryZoneName,
    deliveryNotes: order.deliveryNotes,
    estimatedDeliveryMinutes: order.estimatedDeliveryMinutes,
    createdAt: order.createdAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      productName: item.productName,
      productImage: item.productImage,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice as unknown as string),
      subtotal: parseFloat(item.subtotal as unknown as string),
      addonNames: item.addonNames ?? [],
      specialInstructions: item.specialInstructions,
    })),
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.id)).orderBy(desc(ordersTable.createdAt));
    const result = await Promise.all(orders.map(buildOrderResponse));
    return res.json(result);
  } catch {
    return res.status(500).json({ error: "Failed to list orders" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { paymentMethod, deliveryAddress, deliveryZoneId, deliveryNotes } = req.body;
    const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));
    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

    const [zone] = await db.select().from(deliveryZonesTable).where(eq(deliveryZonesTable.id, deliveryZoneId)).limit(1);
    if (!zone) return res.status(400).json({ error: "Invalid delivery zone" });

    const deliveryFee = parseFloat(zone.fee as unknown as string);
    let subtotal = 0;
    const orderItemsData = await Promise.all(cartItems.map(async (item) => {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      let variantName: string | null = null;
      if (item.variantId) {
        const [variant] = await db.select().from(productVariantsTable).where(eq(productVariantsTable.id, item.variantId)).limit(1);
        variantName = variant?.name ?? null;
      }
      const addonIds = item.addonIds ?? [];
      let addonNames: string[] = [];
      let addonTotal = 0;
      if (addonIds.length > 0) {
        const addons = await Promise.all(addonIds.map(async (aid) => {
          const [a] = await db.select().from(addonsTable).where(eq(addonsTable.id, aid)).limit(1);
          return a;
        }));
        addonNames = addons.filter(Boolean).map((a) => a!.name);
        addonTotal = addons.filter(Boolean).reduce((s, a) => s + parseFloat(a!.price as unknown as string), 0);
      }
      const unitPrice = parseFloat(item.unitPrice as unknown as string);
      const lineSubtotal = (unitPrice + addonTotal) * item.quantity;
      subtotal += lineSubtotal;
      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: product?.name ?? "Unknown",
        variantName,
        productImage: product?.imageUrl ?? null,
        addonIds,
        addonNames,
        quantity: item.quantity,
        unitPrice: String(unitPrice),
        subtotal: String(lineSubtotal),
        specialInstructions: item.specialInstructions,
      };
    }));

    const total = subtotal + deliveryFee;
    const paymentStatus = paymentMethod === "cash_on_delivery" ? "pending" : "awaiting_confirmation";

    const [order] = await db.insert(ordersTable).values({
      userId: req.user!.id,
      status: "pending",
      paymentMethod,
      paymentStatus,
      subtotal: String(subtotal),
      deliveryFee: String(deliveryFee),
      total: String(total),
      deliveryAddress,
      deliveryZoneId,
      deliveryNotes: deliveryNotes ?? null,
      estimatedDeliveryMinutes: zone.estimatedMinutes,
    }).returning();

    await db.insert(orderItemsTable).values(orderItemsData.map((oi) => ({ ...oi, orderId: order.id })));
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, req.user!.id));

    // Increment order counts
    for (const item of orderItemsData) {
      await db.update(productsTable).set({ orderCount: (await db.select({ cnt: productsTable.orderCount }).from(productsTable).where(eq(productsTable.id, item.productId)).limit(1))[0]?.cnt + 1 ?? 1 }).where(eq(productsTable.id, item.productId));
    }

    const result = await buildOrderResponse(order);
    return res.status(201).json(result);
  } catch {
    return res.status(500).json({ error: "Failed to place order" });
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user!.id && !["admin", "super_admin", "staff"].includes(req.user!.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    return res.json(await buildOrderResponse(order));
  } catch {
    return res.status(500).json({ error: "Failed to get order" });
  }
});

router.post("/:id/confirm-payment", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
    const [updated] = await db.update(ordersTable).set({ paymentStatus: "awaiting_confirmation" }).where(eq(ordersTable.id, id)).returning();
    return res.json(await buildOrderResponse(updated));
  } catch {
    return res.status(500).json({ error: "Failed to confirm payment" });
  }
});

export default router;
