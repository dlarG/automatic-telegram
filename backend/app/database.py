
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    JSON,
    DateTime,
    Text,
    ForeignKey,
    Date,
    Boolean
)
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./column_checker.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    # Account ID
    id = Column(Integer, primary_key=True, index=True)

    # Account credentials
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=False)

    # Personal information
    first_name = Column(String, nullable=True)
    middle_initial = Column(String(5), nullable=True)
    last_name = Column(String, nullable=True)
    suffix = Column(String(20), nullable=True)
    birthdate = Column(Date, nullable=True)
    gender = Column(String(30), nullable=True)

    # Profile
    profile_picture = Column(Text, nullable=True)

    # Account management
    role = Column(String, default="user", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, index=True)
    project_title = Column(String)
    sheet_id = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Grouping and File Storage
    file_name = Column(String, index=True)
    view_a_crop = Column(Text, nullable=True)
    view_b_crop = Column(Text, nullable=True)
    view_c_crop = Column(Text, nullable=True)

    # Column Identity
    column_mark = Column(String)
    storey = Column(String)
    grid_x = Column(String)
    grid_y = Column(String)

    # Analysis Data
    merged_fields = Column(JSON)
    rule_results = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)


# Create tables
Base.metadata.create_all(bind=engine)
