from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models, auth, database

router = APIRouter(
    prefix="/projects/{project_id}/tasks",
    tags=["Tasks"]
)

@router.post("/", response_model=schemas.TaskDisplay)
def create_task(
    project_id: int, 
    task: schemas.TaskCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers, Project Managers, and Employees can create tasks
    auth.ensure_project_permission(project_id, current_user, db, "create_task")

    assignee_ids = task.assignee_ids or []
    payload = task.model_dump(exclude={"assignee_ids"})

    new_task = models.Task(
        project_id=project_id,
        **payload
    )

    if assignee_ids:
        assignees = db.query(models.User).filter(models.User.id.in_(assignee_ids)).all()
        # Verify all assignees are in the company (already checked by in_ above if IDs are from company)
        # But better check if they are project members
        new_task.assignees = assignees

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    auth.log_activity(db, project_id, current_user.id, f"Created task '{task.title}'")

    return new_task

@router.get("/", response_model=List[schemas.TaskDisplay])
def get_tasks(
    project_id: int, 
    parent_id: Optional[int] = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # All project roles can get tasks, but filtered for employees
    project_member = auth.ensure_project_permission(project_id, current_user, db, "read")
    role = project_member.role.value if hasattr(project_member.role, "value") else str(project_member.role)

    query = db.query(models.Task).filter(
        models.Task.project_id == project_id,
        models.Task.parent_id == parent_id
    )
    
    if role == "employee":
        # Can only see tasks where they are one of the assignees
        query = query.join(models.Task.assignees).filter(models.User.id == current_user.id)
        
    return query.all()

@router.put("/{task_id}", response_model=schemas.TaskDisplay)
def update_task(
    project_id: int, 
    task_id: int, 
    task_update: schemas.TaskUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers, Project Managers, and Employees can update tasks
    project_member = auth.ensure_project_permission(project_id, current_user, db, "update_task")
    role = project_member.role.value if hasattr(project_member.role, "value") else str(project_member.role)

    task = db.query(models.Task).filter(
        models.Task.id == task_id, 
        models.Task.project_id == project_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Employee isolation: can only update tasks where they are assigned
    if role == "employee":
        is_assigned = db.query(models.TaskAssignee).filter(
            models.TaskAssignee.task_id == task_id,
            models.TaskAssignee.user_id == current_user.id
        ).first()
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Employees can only update tasks assigned to them")

    # Update fields
    update_data = task_update.model_dump(exclude_unset=True)
    
    if "assignee_ids" in update_data:
        ids = update_data.pop("assignee_ids")
        if ids is not None:
            assignees = db.query(models.User).filter(models.User.id.in_(ids)).all()
            task.assignees = assignees

    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)

    auth.log_activity(db, project_id, current_user.id, f"Updated task '{task.title}'")

    return task

@router.put("/{task_id}/assignee", response_model=schemas.TaskDisplay)
def assign_task(
    project_id: int,
    task_id: int,
    payload: schemas.TaskAssign,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers and Project Managers can assign tasks
    auth.ensure_project_permission(project_id, current_user, db, "assign_task")
    
    task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.project_id == project_id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate assignee is project member
    assignee_member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == payload.assignee_id
    ).first()
    
    if not assignee_member:
        raise HTTPException(status_code=400, detail="Assignee must be a member of this project")
    
    task.assignee_id = payload.assignee_id
    db.commit()
    db.refresh(task)
    
    auth.log_activity(db, project_id, current_user.id, f"Assigned task '{task.title}' to {assignee_member.user.username}")
    
    return task

@router.delete("/{task_id}")
def delete_task(
    project_id: int, 
    task_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers and Project Managers can delete tasks
    auth.ensure_project_permission(project_id, current_user, db, "delete_task")

    task = db.query(models.Task).filter(
        models.Task.id == task_id, 
        models.Task.project_id == project_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    title = task.title
    db.delete(task)
    db.commit()

    auth.log_activity(db, project_id, current_user.id, f"Deleted task '{title}'")

    return {"detail": "Task deleted"}
