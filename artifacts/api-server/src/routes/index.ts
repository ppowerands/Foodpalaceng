import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import productsRouter from "./products.js";
import deliveryRouter from "./delivery.js";
import cartRouter from "./cart.js";
import ordersRouter from "./orders.js";
import favoritesRouter from "./favorites.js";
import settingsRouter from "./settings.js";
import analyticsRouter from "./analytics.js";
import adminOrdersRouter from "./admin-orders.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/products", productsRouter);
router.use("/delivery-zones", deliveryRouter);
router.use("/cart", cartRouter);
router.use("/orders", ordersRouter);
router.use("/favorites", favoritesRouter);
router.use(settingsRouter);
router.use(analyticsRouter);
router.use(adminOrdersRouter);

export default router;