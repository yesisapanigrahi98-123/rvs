from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.database.database import init_db, SessionLocal
from app.database import crud
from app.firewall.policy_engine import policy_engine
from app.audit.audit_logger import audit_logger
from app.api.routes import (
    firewall_router,
    threats_router,
    attacks_router,
    policies_router,
    audit_router,
    dashboard_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup & shutdown lifecycle handler: initializes SQLite database,
    synchronizes default YAML policies, and validates audit genesis block.
    """
    # 1. Initialize DB tables
    init_db()

    # 2. Seed database with policies from disk if empty
    db = SessionLocal()
    try:
        existing_policies = crud.get_all_policies(db)
        if not existing_policies:
            for name, pol_data in policy_engine._policies_cache.items():
                crud.upsert_policy(
                    db=db,
                    name=name,
                    description=pol_data.get("description", ""),
                    version=pol_data.get("version", "1.0.0"),
                    rules=pol_data.get("rules", {}),
                    is_active=(name == settings.ACTIVE_POLICY_NAME)
                )

        # 3. Ensure genesis audit log entry exists
        last_entry = crud.get_last_audit_entry(db)
        if not last_entry:
            audit_logger.record_event(
                db=db,
                event_type="GENESIS_SYSTEM_STARTUP",
                session_id="system-core",
                data={
                    "service": settings.PROJECT_NAME,
                    "version": settings.VERSION,
                    "active_policy": settings.ACTIVE_POLICY_NAME
                }
            )
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Agent Security Firewall, Runtime Guardrails, DLP, and Red-Teaming Gateway.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers under /api/v1
app.include_router(firewall_router, prefix=settings.API_V1_STR)
app.include_router(threats_router, prefix=settings.API_V1_STR)
app.include_router(attacks_router, prefix=settings.API_V1_STR)
app.include_router(policies_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_status():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "endpoints": {
            "firewall": f"{settings.API_V1_STR}/firewall",
            "threats": f"{settings.API_V1_STR}/threats",
            "attacks": f"{settings.API_V1_STR}/attacks",
            "policies": f"{settings.API_V1_STR}/policies",
            "audit": f"{settings.API_V1_STR}/audit",
            "dashboard": f"{settings.API_V1_STR}/dashboard",
        }
    }


@app.get("/health", tags=["Root"])
def healthcheck():
    return {"status": "ok"}
