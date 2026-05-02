const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { auth, adminOnly } = require("../middleware/auth");
const prisma = new PrismaClient();

// GET /api/users — admin only
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
