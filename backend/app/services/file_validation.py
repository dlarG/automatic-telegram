from fastapi import UploadFile, HTTPException
from app.config import ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_MB


async def validate_upload(file: UploadFile) -> bytes:
    """
    Validate the uploaded file's content type and size.
    Returns the raw file bytes if valid. Raises HTTPException otherwise.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type: {file.content_type}. "
                f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES.keys())}"
            ),
        )

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)

    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large: {size_mb:.2f} MB. Max: {MAX_FILE_SIZE_MB} MB.",
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    return contents