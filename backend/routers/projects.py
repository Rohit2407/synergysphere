from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas, models, auth, database

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

def _parse_project_role(raw_role: str):
    try:
        return models.RoleEnum(raw_role)
    except ValueError:
        allowed = ", ".join([r.value for r in models.RoleEnum])
        raise HTTPException(status_code=400, detail=f"Invalid role '{raw_role}'. Allowed roles: {allowed}")

# ─── Members ───

@router.get("/{project_id}/members", response_model=List[schemas.ProjectMemberDisplay])
def get_project_members(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    project_member = auth.ensure_project_permission(project_id, current_user, db, "read")
    role = project_member.role.value if hasattr(project_member.role, "value") else str(project_member.role)

    query = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id
    )

    if role == "stakeholder":
        # Stakeholders only see managers
        query = query.filter(models.ProjectMember.role == models.RoleEnum.manager)

    return query.all()

@router.post("/{project_id}/members", response_model=schemas.ProjectMemberDisplay)
def add_project_member(
    project_id: int, 
    member: schemas.ProjectMemberCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    auth.ensure_project_permission(project_id, current_user, db, "manage_members")

    user = db.query(models.User).filter(models.User.id == member.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == member.user_id
    ).first()

    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this project")
    
    role_value = _parse_project_role(member.role)

    new_member = models.ProjectMember(
        project_id=project_id,
        user_id=member.user_id,
        role=role_value
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)

    auth.log_activity(db, project_id, current_user.id, f"Added {user.username} as {role_value.value}")
    return new_member

@router.delete("/{project_id}/members/{user_id}")
def remove_project_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    auth.ensure_project_permission(project_id, current_user, db, "manage_members")

    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user_id
    ).first()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the project")

    username = member.user.username
    db.delete(member)
    db.commit()

    auth.log_activity(db, project_id, current_user.id, f"Removed {username} from project")
    return {"detail": "Member removed"}

# ─── Activity Logs ───

@router.get("/{project_id}/logs", response_model=List[schemas.ActivityLogDisplay])
def get_project_logs(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    auth.ensure_project_permission(project_id, current_user, db, "read")
    logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.project_id == project_id
    ).order_by(models.ActivityLog.created_at.desc()).all()
    return logs

# ─── Projects ───

@router.post("/", response_model=schemas.ProjectDisplay)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    new_project = models.Project(
        **project.model_dump(),
        company_id=current_user.company_id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Make the creator the manager
    new_member = models.ProjectMember(
        project_id=new_project.id,
        user_id=current_user.id,
        role=models.RoleEnum.manager
    )
    db.add(new_member)
    db.commit()

    auth.log_activity(db, new_project.id, current_user.id, f"Created project '{project.name}'")
    return new_project

@router.get("/", response_model=List[schemas.ProjectDisplay])
def get_user_projects(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    user_projects = db.query(models.Project).join(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id,
        models.Project.company_id == current_user.company_id
    ).all()
    return user_projects

@router.get("/{project_id}", response_model=schemas.ProjectDisplay)
def get_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    auth.ensure_project_permission(project_id, current_user, db, "read")
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    auth.ensure_project_permission(project_id, current_user, db, "delete_project")
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    name = project.name
    db.delete(project)
    db.commit()
    return {"detail": f"Project '{name}' deleted"}
 
@router.put("/{project_id}/members/{user_id}", response_model=schemas.ProjectMemberDisplay) 
def update_project_member_role( 
    project_id: int, 
    user_id: int, 
    payload: schemas.ProjectMemberRoleUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user) 
): 
    auth.ensure_project_permission(project_id, current_user, db, "manage_members") 
 
    member = db.query(models.ProjectMember).filter( 
        models.ProjectMember.project_id == project_id, 
        models.ProjectMember.user_id == user_id 
    ).first() 
 
    if not member: 
        raise HTTPException(status_code=404, detail="Member not found") 
 
    if user_id == current_user.id: 
        raise HTTPException(status_code=400, detail="Cannot change your own role") 
 
    new_role = _parse_project_role(payload.role) 
    old_role = member.role 
 
    if old_role == models.RoleEnum.manager and new_role != models.RoleEnum.manager: 
        manager_count = db.query(models.ProjectMember).filter( 
            models.ProjectMember.project_id == project_id, 
            models.ProjectMember.role == models.RoleEnum.manager 
        ).count()
        if manager_count == 1:
            raise HTTPException(status_code=400, detail="Cannot demote the last manager in the project") 
 
    member.role = new_role 
    db.commit() 
    db.refresh(member) 
 
    auth.log_activity(db, project_id, current_user.id, f"Changed role from {old_role.value} to {new_role.value} for {member.user.username}") 
    return member

@router.post("/{project_id}/members/create-credential", response_model=schemas.ProjectMemberDisplay)
def create_member_credential(
    project_id: int,
    payload: schemas.MemberCredentialCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Manager-only endpoint
    auth.ensure_project_permission(project_id, current_user, db, "create_credentials")
    
    # Check if username or email already exists
    existing_user = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create new user
    hashed_password = auth.get_password_hash(payload.password)
    new_user = models.User(
        username=payload.username,
        email=payload.email,
        password_hash=hashed_password,
        company_id=current_user.company_id,
        account_type=models.AccountTypeEnum.work,
        needs_password_change=True # Forced password change on first login
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create project membership
    new_member = models.ProjectMember(
        project_id=project_id,
        user_id=new_user.id,
        role=payload.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    
    auth.log_activity(db, project_id, current_user.id, f"Created credentials for {new_user.username} as {payload.role.value}")
    
    return new_member
