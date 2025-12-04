import { 
  users, 
  projects, 
  projectMembers, 
  tasks, 
  taskComments, 
  discussions,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type TaskComment,
  type InsertTaskComment,
  type Discussion,
  type InsertDiscussion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(email: string, password: string): Promise<User | null>;

  // Project operations
  getProjectsByUserId(userId: string): Promise<(Project & { memberCount: number; taskCount: number; completedTaskCount: number })[]>;
  getProjectById(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  addProjectMember(projectId: string, userId: string, role?: string): Promise<void>;
  getProjectMembers(projectId: string): Promise<(typeof projectMembers.$inferSelect & { user: User })[]>;

  // Task operations
  getTasksByProjectId(projectId: string): Promise<(Task & { assignee?: User })[]>;
  getTaskById(id: string): Promise<(Task & { assignee?: User }) | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;

  // Task comments
  getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  // Discussions
  getProjectDiscussions(projectId: string): Promise<(Discussion & { user: User })[]>;
  createDiscussion(discussion: InsertDiscussion): Promise<Discussion>;
  
  // Additional user operations
  getAllUsers(): Promise<User[]>;
  getUserTasks(userId: string): Promise<(Task & { assignee?: User; project: Project })[]>;
  searchUsers(query: string): Promise<User[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async getProjectsByUserId(userId: string): Promise<(Project & { memberCount: number; taskCount: number; completedTaskCount: number })[]> {
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        icon: projects.icon,
        status: projects.status,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projectMembers.userId, userId)
        )
      );

    // Get counts for each project
    const projectsWithCounts = await Promise.all(
      userProjects.map(async (project) => {
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(projectMembers)
          .where(eq(projectMembers.projectId, project.id));

        const [taskCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.projectId, project.id));

        const [completedTaskCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(and(
            eq(tasks.projectId, project.id),
            eq(tasks.status, "done")
          ));

        return {
          ...project,
          memberCount: memberCount?.count || 0,
          taskCount: taskCount?.count || 0,
          completedTaskCount: completedTaskCount?.count || 0,
        };
      })
    );

    return projectsWithCounts;
  }

  async getProjectById(id: string, userId: string): Promise<Project | undefined> {
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        ownerId: projects.ownerId,
        icon: projects.icon,
        status: projects.status,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(projectMembers, eq(projects.id, projectMembers.projectId))
      .where(
        and(
          eq(projects.id, id),
          eq(projectMembers.userId, userId)
        )
      );
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();

    // Add the owner as a member
    await db
      .insert(projectMembers)
      .values({
        projectId: newProject.id,
        userId: newProject.ownerId,
        role: "owner"
      });

    return newProject;
  }

  async addProjectMember(projectId: string, userId: string, role = "member"): Promise<void> {
    await db
      .insert(projectMembers)
      .values({
        projectId,
        userId,
        role
      });
  }

  async getProjectMembers(projectId: string): Promise<(typeof projectMembers.$inferSelect & { user: User })[]> {
    const members = await db
      .select({
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
          createdAt: users.createdAt,
        }
      })
      .from(projectMembers)
      .leftJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));

    return members.map(member => ({
      ...member,
      user: member.user!
    }));
  }

  async getTasksByProjectId(projectId: string): Promise<(Task & { assignee?: User })[]> {
    const projectTasks = await db
      .select({
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
          createdAt: users.createdAt,
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(asc(tasks.createdAt));

    return projectTasks.map(task => ({
      ...task,
      assignee: task.assignee || undefined
    }));
  }

  async getTaskById(id: string): Promise<(Task & { assignee?: User }) | undefined> {
    const [task] = await db
      .select({
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
          createdAt: users.createdAt,
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(eq(tasks.id, id));

    if (!task) return undefined;

    return {
      ...task,
      assignee: task.assignee || undefined
    };
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTaskComments(taskId: string): Promise<(TaskComment & { user: User })[]> {
    const comments = await db
      .select({
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
          createdAt: users.createdAt,
        }
      })
      .from(taskComments)
      .leftJoin(users, eq(taskComments.userId, users.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(asc(taskComments.createdAt));

    return comments.map(comment => ({
      ...comment,
      user: comment.user!
    }));
  }

  async createTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db
      .insert(taskComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async getProjectDiscussions(projectId: string): Promise<(Discussion & { user: User })[]> {
    const projectDiscussions = await db
      .select({
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
          createdAt: users.createdAt,
        }
      })
      .from(discussions)
      .leftJoin(users, eq(discussions.userId, users.id))
      .where(eq(discussions.projectId, projectId))
      .orderBy(desc(discussions.createdAt));

    return projectDiscussions.map(discussion => ({
      ...discussion,
      user: discussion.user!
    }));
  }

  async createDiscussion(discussion: InsertDiscussion): Promise<Discussion> {
    const [newDiscussion] = await db
      .insert(discussions)
      .values(discussion)
      .returning();
    return newDiscussion;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.fullName));
  }

  async getUserTasks(userId: string): Promise<(Task & { assignee?: User; project: Project })[]> {
    const userTasks = await db
      .select({
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
          createdAt: users.createdAt,
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
          createdAt: projects.createdAt,
        }
      })
      .from(tasks)
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .innerJoin(projectMembers, and(
        eq(projectMembers.projectId, projects.id),
        eq(projectMembers.userId, userId)
      ))
      .orderBy(desc(tasks.createdAt));

    return userTasks.map(task => ({
      ...task,
      assignee: task.assignee?.id ? task.assignee : undefined,
      project: task.project!
    }));
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(sql`
        ${users.fullName} ILIKE ${`%${query}%`} OR 
        ${users.username} ILIKE ${`%${query}%`} OR 
        ${users.email} ILIKE ${`%${query}%`}
      `)
      .limit(10)
      .orderBy(asc(users.fullName));
  }
}

export const storage = new DatabaseStorage();
