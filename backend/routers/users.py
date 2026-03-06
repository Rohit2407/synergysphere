from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import timedelta
from typing import List, Optional
from .. import schemas, models, auth, database

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

import uuid

@router.post("/register", response_model=schemas.UserDisplay)
def create_user(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    
    if db_user:
        raise HTTPException(status_code=400, detail="Username or Email already registered")
    
    # Handle Company context
    company_id = None
    is_admin = False

    if user.account_type == "work":
        if user.company_key:
            # Join existing company
            company = db.query(models.Company).filter(models.Company.join_key == user.company_key).first()
            if not company:
                raise HTTPException(status_code=400, detail="Invalid company key.")
            company_id = company.id
        elif user.company_name:
            # Create new company
            new_company = models.Company(
                name=user.company_name,
                join_key=str(uuid.uuid4())[:8].upper() # Simpler unique key
            )
            db.add(new_company)
            db.commit()
            db.refresh(new_company)
            company_id = new_company.id
            is_admin = True
        else:
            raise HTTPException(status_code=400, detail="Company name or join key required for work account.")
    else: # personal
        new_company = models.Company(
            name=f"{user.username}'s Personal Space",
            join_key=str(uuid.uuid4())[:8].upper(),
            is_personal=True
        )
        db.add(new_company)
        db.commit()
        db.refresh(new_company)
        company_id = new_company.id
        is_admin = True

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
        account_type=user.account_type,
        company_id=company_id,
        is_company_admin=is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserDisplay)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(payload: schemas.UserCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Allow any user (esp. stakeholders) to change their password."""
    current_user.password_hash = auth.get_password_hash(payload.password)
    current_user.needs_password_change = False
    db.commit()
    return {"detail": "Password changed successfully"}


@router.get("/", response_model=List[schemas.UserDisplay])
def get_all_users(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List all registered users in the CURRENT COMPANY."""
    users = db.query(models.User).filter(models.User.company_id == current_user.company_id).all()
    return users


@router.get("/search", response_model=List[schemas.UserDisplay])
def search_users(q: str = Query(..., min_length=1), db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Search users in the CURRENT COMPANY."""
    users = db.query(models.User).filter(
        models.User.company_id == current_user.company_id,
        or_(
            models.User.username.ilike(f"%{q}%"),
            models.User.email.ilike(f"%{q}%")
        )
    ).limit(20).all()
    return users


@router.get("/me/tasks", response_model=List[schemas.TaskDisplay])
def get_my_tasks(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get all tasks assigned to the current user (where they are an assignee)."""
    # Join TaskAssignee to filter tasks where user is an assignee
    tasks = db.query(models.Task).join(models.Task.assignees).filter(
        models.User.id == current_user.id
    ).order_by(models.Task.created_at.desc()).all()
    return tasks
