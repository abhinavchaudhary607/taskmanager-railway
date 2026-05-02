const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const { auth, adminOnly } = require("../middleware/auth");
const prisma = new PrismaClient();

const canAccessTask = async (userId, role, taskId) => {
  if (role === "ADMIN") return true;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  return task?.assigneeId === userId;
};

// GET /api/tasks — filtered by role
router.get("/", auth, async (req, res) => {
  const { projectId, assigneeId, status } = req.query;
  const where = {
    ...(projectId && { projectId }),
    ...(assigneeId && { assigneeId }),
    ...(status && { status }),
    ...(req.user.role !== "ADMIN" && {
      project: { members: { some: { userId: req.user.id } } }
    })
  };
  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  res.json(tasks);
});

// POST /api/tasks
router.post("/", auth, async (req, res) => {
  const { title, description, projectId, assigneeId, status, priority, due } = req.body;
  if (!title || !projectId || !assigneeId)
    return res.status(400).json({ error: "title, projectId, assigneeId required" });

  // Members can only assign to themselves
  if (req.user.role !== "ADMIN" && assigneeId !== req.user.id)
    return res.status(403).json({ error: "Members can only assign tasks to themselves" });

  const task = await prisma.task.create({
    data: {
      title, description, projectId, assigneeId,
      status: status || "TODO",
      priority: priority || "MEDIUM",
      due: due ? new Date(due) : null
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } }
    }
  });
  res.status(201).json(task);
});

// PATCH /api/tasks/:id
router.patch("/:id", auth, async (req, res) => {
  const allowed = await canAccessTask(req.user.id, req.user.role, req.params.id);
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  const { title, description, status, priority, due, assigneeId, projectId } = req.body;

  // Members can only change status
  const updateData = req.user.role === "ADMIN"
    ? { title, description, status, priority, due: due ? new Date(due) : undefined, assigneeId, projectId }
    : { status };

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined)),
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, email: true } }
    }
  });
  res.json(task);
});

// DELETE /api/tasks/:id — admin only
router.delete("/:id", auth, adminOnly, async (req, res) => {
  await prisma.task.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

module.exports = router;
