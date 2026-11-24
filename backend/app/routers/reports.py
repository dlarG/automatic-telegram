
# app/routers/reports.py

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
from io import BytesIO
import re

from app.services.report_generator import generate_screening_pdf

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportRequest(BaseModel):
    project: Optional[Dict[str, Any]] = None
    merged: Dict[str, Any]


@router.post("/generate")
async def generate_report(payload: ReportRequest):

    if not payload.merged:
        raise HTTPException(
            status_code=400,
            detail="No merged analysis data supplied."
        )

    if not payload.merged.get("rule_results"):
        raise HTTPException(
            status_code=400,
            detail="No screening results available for the report."
        )

    try:
        pdf_buffer = generate_screening_pdf(
            project=payload.project or {},
            merged=payload.merged
        )

        column_mark = (
            payload.merged.get("column_mark") or "Column"
        )

        # Keep the filename safe.
        safe_column = re.sub(
            r"[^A-Za-z0-9_-]",
            "_",
            str(column_mark)
        )

        filename = f"RC_Screening_Report_{safe_column}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            }
        )

    except Exception as e:
        print("PDF generation error:", str(e))

        raise HTTPException(
            status_code=500,
            detail="Failed to generate PDF screening report."
        )
