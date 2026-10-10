from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routers import extract

app = FastAPI(
    title="RC Column Plan Screening API",
    description=(
        "Preliminary evidence screening prototype for reinforced-concrete "
        "column drawings. Phase 4A — stub skeleton."
    ),
    version="0.1.0",
)

# CORS — allow the Vite dev server to call this API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(extract.router)


@app.get("/")
async def root():
    return {
        "service": "RC Column Plan Screening API",
        "stage": "4A-stub",
        "docs": "/docs",
        "health": "/api/health",
    }