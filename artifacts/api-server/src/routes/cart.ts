import { Router } from "express";
import { db } from "@workspace/db";
import {
  cartItemsTable,
  productsTable,
  productVariantsTable,
  addonsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

async function buildCart(userId: number) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.userId, userId));

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, item.productId))
        .limit(1);

      let variantName: string | null = null;

      if (item.variantId) {
        const [variant] = await db
          .select()
          .from(productVariantsTable)
          .where(eq(productVariantsTable.id, item.variantId))
          .limit(1);

        variantName = variant?.name ?? null;
      }

      const addonIds = item.addonIds ?? [];
      let addonNames: string[] = [];
      let addonTotal = 0;

      if (addonIds.length > 0) {
        const addons = await Promise.all(
          addonIds.map(async (aid) => {
            const [a] = await db
              .select()
              .from(addonsTable)
              .where(eq(addonsTable.id, aid))
              .limit(1);
            return a;
          })
        );

        addonNames = addons.filter(Boolean).map((a) => a!.name);
        addonTotal = addons
          .filter(Boolean)
          .reduce(
            (sum, a) => sum + parseFloat(a!.price as unknown as string),
            0
          );
      }

      const unitPrice = parseFloat(item.unitPrice as unknown as string);
      const subtotal = (unitPrice + addonTotal) * item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        productName: product?.name ?? "Unknown",
        productImage: product?.imageUrl ?? null,
        variantId: item.variantId,
        variantName,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        addonIds,
        addonNames,
        addonTotal,
        specialInstructions: item.specialInstructions,
      };
    })
  );

  const subtotal = enriched.reduce((sum, i) => sum + i.subtotal, 0);
  const itemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);

  return { items: enriched, subtotal, itemCount };
}

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const cart = await buildCart(req.user!.id);
    return res.json(cart);
  } catch {
    return res.status(500).json({ error: "Failed to get cart" });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const {
      productId,
      variantId,
      addonIds,
      quantity,
      specialInstructions,
    } = req.body;

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) return res.status(404).json({ error: "Product not found" });
    if (!product.inStock || !product.isAvailable)
      return res.status(400).json({ error: "Product not available" });

    let unitPrice = parseFloat(product.basePrice as unknown as string);

    if (variantId) {
      const [variant] = await db
        .select()
        .from(productVariantsTable)
        .where(eq(productVariantsTable.id, variantId))
        .limit(1);

      if (variant) {
        unitPrice = parseFloat(variant.price as unknown as string);
      }
    }

    const existing = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.userId, req.user!.id),
          eq(cartItemsTable.productId, productId)
        )
      )
      .limit(1);

    if (existing.length > 0 && !variantId && (!addonIds || addonIds.length === 0)) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing[0]!.quantity + (quantity ?? 1) })
        .where(eq(cartItemsTable.id, existing[0]!.id));
    } else {
      await db.insert(cartItemsTable).values({
        userId: req.user!.id,
        productId,
        variantId: variantId ?? null,
        addonIds: addonIds ?? [],
        quantity: quantity ?? 1,
        unitPrice: String(unitPrice),
        specialInstructions: specialInstructions ?? null,
      });
    }

    const cart = await buildCart(req.user!.id);
    return res.json(cart);
  } catch {
    return res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.patch("/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(String(req.params["itemId"]));
    const { quantity } = req.body;

    if (quantity <= 0) {
      await db
        .delete(cartItemsTable)
        .where(
          and(
            eq(cartItemsTable.id, itemId),
            eq(cartItemsTable.userId, req.user!.id)
          )
        );
    } else {
      await db
        .update(cartItemsTable)
        .set({ quantity })
        .where(
          and(
            eq(cartItemsTable.id, itemId),
            eq(cartItemsTable.userId, req.user!.id)
          )
        );
    }

    const cart = await buildCart(req.user!.id);
    return res.json(cart);
  } catch {
    return res.status(500).json({ error: "Failed to update cart item" });
  }
});

router.delete("/:itemId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const itemId = parseInt(String(req.params["itemId"]));

    await db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.id, itemId),
          eq(cartItemsTable.userId, req.user!.id)
        )
      );

    const cart = await buildCart(req.user!.id);
    return res.json(cart);
  } catch {
    return res.status(500).json({ error: "Failed to remove cart item" });
  }
});

router.delete("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .delete(cartItemsTable)
      .where(eq(cartItemsTable.userId, req.user!.id));

    return res.json({ message: "Cart cleared" });
  } catch {
    return res.status(500).json({ error: "Failed to clear cart" });
  }
});

export default router;