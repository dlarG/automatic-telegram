from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import ALLOWED_ORIGINS
from app.routers import extract, merge

app = FastAPI(
    title="RC Column Plan Screening API",
    description=(
        "Preliminary evidence screening prototype for reinforced-concrete "
        "column drawings. Phase 4E — extraction + merge."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract.router)
app.include_router(merge.router)


@app.get("/")
async def root():
    return {
        "service": "RC Column Plan Screening API",
        "stage": "4E-merge",
        "docs": "/docs",
        "health": "/api/health",
    }