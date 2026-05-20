import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signToken, requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

//@ts-ignore
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields required" });
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, phone, role: "customer" }).returning();
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (err) {
    return res.status(500).json({ error: "Registration failed" });
  }
});
//@ts-ignore

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  }
//@ts-ignore
});

router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const adminRoles = ["admin", "super_admin", "staff", "kitchen_staff"];
    if (!adminRoles.includes(user.role)) return res.status(403).json({ error: "Not an admin account" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch {
    return res.status(500).json({ error: "Login failed" });
  //@ts-ignore
}
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } catch {
    return res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
