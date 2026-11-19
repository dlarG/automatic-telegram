
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
import bcrypt
import re

from app.database import SessionLocal, User

router = APIRouter(prefix="/api/auth", tags=["auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -------------------------
# Schemas
# -------------------------

class UserCreate(BaseModel):
    username: str
    password: str

    first_name: str
    middle_initial: Optional[str] = None
    last_name: str
    suffix: Optional[str] = None

    email: str
    birthdate: Optional[date] = None
    gender: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


# -------------------------
# Helper
# -------------------------

def get_user_profile(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "middle_initial": user.middle_initial,
        "last_name": user.last_name,
        "suffix": user.suffix,
        "birthdate": user.birthdate.isoformat() if user.birthdate else None,
        "gender": user.gender,
        "profile_picture": user.profile_picture,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


# -------------------------
# Register
# -------------------------

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    # Normalize inputs
    username = user.username.strip()
    email = user.email.strip().lower()

    # Basic validation
    if not username:
        raise HTTPException(status_code=400, detail="Username is required")

    if len(user.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long"
        )

    if not user.first_name.strip():
        raise HTTPException(status_code=400, detail="First name is required")

    if not user.last_name.strip():
        raise HTTPException(status_code=400, detail="Last name is required")

    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    # Check username duplicate
    existing_username = db.query(User).filter(
        User.username == username
    ).first()

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Check email duplicate
    existing_email = db.query(User).filter(
        User.email == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(
        user.password.encode("utf-8"),
        salt
    ).decode("utf-8")

    # Create user
    new_user = User(
        username=username,
        email=email,
        hashed_password=hashed_pw,

        first_name=user.first_name.strip(),
        middle_initial=(
            user.middle_initial.strip().upper()
            if user.middle_initial else None
        ),
        last_name=user.last_name.strip(),
        suffix=user.suffix.strip() if user.suffix else None,

        birthdate=user.birthdate,
        gender=user.gender,

        role="user",
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": get_user_profile(new_user)
    }


# -------------------------
# Login
# -------------------------

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(
        User.username == user.username
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    # Verify password
    is_valid = bcrypt.checkpw(
        user.password.encode("utf-8"),
        db_user.hashed_password.encode("utf-8")
    )

    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    # Check whether account is active
    if not db_user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account has been disabled"
        )

    return {
        "message": "Login successful",
        "user": get_user_profile(db_user)
    }
