import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import deliveryRouter from "./delivery";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import favoritesRouter from "./favorites";
import settingsRouter from "./settings";
import analyticsRouter from "./analytics";
import adminOrdersRouter from "./admin-orders";

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
