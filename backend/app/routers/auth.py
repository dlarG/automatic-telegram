from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt
from app.database import SessionLocal, User

router = APIRouter(prefix="/api/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Schemas
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# Routes
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # --- NEW: Hash directly with bcrypt ---
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), salt).decode('utf-8')
    
    new_user = User(username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "User created successfully", "username": new_user.username}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # --- NEW: Verify directly with bcrypt ---
    is_valid = bcrypt.checkpw(
        user.password.encode('utf-8'), 
        db_user.hashed_password.encode('utf-8')
    )
    
    if not is_valid:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # For a simple MVP, we just return the username. 
    # (In a production app, you'd return a JWT token here).
    return {"message": "Login successful", "username": db_user.username}