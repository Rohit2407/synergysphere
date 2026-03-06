import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from . import models, schemas, database

import bcrypt

load_dotenv()

SECRET_KEY = os.getenv("SESSION_SECRET", "super-secret-key-fallback")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login")

def verify_password(plain_password, hashed_password):
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# Role based access control utilities 
ROLE_PERMISSIONS = { 
    "manager": { 
        "read", 
        "create_task", 
        "update_task", 
        "delete_task", 
        "create_discussion", 
        "delete_discussion", 
        "manage_members", 
        "create_credentials",
        "assign_task",
        "delete_project", 
    }, 
    "project_manager": { 
        "read", 
        "create_task", 
        "update_task", 
        "delete_task", 
        "create_discussion", 
        "delete_discussion",
        "assign_task",
    }, 
    "employee": { 
        "read", 
        "create_task", 
        "update_task", 
        "create_discussion", 
    }, 
    "stakeholder": { 
        "read", 
        "create_discussion",
    }, 
} 
 
def ensure_company_access(user: models.User, company_id: int):
    if user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Access denied: Resource belongs to another company")
    return True

def _get_project_member(project_id: int, current_user: models.User, db: Session): 
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Multi-tenancy check
    ensure_company_access(current_user, project.company_id)

    project_member = db.query(models.ProjectMember).filter( 
        models.ProjectMember.project_id == project_id, 
        models.ProjectMember.user_id == current_user.id 
    ).first() 
 
    if not project_member: 
        raise HTTPException(status_code=403, detail="You are not a member of this project") 
 
    return project_member

def _role_value(project_member: models.ProjectMember):
    role = project_member.role
    return role.value if hasattr(role, "value") else str(role)


def get_project_role(project_id: int, current_user: models.User, db: Session):
    project_member = _get_project_member(project_id, current_user, db)
    return _role_value(project_member)

def ensure_project_permission(project_id: int, current_user: models.User, db: Session, action: str): 
    project_member = _get_project_member(project_id, current_user, db) 
    role_value = _role_value(project_member) 
 
    allowed_actions = ROLE_PERMISSIONS.get(role_value, set()) 
    if action not in allowed_actions: 
        raise HTTPException(status_code=403, detail="You do not have enough permissions for this action") 
 
    return project_member 
 
class RoleChecker: 
    def __init__(self, action: str): 
        self.action = action 
 
    def __call__(self, project_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)): 
        return ensure_project_permission(project_id, current_user, db, self.action) 
 
require_manager = RoleChecker("manage_members") 
require_member = RoleChecker("create_task") 
require_viewer = RoleChecker("read") 
 
def log_activity(db: Session, project_id: int, user_id: int, action: str): 
    new_log = models.ActivityLog( 
        project_id=project_id, 
        user_id=user_id, 
        action=action 
    ) 
    db.add(new_log) 
    db.commit() 
