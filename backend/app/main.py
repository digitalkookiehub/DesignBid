import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.exceptions import AppException

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DesignBid - Interior Design Proposal Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:5179",
        "http://localhost:5180",
        "http://localhost:5181",
        "http://localhost:3000",
        "http://localhost:8002",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "code": exc.code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# Health check
@app.get("/health")
async def health() -> dict:
    return {"status": "healthy", "app": settings.APP_NAME}


# Include routers
try:
    from app.routers import auth
    app.include_router(auth.router, prefix="/api/v1")
except ImportError:
    logger.warning("Auth router not yet available")

try:
    from app.routers import clients
    app.include_router(clients.router, prefix="/api/v1")
except ImportError:
    logger.warning("Clients router not yet available")

try:
    from app.routers import proposals
    app.include_router(proposals.router, prefix="/api/v1")
except ImportError:
    logger.warning("Proposals router not yet available")

try:
    from app.routers import projects
    app.include_router(projects.router, prefix="/api/v1")
except ImportError:
    logger.warning("Projects router not yet available")

try:
    from app.routers import dashboard
    app.include_router(dashboard.router, prefix="/api/v1")
except ImportError:
    logger.warning("Dashboard router not yet available")

try:
    from app.routers import rate_card
    app.include_router(rate_card.router, prefix="/api/v1")
except ImportError:
    logger.warning("Rate card router not yet available")

try:
    from app.routers import quotations
    app.include_router(quotations.router, prefix="/api/v1")
except ImportError:
    logger.warning("Quotations router not yet available")

try:
    from app.routers import labour
    app.include_router(labour.router, prefix="/api/v1")
except ImportError:
    logger.warning("Labour router not yet available")

try:
    from app.routers import admin
    app.include_router(admin.router, prefix="/api/v1")
except ImportError:
    logger.warning("Admin router not yet available")

try:
    from app.routers import worklog
    app.include_router(worklog.router, prefix="/api/v1")
except ImportError:
    logger.warning("Worklog router not yet available")


@app.on_event("startup")
async def startup_event() -> None:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info("%s started successfully", settings.APP_NAME)


# Serve uploaded files (logos, documents)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
