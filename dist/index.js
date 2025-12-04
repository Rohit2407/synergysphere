var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  discussions: () => discussions,
  discussionsRelations: () => discussionsRelations,
  insertDiscussionSchema: () => insertDiscussionSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertTaskCommentSchema: () => insertTaskCommentSchema,
  insertTaskSchema: () => insertTaskSchema,
  insertUserSchema: () => insertUserSchema,
  projectMembers: () => projectMembers,
  projectMembersRelations: () => projectMembersRelations,
  projects: () => projects,
  projectsRelations: () => projectsRelations,
  taskComments: () => taskComments,
  taskCommentsRelations: () => taskCommentsRelations,
  tasks: () => tasks,
  tasksRelations: () => tasksRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  icon: text("icon").default("fas fa-folder"),
  status: text("status").default("active"),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull()
});
var tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  assigneeId: varchar("assignee_id").references(() => users.id),
  status: text("status").default("to-do"),
  // to-do, in-progress, done
  priority: text("priority").default("medium"),
  // low, medium, high
  tags: text("tags").array().default(sql`'{}'::text[]`),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var discussions = pgTable("discussions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var usersRelations = relations(users, ({ many }) => ({
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  assignedTasks: many(tasks),
  taskComments: many(taskComments),
  discussions: many(discussions)
}));
var projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id]
  }),
  members: many(projectMembers),
  tasks: many(tasks),
  discussions: many(discussions)
}));
var projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id]
  })
}));
var tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id]
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id]
  }),
  comments: many(taskComments)
}));
var taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id]
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id]
  })
}));
var discussionsRelations = relations(discussions, ({ one }) => ({
  project: one(projects, {
    fields: [discussions.projectId],
    references: [projects.id]
  }),
  user: one(users, {
    fields: [discussions.userId],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true
});
var insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true
});
var insertDiscussionSchema = createInsertSchema(discussions).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Example: postgres://user:password@localhost:5432/synergysphere");
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, desc, asc, sql as sql2 } from "drizzle-orm";
import bcrypt from "bcrypt";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
    return user;
  }
  async validatePassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }
  async getProjectsByUserId(userId) {
    const userProjects = await db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      icon: projects.icon,
      status: projects.status,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      createdAt: projects.createdAt
    }).from(projects).leftJoin(projectMembers, eq(projects.id, projectMembers.projectId)).where(
      and(
        eq(projectMembers.userId, userId)
      )
    );
    const projectsWithCounts = await Promise.all(
      userProjects.map(async (project) => {
        const [memberCount] = await db.select({ count: sql2`count(*)` }).from(projectMembers).where(eq(projectMembers.projectId, project.id));
        const [taskCount] = await db.select({ count: sql2`count(*)` }).from(tasks).where(eq(tasks.projectId, project.id));
        const [completedTaskCount] = await db.select({ count: sql2`count(*)` }).from(tasks).where(and(
          eq(tasks.projectId, project.id),
          eq(tasks.status, "done")
        ));
        return {
          ...project,
          memberCount: memberCount?.count || 0,
          taskCount: taskCount?.count || 0,
          completedTaskCount: completedTaskCount?.count || 0
        };
      })
    );
    return projectsWithCounts;
  }
  async getProjectById(id, userId) {
    const [project] = await db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      ownerId: projects.ownerId,
      icon: projects.icon,
      status: projects.status,
      startDate: projects.startDate,
      dueDate: projects.dueDate,
      createdAt: projects.createdAt
    }).from(projects).leftJoin(projectMembers, eq(projects.id, projectMembers.projectId)).where(
      and(
        eq(projects.id, id),
        eq(projectMembers.userId, userId)
      )
    );
    return project || void 0;
  }
  async createProject(project) {
    const [newProject] = await db.insert(projects).values(project).returning();
    await db.insert(projectMembers).values({
      projectId: newProject.id,
      userId: newProject.ownerId,
      role: "owner"
    });
    return newProject;
  }
  async addProjectMember(projectId, userId, role = "member") {
    await db.insert(projectMembers).values({
      projectId,
      userId,
      role
    });
  }
  async getProjectMembers(projectId) {
    const members = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        full_Name: users.full_name,
        password: users.password,
        createdAt: users.createdAt
      }
    }).from(projectMembers).leftJoin(users, eq(projectMembers.userId, users.id)).where(eq(projectMembers.projectId, projectId));
    return members.map((member) => ({
      ...member,
      user: member.user
    }));
  }
  async getTasksByProjectId(projectId) {
    const projectTasks = await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      projectId: tasks.projectId,
      assigneeId: tasks.assigneeId,
      status: tasks.status,
      priority: tasks.priority,
      tags: tasks.tags,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assignee: {
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        password: users.password,
        createdAt: users.createdAt
      }
    }).from(tasks).leftJoin(users, eq(tasks.assigneeId, users.id)).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.createdAt));
    return projectTasks.map((task) => ({
      ...task,
      assignee: task.assignee || void 0
    }));
  }
  async getTaskById(id) {
    const [task] = await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      projectId: tasks.projectId,
      assigneeId: tasks.assigneeId,
      status: tasks.status,
      priority: tasks.priority,
      tags: tasks.tags,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assignee: {
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        password: users.password,
        createdAt: users.createdAt
      }
    }).from(tasks).leftJoin(users, eq(tasks.assigneeId, users.id)).where(eq(tasks.id, id));
    if (!task) return void 0;
    return {
      ...task,
      assignee: task.assignee || void 0
    };
  }
  async createTask(task) {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
  async updateTask(id, updates) {
    const [updatedTask] = await db.update(tasks).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(tasks.id, id)).returning();
    return updatedTask || void 0;
  }
  async deleteTask(id) {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount || 0) > 0;
  }
  async getTaskComments(taskId) {
    const comments = await db.select({
      id: taskComments.id,
      taskId: taskComments.taskId,
      userId: taskComments.userId,
      content: taskComments.content,
      createdAt: taskComments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        password: users.password,
        createdAt: users.createdAt
      }
    }).from(taskComments).leftJoin(users, eq(taskComments.userId, users.id)).where(eq(taskComments.taskId, taskId)).orderBy(asc(taskComments.createdAt));
    return comments.map((comment) => ({
      ...comment,
      user: comment.user
    }));
  }
  async createTaskComment(comment) {
    const [newComment] = await db.insert(taskComments).values(comment).returning();
    return newComment;
  }
  async getProjectDiscussions(projectId) {
    const projectDiscussions = await db.select({
      id: discussions.id,
      projectId: discussions.projectId,
      userId: discussions.userId,
      title: discussions.title,
      content: discussions.content,
      createdAt: discussions.createdAt,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        password: users.password,
        createdAt: users.createdAt
      }
    }).from(discussions).leftJoin(users, eq(discussions.userId, users.id)).where(eq(discussions.projectId, projectId)).orderBy(desc(discussions.createdAt));
    return projectDiscussions.map((discussion) => ({
      ...discussion,
      user: discussion.user
    }));
  }
  async createDiscussion(discussion) {
    const [newDiscussion] = await db.insert(discussions).values(discussion).returning();
    return newDiscussion;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(asc(users.fullName));
  }
  async getUserTasks(userId) {
    const userTasks = await db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      projectId: tasks.projectId,
      assigneeId: tasks.assigneeId,
      status: tasks.status,
      priority: tasks.priority,
      tags: tasks.tags,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      assignee: {
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        password: users.password,
        createdAt: users.createdAt
      },
      project: {
        id: projects.id,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        icon: projects.icon,
        status: projects.status,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt
      }
    }).from(tasks).leftJoin(users, eq(tasks.assigneeId, users.id)).innerJoin(projects, eq(tasks.projectId, projects.id)).innerJoin(projectMembers, and(
      eq(projectMembers.projectId, projects.id),
      eq(projectMembers.userId, userId)
    )).orderBy(desc(tasks.createdAt));
    return userTasks.map((task) => ({
      ...task,
      assignee: task.assignee?.id ? task.assignee : void 0,
      project: task.project
    }));
  }
  async searchUsers(query) {
    return await db.select().from(users).where(sql2`
        ${users.fullName} ILIKE ${`%${query}%`} OR 
        ${users.username} ILIKE ${`%${query}%`} OR 
        ${users.email} ILIKE ${`%${query}%`}
      `).limit(10).orderBy(asc(users.fullName));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var registerSchema = insertUserSchema.extend({
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.SESSION_SECRET || "synergy-sphere-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(new LocalStrategy({
    usernameField: "email",
    passwordField: "password"
  }, async (email, password, done) => {
    try {
      const user = await storage.validatePassword(email, password);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: "Invalid email or password" });
      }
    } catch (error) {
      return done(error);
    }
  }));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };
  app2.post("/api/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const { confirmPassword, ...userData } = data;
      const user = await storage.createUser(userData);
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        res.json({ id: user.id, email: user.email, fullName: user.fullName, username: user.username });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        req.login(user, (err2) => {
          if (err2) {
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ id: user.id, email: user.email, fullName: user.fullName, username: user.username });
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/me", requireAuth, (req, res) => {
    const user = req.user;
    res.json({ id: user.id, email: user.email, fullName: user.fullName, username: user.username });
  });
  app2.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const projects2 = await storage.getProjectsByUserId(user.id);
      res.json(projects2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  app2.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const project = await storage.getProjectById(req.params.id, user.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  app2.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const data = insertProjectSchema.parse({ ...req.body, ownerId: user.id });
      const project = await storage.createProject(data);
      res.json(project);
      broadcastToProject(project.id, {
        type: "PROJECT_CREATED",
        data: project
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  app2.get("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });
  app2.post("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const { userId, role } = req.body;
      await storage.addProjectMember(req.params.id, userId, role);
      res.json({ message: "Member added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add member" });
    }
  });
  app2.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    try {
      const tasks2 = await storage.getTasksByProjectId(req.params.projectId);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });
  app2.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });
  app2.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.json(task);
      broadcastToProject(data.projectId, {
        type: "TASK_CREATED",
        data: task
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });
  app2.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
      broadcastToProject(task.projectId, {
        type: "TASK_UPDATED",
        data: task
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });
  app2.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      const deleted = await storage.deleteTask(req.params.id);
      if (deleted) {
        res.json({ message: "Task deleted successfully" });
        broadcastToProject(task.projectId, {
          type: "TASK_DELETED",
          data: { id: req.params.id }
        });
      } else {
        res.status(500).json({ message: "Failed to delete task" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });
  app2.get("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  app2.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const data = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId: user.id
      });
      const comment = await storage.createTaskComment(data);
      res.json(comment);
      const task = await storage.getTaskById(req.params.taskId);
      if (task) {
        broadcastToProject(task.projectId, {
          type: "COMMENT_ADDED",
          data: { taskId: req.params.taskId, comment }
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  app2.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/user/tasks", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      const tasks2 = await storage.getUserTasks(user.id);
      res.json(tasks2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });
  app2.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query required" });
      }
      const users2 = await storage.searchUsers(q);
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const projectConnections = /* @__PURE__ */ new Map();
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "JOIN_PROJECT") {
          const projectId = data.projectId;
          if (!projectConnections.has(projectId)) {
            projectConnections.set(projectId, /* @__PURE__ */ new Set());
          }
          projectConnections.get(projectId).add(ws);
          ws.on("close", () => {
            projectConnections.get(projectId)?.delete(ws);
            if (projectConnections.get(projectId)?.size === 0) {
              projectConnections.delete(projectId);
            }
          });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
  });
  function broadcastToProject(projectId, message) {
    const connections = projectConnections.get(projectId);
    if (connections) {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === "win32" ? "127.0.0.1" : "0.0.0.0";
  server.listen(
    {
      port,
      host
    },
    () => {
      log(`serving on http://${host}:${port}`);
    }
  );
})();
