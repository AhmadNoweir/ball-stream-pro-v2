import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./prisma";
import { requireAuth } from "./middleware";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.json({ success: false, error: "All fields are required" });
  }

  if (password.length < 6) {
    return res.json({ success: false, error: "Password must be at least 6 characters" });
  }

  // Check if email or username already taken
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    const field = existing.email === email ? "Email" : "Username";
    return res.json({ success: false, error: `${field} already taken` });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

  res.json({
    success: true,
    user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    token,
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, error: "Email and password are required" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.json({ success: false, error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.json({ success: false, error: "Invalid email or password" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });

  res.json({
    success: true,
    user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar },
    token,
  });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, (req, res) => {
  // JWT is stateless - client just deletes the token
  res.json({ success: true });
});

// GET /api/auth/profile
router.get("/profile", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ id: user.id, username: user.username, email: user.email, avatar: user.avatar });
});

export default router;
