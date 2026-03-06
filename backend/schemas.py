from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import enum

# Enums
class RoleEnum(str, enum.Enum):
    manager = "manager"
    project_manager = "project_manager"
    employee = "employee"
    stakeholder = "stakeholder"
    # Legacy roles for migration support
    member = "member"
    viewer = "viewer"

class AccountTypeEnum(str, enum.Enum):
    work = "work"
    personal = "personal"

class TaskStatusEnum(str, enum.Enum):
    todo = "todo"
    in_progress = "in_progress"
    done = "done"

class PriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    is_personal: bool = False

class CompanyCreate(CompanyBase):
    pass

class CompanyDisplay(CompanyBase):
    id: int
    join_key: Optional[str] = None
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    account_type: AccountTypeEnum = AccountTypeEnum.work

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None # For creating a new company during register
    company_key: Optional[str] = None  # For joining an existing company

class UserDisplay(UserBase):
    id: int
    company_id: Optional[int] = None
    is_company_admin: bool = False
    needs_password_change: bool = False
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectDisplay(ProjectBase):
    id: int
    company_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

# Project Member Schemas
class ProjectMemberBase(BaseModel):
    project_id: int
    user_id: int
    role: RoleEnum

class ProjectMemberCreate(ProjectMemberBase):
    role: str

class ProjectMemberRoleUpdate(BaseModel):
    role: str

class MemberCredentialCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum

class ProjectMemberDisplay(ProjectMemberBase):
    id: int
    joined_at: datetime
    user: UserDisplay
    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    parent_id: Optional[int] = None
    status: TaskStatusEnum = TaskStatusEnum.todo
    priority: PriorityEnum = PriorityEnum.medium
    deadline: Optional[datetime] = None

class TaskCreate(TaskBase):
    assignee_ids: Optional[List[int]] = [] # For initial multiple assignees

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[PriorityEnum] = None
    deadline: Optional[datetime] = None
    assignee_ids: Optional[List[int]] = None # Bulk update assignees

class TaskAssign(BaseModel):
    assignee_id: int # Single add/remove or keep simple? Let's say bulk in update

class TaskDisplay(TaskBase):
    id: int
    created_at: datetime
    assignees: List[UserDisplay] = []
    class Config:
        from_attributes = True

# Message Schemas
class MessageBase(BaseModel):
    content: str
    channel: str = "global"
    parent_id: Optional[int] = None
    task_id: Optional[int] = None

class MessageCreate(MessageBase):
    pass

class MessageDisplay(MessageBase):
    id: int
    project_id: int
    sender_id: int
    created_at: datetime
    sender: UserDisplay
    class Config:
        from_attributes = True

# Activity Log Schemas
class ActivityLogDisplay(BaseModel):
    id: int
    project_id: int
    user_id: int
    action: str
    created_at: datetime
    user: UserDisplay
    class Config:
        from_attributes = True
