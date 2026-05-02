const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { auth, adminOnly } = require("../middleware/auth");
const prisma = new PrismaClient();

// GET /api/projects — all (admin) or own (member)
router.get("/", auth, async (req, res) => {
  const where = req.user.role === "ADMIN"
    ? {}
    : { members: { some: { userId: req.user.id } } };

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, role: true } },
      members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      tasks: { select: { id: true, status: true, due: true } }
    }
  });
  res.json(projects);
});

// POST /api/projects — admin only
router.post("/", auth, adminOnly, async (req, res) => {
  const { name, description, color, memberIds } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });

  const ids = [...new Set([req.user.id, ...(memberIds || [])])];
  const project = await prisma.project.create({
    data: {
      name, description, color,
      ownerId: req.user.id,
      members: { create: ids.map(userId => ({ userId })) }
    },
    include: { members: { include: { user: true } }, tasks: true }
  });
  res.status(201).json(project);
});

// PATCH /api/projects/:id — admin only
router.patch("/:id", auth, adminOnly, async (req, res) => {
  const { name, description, color, memberIds } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(memberIds && {
        members: {
          deleteMany: {},
          create: memberIds.map(userId => ({ userId }))
        }
      })
    },
    include: { members: { include: { user: true } }, tasks: true }
  });
  res.json(project);
});

// DELETE /api/projects/:id — admin only
router.delete("/:id", auth, adminOnly, async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

module.exports = router;
