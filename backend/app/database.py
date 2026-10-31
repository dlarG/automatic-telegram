from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./column_checker.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, index=True)
    project_title = Column(String)
    sheet_id = Column(String)
    prepared_by = Column(String)
    
    # Column Identity
    column_mark = Column(String)
    storey = Column(String)
    grid_x = Column(String)
    grid_y = Column(String)
    
    # The exact data from the merge + rule engine
    merged_fields = Column(JSON)
    rule_results = Column(JSON)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# Create the tables
Base.metadata.create_all(bind=engine)