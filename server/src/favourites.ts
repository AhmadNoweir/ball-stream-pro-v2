import { Router } from "express";
import prisma from "./prisma";
import { requireAuth } from "./middleware";

const router = Router();
router.use(requireAuth);

// GET /api/favourites - returns list of favourite team names
router.get("/", async (req, res) => {
  const userId = req.userId!;
  const favs = await prisma.favourite.findMany({
    where: { userId },
    select: { teamName: true },
  });
  res.json(favs.map((f) => f.teamName));
});

// POST /api/favourites - add a favourite team
router.post("/", async (req, res) => {
  const userId = req.userId!;
  const { teamName } = req.body;

  if (!teamName) {
    return res.status(400).json({ error: "teamName is required" });
  }

  await prisma.favourite.upsert({
    where: { userId_teamName: { userId, teamName } },
    update: {},
    create: { userId, teamName },
  });

  res.json({ success: true });
});

// DELETE /api/favourites/:teamName - remove a favourite team
router.delete("/:teamName", async (req, res) => {
  const userId = req.userId!;
  const teamName = decodeURIComponent(req.params.teamName);

  await prisma.favourite.deleteMany({
    where: { userId, teamName },
  });

  res.json({ success: true });
});

export default router;
