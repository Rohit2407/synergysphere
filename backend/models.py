from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from .database import Base

class RoleEnum(str, enum.Enum):
    manager = "manager"
    project_manager = "project_manager"
    employee = "employee"
    stakeholder = "stakeholder"
    # Legacy roles for migration
    member = "member"
    viewer = "viewer"

class TaskStatusEnum(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

class AccountTypeEnum(str, enum.Enum):
    work = "work"
    personal = "personal"

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    join_key = Column(String, unique=True, index=True)
    is_personal = Column(Boolean, default=False)
    
    users = relationship("User", back_populates="company")
    projects = relationship("Project", back_populates="company")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    account_type = Column(Enum(AccountTypeEnum), default=AccountTypeEnum.work)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_company_admin = Column(Boolean, default=False)
    needs_password_change = Column(Boolean, default=False)
    
    company = relationship("Company", back_populates="users")
    project_members = relationship("ProjectMember", back_populates="user")
    tasks_assigned = relationship("Task", secondary="task_assignees", back_populates="assignees")
    messages = relationship("Message", back_populates="sender")

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="projects")
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    logs = relationship("ActivityLog", back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(Enum(RoleEnum), default=RoleEnum.employee)
    joined_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="project_members")
    project = relationship("Project", back_populates="members")

class TaskAssignee(Base):
    __tablename__ = "task_assignees"
    task_id = Column(Integer, ForeignKey("tasks.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    parent_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.todo)
    priority = Column(Enum(PriorityEnum), default=PriorityEnum.medium)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")
    parent = relationship("Task", remote_side=[id], backref="subtasks")
    assignees = relationship("User", secondary="task_assignees", back_populates="tasks_assigned")
    messages = relationship("Message", back_populates="task")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    channel = Column(String, default="global")
    parent_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="messages")
    task = relationship("Task", back_populates="messages")
    sender = relationship("User", back_populates="messages")
    replies = relationship("Message", backref="parent_message", remote_side=[id])

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)  # E.g., "Created task X", "Changed status of Y"
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="logs")
    user = relationship("User")
