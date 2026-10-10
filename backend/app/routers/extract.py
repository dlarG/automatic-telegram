from fastapi import APIRouter, UploadFile, File
from app.services.file_validation import validate_upload
from app.services.pdf_extractor import extract_pdf_text
from app.config import ALLOWED_CONTENT_TYPES

router = APIRouter(prefix="/api", tags=["extraction"])


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "rc-column-screening-backend",
        "version": "0.1.0",
        "stage": "4B-pdf-text",
    }


@router.get("/capabilities")
async def capabilities():
    return {
        "allowed_content_types": list(ALLOWED_CONTENT_TYPES.keys()),
        "extraction_mode": "pdf_text",  # image OCR will be added in 4C
        "supports": {
            "pdf_text_extraction": True,
            "ocr_image": False,
            "field_parsing": False,
        },
    }


@router.post("/extract")
async def extract(file: UploadFile = File(...)):
    contents = await validate_upload(file)

    content_type = file.content_type

    # PDF path: try embedded text extraction
    if content_type == "application/pdf":
        result = extract_pdf_text(contents)

        if result.get("error"):
            return {
                "status": "error",
                "filename": file.filename,
                "content_type": content_type,
                "size_bytes": len(contents),
                "size_mb": round(len(contents) / (1024 * 1024), 3),
                "extraction": {
                    "mode": "error",
                    "message": result["error"],
                    "has_embedded_text": False,
                },
                "raw_text": "",
                "extracted_fields": [],
            }

        if result["has_embedded_text"]:
            return {
                "status": "received",
                "filename": file.filename,
                "content_type": content_type,
                "size_bytes": len(contents),
                "size_mb": round(len(contents) / (1024 * 1024), 3),
                "extraction": {
                    "mode": "pdf_text",
                    "message": (
                        f"Extracted {result['text_length']} characters of "
                        f"embedded text from {result['page_count']} page(s)."
                    ),
                    "page_count": result["page_count"],
                    "text_length": result["text_length"],
                    "has_embedded_text": True,
                },
                "raw_text": result["raw_text"],
                "extracted_fields": [],
            }

        # PDF has no usable embedded text — defer to OCR (Phase 4C)
        return {
            "status": "received",
            "filename": file.filename,
            "content_type": content_type,
            "size_bytes": len(contents),
            "size_mb": round(len(contents) / (1024 * 1024), 3),
            "extraction": {
                "mode": "needs_ocr",
                "message": (
                    "PDF has no embedded text (likely scanned). "
                    "OCR will be added in Phase 4C."
                ),
                "page_count": result["page_count"],
                "text_length": result["text_length"],
                "has_embedded_text": False,
            },
            "raw_text": "",
            "extracted_fields": [],
        }

    # Image path: OCR not yet implemented
    return {
        "status": "received",
        "filename": file.filename,
        "content_type": content_type,
        "size_bytes": len(contents),
        "size_mb": round(len(contents) / (1024 * 1024), 3),
        "extraction": {
            "mode": "needs_ocr",
            "message": "Image input requires OCR. Coming in Phase 4C.",
            "has_embedded_text": False,
        },
        "raw_text": "",
        "extracted_fields": [],
    }