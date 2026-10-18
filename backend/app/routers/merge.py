from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.rule_engine import run_all_rules

from app.services.view_merger import merge_view_results

router = APIRouter(prefix="/api", tags=["merge"])


class ViewPayload(BaseModel):
    extracted_fields: Optional[Dict[str, Any]] = None


class MergeRequest(BaseModel):
    case_id: str
    views: Dict[str, ViewPayload]


@router.post("/merge")
async def merge_views(payload: MergeRequest):
    if not payload.views:
        raise HTTPException(status_code=400, detail="No views supplied.")

    flat = {
        key: {"extracted_fields": v.extracted_fields or {}}
        for key, v in payload.views.items()
    }

    # 1. Merge the fields
    merged_result = merge_view_results(payload.case_id, flat)
    
    # 2. Run the rule engine on the merged fields
    rule_results = run_all_rules(merged_result)
    merged_result["rule_results"] = rule_results

    return merged_result