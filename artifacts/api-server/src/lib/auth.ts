import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env["JWT_SECRET"] || "food-palace-secret-key-2024";

export function signToken(payload: { id: number; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { id: number; email: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = auth.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin" && req.user?.role !== "super_admin" && req.user?.role !== "staff" && req.user?.role !== "kitchen_staff") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) {
    try {
      req.user = verifyToken(auth.slice(7));
    } catch {
      // ignore
    }
  }
  next();
}
