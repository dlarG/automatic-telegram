
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.rule_engine import run_all_rules
from app.services.view_merger import merge_view_results

router = APIRouter(prefix="/api", tags=["merge"])


class ViewPayload(BaseModel):
    extracted_fields: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None


class MergeRequest(BaseModel):
    case_id: str
    views: Dict[str, ViewPayload]


@router.post("/merge")
async def merge_views(payload: MergeRequest):
    if not payload.views:
        raise HTTPException(
            status_code=400,
            detail="No views supplied."
        )

    # 1. Prepare the views for the merger.
    # Preserve BOTH extracted fields and original OCR text.
    flat = {
        key: {
            "extracted_fields": v.extracted_fields or {},
            "raw_text": v.raw_text or ""
        }
        for key, v in payload.views.items()
    }

    # 2. Merge the extracted structural fields.
    merged_result = merge_view_results(
        payload.case_id,
        flat
    )

    # 3. Extract OCR text from each view.
    view_texts = {
        key: flat.get(key, {}).get("raw_text", "")
        for key in ["A", "B", "C"]
    }

    # 4. Run all screening rules using merged fields
    #    and the original OCR text.
    rule_results = run_all_rules(
        merged_fields=merged_result,
        view_texts=view_texts
    )

    # 5. Attach screening results.
    merged_result["rule_results"] = rule_results

    # 6. Debugging: verify OCR text reaches the rule engine.
    print("\n========== MERGE OCR DEBUG ==========")

    for key, text in view_texts.items():
        print(f"View {key}: {len(text)} characters")
        print(f"Preview: {text[:150]}")

    print(
        "Total OCR characters:",
        sum(len(text) for text in view_texts.values())
    )

    print("=====================================\n")

    return merged_result
