from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.database import SessionLocal, AnalysisRun

router = APIRouter(prefix="/api/history", tags=["history"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class SaveRunRequest(BaseModel):
    project_id: Optional[str] = "P001"
    project_title: Optional[str] = "Untitled"
    sheet_id: Optional[str] = ""
    prepared_by: Optional[str] = ""
    column_mark: Optional[str] = None
    storey: Optional[str] = None
    grid_x: Optional[str] = None
    grid_y: Optional[str] = None
    merged_fields: Dict[str, Any]
    rule_results: List[Dict[str, Any]]

@router.post("/save")
async def save_analysis_run(payload: SaveRunRequest, db: Session = Depends(get_db)):
    run = AnalysisRun(
        project_id=payload.project_id,
        project_title=payload.project_title,
        sheet_id=payload.sheet_id,
        prepared_by=payload.prepared_by,
        column_mark=payload.column_mark,
        storey=payload.storey,
        grid_x=payload.grid_x,
        grid_y=payload.grid_y,
        merged_fields=payload.merged_fields,
        rule_results=payload.rule_results,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return {"status": "success", "run_id": run.id}

@router.get("/")
async def get_all_runs(db: Session = Depends(get_db)):
    runs = db.query(AnalysisRun).order_by(AnalysisRun.created_at.desc()).all()
    return runs