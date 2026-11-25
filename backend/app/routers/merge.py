
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import math

from app.services.rule_engine import run_all_rules
from app.services.view_merger import merge_view_results

router = APIRouter(prefix="/api", tags=["merge"])


class ViewPayload(BaseModel):
    extracted_fields: Optional[Dict[str, Any]] = None
    raw_text: Optional[str] = None


class MergeRequest(BaseModel):
    case_id: str
    views: Dict[str, ViewPayload]

class ReanalyzeRequest(BaseModel):
    merged_fields: Dict[str, Any]
    view_texts: Optional[Dict[str, str]] = None


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

@router.post("/reanalyze")
async def reanalyze_fields(payload: ReanalyzeRequest):
    """
    Re-run engineering screening rules using manually corrected
    or updated merged fields.

    Original OCR text is retained for the readability check.
    """

    merged_fields = dict(payload.merged_fields)

    # Fields that must contain numeric values
    numeric_fields = [
        "width_mm",
        "depth_mm",
        "bar_count",
        "bar_diameter_mm",
        "tie_diameter_mm",
        "tie_spacing_mm",
    ]

    for field in numeric_fields:
        value = merged_fields.get(field)

        # Allow missing or empty values so the rules can report
        # INSUFFICIENT_DOCUMENT_COVERAGE.
        if value is None or value == "":
            merged_fields[field] = None
            continue

        if isinstance(value, bool):
            raise HTTPException(
                status_code=422,
                detail=f"{field} must be a valid number."
            )

        try:
            number = float(value)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=422,
                detail=f"{field} must be a valid number."
            )

        if not math.isfinite(number) or number <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"{field} must be greater than zero."
            )

        if field == "bar_count":
            if not number.is_integer():
                raise HTTPException(
                    status_code=422,
                    detail="bar_count must be a whole number."
                )
            merged_fields[field] = int(number)
        else:
            merged_fields[field] = number

    # Validate the column mark
    column_mark = merged_fields.get("column_mark")

    if column_mark is not None:
        merged_fields["column_mark"] = str(column_mark).strip() or None

    # Re-run all engineering rules.
    # Pass the original OCR text so manual corrections do not
    # artificially change the drawing readability result.
    rule_results = run_all_rules(
        merged_fields=merged_fields,
        view_texts=payload.view_texts or {}
    )

    return {
        "merged_fields": merged_fields,
        "rule_results": rule_results
    }