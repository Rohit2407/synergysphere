import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertTaskSchema, insertTaskCommentSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

// Extend session data
declare module "express-session" {
  interface SessionData {
    passport?: {
      user?: string;
    };
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "synergy-sphere-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.validatePassword(email, password);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid email or password' });
      }
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user already exists
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

  app.post("/api/login", (req, res, next) => {
    try {
      const data = loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: any, user: any, info: any) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid credentials" });
        }
        
        req.login(user, (err) => {
          if (err) {
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

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const user = req.user as any;
    res.json({ id: user.id, email: user.email, fullName: user.fullName, username: user.username });
  });

  // Project routes
  app.get("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await storage.getProjectsByUserId(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const project = await storage.getProjectById(req.params.id, user.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const data = insertProjectSchema.parse({ ...req.body, ownerId: user.id });
      const project = await storage.createProject(data);
      res.json(project);
      
      // Broadcast to WebSocket clients
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

  app.get("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const members = await storage.getProjectMembers(req.params.id);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  app.post("/api/projects/:id/members", requireAuth, async (req, res) => {
    try {
      const { userId, role } = req.body;
      await storage.addProjectMember(req.params.id, userId, role);
      res.json({ message: "Member added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add member" });
    }
  });

  // Task routes
  app.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksByProjectId(req.params.projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
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

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      res.json(task);
      
      // Broadcast to WebSocket clients
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

  app.patch("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
      
      // Broadcast to WebSocket clients
      broadcastToProject(task.projectId, {
        type: "TASK_UPDATED",
        data: task
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const deleted = await storage.deleteTask(req.params.id);
      if (deleted) {
        res.json({ message: "Task deleted successfully" });
        
        // Broadcast to WebSocket clients
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

  // Task comments routes
  app.get("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const data = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: req.params.taskId,
        userId: user.id
      });
      const comment = await storage.createTaskComment(data);
      res.json(comment);
      
      // Get task to broadcast to project
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

  // User routes for team functionality
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/user/tasks", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const tasks = await storage.getUserTasks(user.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user tasks" });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }
      const users = await storage.searchUsers(q);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // WebSocket server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const projectConnections = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'JOIN_PROJECT') {
          const projectId = data.projectId;
          if (!projectConnections.has(projectId)) {
            projectConnections.set(projectId, new Set());
          }
          projectConnections.get(projectId)!.add(ws);
          
          ws.on('close', () => {
            projectConnections.get(projectId)?.delete(ws);
            if (projectConnections.get(projectId)?.size === 0) {
              projectConnections.delete(projectId);
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });

  function broadcastToProject(projectId: string, message: any) {
    const connections = projectConnections.get(projectId);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  return httpServer;
}
