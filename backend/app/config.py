from pathlib import Path

# Base directory of the backend package
BASE_DIR = Path(__file__).resolve().parent.parent

# Where uploaded files are temporarily stored
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# File validation limits
MAX_FILE_SIZE_MB = 25
ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

# CORS — frontend dev server origins allowed to call this API
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]