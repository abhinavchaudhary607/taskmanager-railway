// ============================================================
// TaskForge — Express + Prisma Backend
// Deploy on Railway: https://railway.app
// ============================================================
//
// File structure:
//   server/
//     ├── index.js          ← This file (entry point)
//     ├── prisma/
//     │   └── schema.prisma
//     ├── middleware/
//     │   └── auth.js
//     ├── routes/
//     │   ├── auth.js
//     │   ├── projects.js
//     │   ├── tasks.js
//     │   └── users.js
//     └── package.json
//
// ─── package.json ────────────────────────────────────────────
/*
{
  "name": "taskforge-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon index.js",
    "start": "node index.js",
    "migrate": "prisma migrate deploy",
    "seed": "node prisma/seed.js"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "prisma": "^5.0.0"
  }
}
*/

// ─── prisma/schema.prisma ─────────────────────────────────────
/*
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(MEMBER)
  avatar    String?
  createdAt DateTime @default(now())

  ownedProjects   Project[]       @relation("ProjectOwner")
  projectMembers  ProjectMember[]
  assignedTasks   Task[]
}

enum Role {
  ADMIN
  MEMBER
}

model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String   @default("#4f8ef7")
  ownerId     String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner   User            @relation("ProjectOwner", fields: [ownerId], references: [id])
  members ProjectMember[]
  tasks   Task[]
}

model ProjectMember {
  projectId String
  userId    String

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
}

model Task {
  id          String     @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority   @default(MEDIUM)
  due         DateTime?
  projectId   String
  assigneeId  String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  project  Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User    @relation(fields: [assigneeId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
*/

// ─── middleware/auth.js ───────────────────────────────────────
/*
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN")
    return res.status(403).json({ error: "Admin access required" });
  next();
};

module.exports = { auth, adminOnly };
*/

// ─── routes/auth.js ──────────────────────────────────────────
/*
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "MEMBER" },
    select: { id: true, name: true, email: true, role: true }
  });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

module.exports = router;
*/

// ─── routes/projects.js ──────────────────────────────────────
/*
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
*/

// ─── routes/tasks.js ─────────────────────────────────────────
/*
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
*/

// ─── index.js (entry point) ───────────────────────────────────
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/users", require("./routes/users")); // GET /api/users (admin)

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`TaskForge API on :${PORT}`));
