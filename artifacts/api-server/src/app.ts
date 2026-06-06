import express, { type Express } from "express";
import cors from "cors";
import { isDatabaseConfigured } from "@workspace/db";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path === "/api/healthz" || isDatabaseConfigured) {
    next();
    return;
  }

  res.status(503).json({ error: "Database is not configured" });
});

app.use("/api", router);

export default app;
