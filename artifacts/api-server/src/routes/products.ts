import { Router } from "express";
import { db } from "@workspace/db";
import {
  productsTable,
  categoriesTable,
  productVariantsTable,
  addonsTable,
  favoritesTable
} from "@workspace/db";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { requireAdmin, optionalAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { categoryId, search, inStock } = req.query;

    let query = db
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
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

    const conditions = [];

    if (categoryId) {
      conditions.push(eq(productsTable.categoryId, parseInt(String(categoryId))));
    }

    if (search) {
      conditions.push(ilike(productsTable.name, `%${String(search)}%`));
    }

    if (inStock === "true") {
      conditions.push(eq(productsTable.inStock, true));
    }

    const products =
      conditions.length > 0 ? await query.where(and(...conditions)) : await query;

    let favoriteIds = new Set<number>();

    if (req.user) {
      const favs = await db
        .select({ productId: favoritesTable.productId })
        .from(favoritesTable)
        .where(eq(favoritesTable.userId, req.user.id));

      favoriteIds = new Set(favs.map((f) => f.productId));
    }

    return res.json(
      products.map((p) => ({
        ...p,
        basePrice: parseFloat(p.basePrice as unknown as string),
        categoryName: p.categoryName ?? "",
        isFavorited: favoriteIds.has(p.id),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to list products" });
  }
});

router.get("/featured", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const products = await db
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
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isAvailable, true))
      .orderBy(desc(productsTable.orderCount))
      .limit(8);

    let favoriteIds = new Set<number>();

    if (req.user) {
      const favs = await db
        .select({ productId: favoritesTable.productId })
        .from(favoritesTable)
        .where(eq(favoritesTable.userId, req.user.id));

      favoriteIds = new Set(favs.map((f) => f.productId));
    }

    return res.json(
      products.map((p) => ({
        ...p,
        basePrice: parseFloat(p.basePrice as unknown as string),
        categoryName: p.categoryName ?? "",
        isFavorited: favoriteIds.has(p.id),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to get featured products" });
  }
});

router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const [product] = await db
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
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const variants = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, id));

    const addons = await db
      .select()
      .from(addonsTable)
      .where(eq(addonsTable.productId, id));

    let isFavorited = false;

    if (req.user) {
      const [fav] = await db
        .select()
        .from(favoritesTable)
        .where(
          and(
            eq(favoritesTable.userId, req.user.id),
            eq(favoritesTable.productId, id)
          )
        )
        .limit(1);

      isFavorited = !!fav;
    }

    return res.json({
      ...product,
      basePrice: parseFloat(product.basePrice as unknown as string),
      categoryName: product.categoryName ?? "",
      isFavorited,
      variants: variants.map((v) => ({
        ...v,
        price: parseFloat(v.price as unknown as string),
      })),
      addons: addons.map((a) => ({
        ...a,
        price: parseFloat(a.price as unknown as string),
      })),
    });
  } catch {
    return res.status(500).json({ error: "Failed to get product" });
  }
});

router.post("/", requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      categoryId,
      basePrice,
      imageUrl,
      inStock,
      isAvailable,
      hasVariants,
    } = req.body;

    const [product] = await db
      .insert(productsTable)
      .values({
        name,
        description,
        categoryId,
        basePrice: String(basePrice),
        imageUrl,
        inStock: inStock ?? true,
        isAvailable: isAvailable ?? true,
        hasVariants: hasVariants ?? false,
      })
      .returning();

    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId))
      .limit(1);

    return res.status(201).json({
      ...product,
      basePrice: parseFloat(product.basePrice as unknown as string),
      categoryName: cat?.name ?? "",
      isFavorited: false,
    });
  } catch {
    return res.status(500).json({ error: "Failed to create product" });
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const {
      name,
      description,
      categoryId,
      basePrice,
      imageUrl,
      inStock,
      isAvailable,
      hasVariants,
    } = req.body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (basePrice !== undefined) updateData.basePrice = String(basePrice);
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (inStock !== undefined) updateData.inStock = inStock;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (hasVariants !== undefined) updateData.hasVariants = hasVariants;

    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, id))
      .returning();

    const [cat] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId))
      .limit(1);

    return res.json({
      ...product,
      basePrice: parseFloat(product.basePrice as unknown as string),
      categoryName: cat?.name ?? "",
      isFavorited: false,
    });
  } catch {
    return res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    await db.delete(productsTable).where(eq(productsTable.id, id));

    return res.status(204).send();
  } catch {
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

router.get("/:id/variants", async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const variants = await db
      .select()
      .from(productVariantsTable)
      .where(eq(productVariantsTable.productId, id));

    return res.json(
      variants.map((v) => ({
        ...v,
        price: parseFloat(v.price as unknown as string),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to list variants" });
  }
});

router.post("/:id/variants", requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(String(req.params["id"]));

    const { name, price, description } = req.body;

    const [v] = await db
      .insert(productVariantsTable)
      .values({
        productId,
        name,
        price: String(price),
        description,
      })
      .returning();

    return res.status(201).json({
      ...v,
      price: parseFloat(v.price as unknown as string),
    });
  } catch {
    return res.status(500).json({ error: "Failed to create variant" });
  }
});

router.get("/:id/addons", async (req, res) => {
  try {
    const id = parseInt(String(req.params["id"]));

    const addons = await db
      .select()
      .from(addonsTable)
      .where(eq(addonsTable.productId, id));

    return res.json(
      addons.map((a) => ({
        ...a,
        price: parseFloat(a.price as unknown as string),
      }))
    );
  } catch {
    return res.status(500).json({ error: "Failed to list addons" });
  }
});

router.post("/:id/addons", requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(String(req.params["id"]));

    const { name, price } = req.body;

    const [a] = await db
      .insert(addonsTable)
      .values({
        productId,
        name,
        price: String(price),
      })
      .returning();

    return res.status(201).json({
      ...a,
      price: parseFloat(a.price as unknown as string),
    });
  } catch {
    return res.status(500).json({ error: "Failed to create addon" });
  }
});

export default router;