import { Router } from "express";
import { db } from "@workspace/db";
import { favoritesTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const favs = await db
      .select({ productId: favoritesTable.productId })
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, req.user!.id));

    const productIds = favs.map((f) => f.productId);

    if (productIds.length === 0) return res.json([]);

    const products = await Promise.all(
      productIds.map(async (pid) => {
        const [p] = await db
          .select({
            id: productsTable.id,
            name: productsTable.name,
            description: productsTable.description,
            categoryId: productsTable.categoryId,
            categoryName: categoriesTable.name,
            basePrice: productsTable.basePrice,
            imageUrl: productsTable.imageUrl,
            inStock: productsTable.inStock,
            isAvailable: productsTable.isAvailable,
            hasVariants: productsTable.hasVariants,
            orderCount: productsTable.orderCount,
          })
          .from(productsTable)
          .leftJoin(
            categoriesTable,
            eq(productsTable.categoryId, categoriesTable.id)
          )
          .where(eq(productsTable.id, pid))
          .limit(1);

        if (!p) return null;

        return {
          ...p,
          basePrice: parseFloat(String(p.basePrice)),
          categoryName: p.categoryName ?? "",
          isFavorited: true,
        };
      })
    );

    return res.json(products.filter(Boolean));
  } catch {
    return res.status(500).json({ error: "Failed to list favorites" });
  }
});

router.post("/:productId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawId = req.params["productId"];
    const productId = parseInt(Array.isArray(rawId) ? rawId[0] : String(rawId));

    const existing = await db
      .select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, req.user!.id),
          eq(favoritesTable.productId, productId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(favoritesTable).values({
        userId: req.user!.id,
        productId,
      });
    }

    return res.json({ message: "Added to favorites" });
  } catch {
    return res.status(500).json({ error: "Failed to add favorite" });
  }
});

router.delete("/:productId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawId = req.params["productId"];
    const productId = parseInt(Array.isArray(rawId) ? rawId[0] : String(rawId));

    await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.userId, req.user!.id),
          eq(favoritesTable.productId, productId)
        )
      );

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to remove favorite" });
  }
});

export default router;