from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, models, auth, database

router = APIRouter(
    prefix="/projects/{project_id}/discussions",
    tags=["Discussions"]
)

from ..websocket_manager import manager
import json

@router.post("/", response_model=schemas.MessageDisplay)
def create_message(
    project_id: int, 
    message: schemas.MessageCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers, Project Managers, Employees, and Stakeholders can post
    project_member = auth.ensure_project_permission(project_id, current_user, db, "create_discussion")
    role = project_member.role.value if hasattr(project_member.role, "value") else str(project_member.role)

    # Restriction logic for channels:
    if not message.task_id:
        if role == "stakeholder":
            message.channel = "manager"
        elif role in ["employee", "project_manager"]:
            message.channel = "global"

    new_message = models.Message(
        project_id=project_id,
        sender_id=current_user.id,
        **message.model_dump()
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)

    # Broadcast via WebSocket
    import asyncio
    asyncio.run_coroutine_threadsafe(
        manager.broadcast_to_project(str(project_id), {
            "type": "MESSAGE_CREATED",
            "data": {
                "id": new_message.id,
                "project_id": project_id,
                "task_id": new_message.task_id,
                "sender_id": current_user.id,
                "content": new_message.content,
                "channel": new_message.channel,
                "created_at": new_message.created_at.isoformat(),
                "sender": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "email": current_user.email
                }
            }
        }),
        loop=asyncio.get_event_loop()
    )

    return new_message

@router.get("/", response_model=List[schemas.MessageDisplay])
def get_messages(
    project_id: int, 
    channel: str = "global",
    task_id: Optional[int] = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # All project roles can read messages
    project_member = auth.ensure_project_permission(project_id, current_user, db, "read")
    role = project_member.role.value if hasattr(project_member.role, "value") else str(project_member.role)

    query = db.query(models.Message).filter(models.Message.project_id == project_id)

    if task_id:
        query = query.filter(models.Message.task_id == task_id)
    else:
        # Channel filtering logic for non-task chats:
        if role == "stakeholder":
            channel = "manager"
        elif role in ["employee", "project_manager"]:
            channel = "global"
        query = query.filter(models.Message.channel == channel, models.Message.task_id == None)

    messages = query.order_by(models.Message.created_at.asc()).all()
    
    return messages

@router.delete("/{message_id}")
def delete_message(
    project_id: int, 
    message_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Managers and Project Managers can moderate discussions
    auth.ensure_project_permission(project_id, current_user, db, "delete_discussion")

    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.project_id == project_id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    db.delete(message)
    db.commit()

    auth.log_activity(db, project_id, current_user.id, f"Moderator deleted a discussion message")

    return {"detail": "Message deleted"}
