from fastapi import APIRouter, UploadFile, File, Form
from typing import Optional

from app.services.file_validation import validate_upload
from app.services.pdf_extractor import extract_pdf_text
from app.services.ocr_extractor import (
    render_pdf_pages_to_images,
    run_ocr_on_image,
)
from app.services.field_parser import parse_fields
from app.config import ALLOWED_CONTENT_TYPES

router = APIRouter(prefix="/api", tags=["extraction"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "rc-column-screening-backend",
        "version": "0.1.0",
        "stage": "4D-parse",
    }


@router.get("/capabilities")
async def capabilities():
    return {
        "allowed_content_types": list(ALLOWED_CONTENT_TYPES.keys()),
        "extraction_mode": "pdf_text + ocr + field_parse",
        "supports": {
            "pdf_text_extraction": True,
            "ocr_image": True,
            "field_parsing": True,
        },
    }


@router.post("/extract")
async def extract(
    file: UploadFile = File(...),
    source_view: Optional[str] = Form("unknown"),
):
    contents = await validate_upload(file)
    content_type = file.content_type

    # ---- PDF path ----
    if content_type == "application/pdf":
        pdf_result = extract_pdf_text(contents)
        if pdf_result.get("error"):
            return _error_response(file, contents, pdf_result["error"], source_view)

        if pdf_result["has_embedded_text"]:
            raw_text = pdf_result["raw_text"]
            parsed = parse_fields(raw_text, source_view=source_view)
            return _success_response(
                file=file,
                contents=contents,
                mode="pdf_text",
                message=(
                    f"Extracted {pdf_result['text_length']} characters "
                    f"from {pdf_result['page_count']} page(s)."
                ),
                raw_text=raw_text,
                ocr_lines=[],
                parsed=parsed,
                extra={
                    "page_count": pdf_result["page_count"],
                    "text_length": pdf_result["text_length"],
                    "has_embedded_text": True,
                },
            )

        # Scanned PDF — render + OCR + parse
        pages = render_pdf_pages_to_images(contents)
        ocr_lines = []
        text_parts = []
        for page in pages:
            page_ocr = run_ocr_on_image(page["image_bytes"])
            if page_ocr["error"]:
                continue
            for line in page_ocr["lines"]:
                line["page_number"] = page["page_number"]
                ocr_lines.append(line)
            text_parts.append(page_ocr["text"])

        raw_text = "\n\n".join(text_parts)
        parsed = parse_fields(raw_text, source_view=source_view)

        return _success_response(
            file=file,
            contents=contents,
            mode="ocr_pdf",
            message=(
                f"PDF had no embedded text. OCR extracted "
                f"{len(ocr_lines)} line(s) from {len(pages)} page(s)."
            ),
            raw_text=raw_text,
            ocr_lines=ocr_lines,
            parsed=parsed,
            extra={
                "page_count": len(pages),
                "text_length": len(raw_text),
                "has_embedded_text": False,
            },
        )

    # ---- Image path ----
    ocr_result = run_ocr_on_image(contents)
    if ocr_result["error"]:
        return _error_response(file, contents, ocr_result["error"], source_view)

    parsed = parse_fields(ocr_result["text"], source_view=source_view)

    return _success_response(
        file=file,
        contents=contents,
        mode="ocr_image",
        message=(
            f"OCR extracted {ocr_result['line_count']} line(s) "
            f"with average confidence {ocr_result['avg_confidence']:.2f}."
        ),
        raw_text=ocr_result["text"],
        ocr_lines=ocr_result["lines"],
        parsed=parsed,
        extra={
            "has_embedded_text": False,
            "line_count": ocr_result["line_count"],
            "avg_confidence": ocr_result["avg_confidence"],
        },
    )


def _success_response(file, contents, mode, message, raw_text, ocr_lines, parsed, extra):
    extraction = {
        "mode": mode,
        "message": message,
    }
    extraction.update(extra)

    return {
        "status": "received",
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "size_mb": round(len(contents) / (1024 * 1024), 3),
        "extraction": extraction,
        "raw_text": raw_text,
        "ocr_lines": ocr_lines,
        "extracted_fields": parsed,
    }


def _error_response(file, contents, message, source_view):
    return {
        "status": "error",
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents),
        "size_mb": round(len(contents) / (1024 * 1024), 3),
        "extraction": {
            "mode": "error",
            "message": message,
            "has_embedded_text": False,
        },
        "raw_text": "",
        "ocr_lines": [],
        "extracted_fields": {
            "column_mark": None,
            "width_mm": None,
            "depth_mm": None,
            "bar_count": None,
            "bar_diameter_mm": None,
            "tie_diameter_mm": None,
            "tie_spacing_mm": None,
            "zone_spacings": [],
            "parse_confidence": 0.0,
            "parse_warnings": [message],
            "source_view": source_view,
        },
    }