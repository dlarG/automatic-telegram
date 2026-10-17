from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.services.view_merger import merge_view_results

router = APIRouter(prefix="/api", tags=["merge"])


class ViewPayload(BaseModel):
    extracted_fields: Optional[Dict[str, Any]] = None


class MergeRequest(BaseModel):
    case_id: str
    views: Dict[str, ViewPayload]


@router.post("/merge")
async def merge_views(payload: MergeRequest):
    """
    Merge the extracted fields from Views A, B, and C into one confirmed set.
    Conflicting evidence is reported, not resolved silently.
    """
    if not payload.views:
        raise HTTPException(status_code=400, detail="No views supplied.")

    # Flatten pydantic objects to dict for the merger
    flat = {
        key: {"extracted_fields": v.extracted_fields or {}}
        for key, v in payload.views.items()
    }

    return merge_view_results(payload.case_id, flat)