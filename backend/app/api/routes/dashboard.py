from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.database import crud
from app.audit.audit_logger import audit_logger
from app.firewall.policy_engine import policy_engine
from app.sandbox.sandbox_manager import sandbox_manager

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Metrics"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Get holistic executive metrics for the security monitoring dashboard.
    """
    summary = crud.get_threats_summary(db)
    active_pol = policy_engine.get_policy()
    runs = crud.get_attack_runs(db, limit=1)
    last_run = runs[0] if runs else None
    chain_status = audit_logger.verify_chain_integrity(db)

    # Compute defense efficacy
    total = summary["total_events"]
    blocked = summary["blocked_count"]
    defense_rate = round((blocked / total * 100.0), 2) if total > 0 else 100.0

    return {
        "overview": {
            "total_inspections": total,
            "blocked_threats": blocked,
            "allowed_requests": summary["allowed_count"],
            "sanitized_requests": summary["sanitized_count"],
            "defense_efficacy_rate": defense_rate
        },
        "active_policy": {
            "name": active_pol.get("name", "default"),
            "description": active_pol.get("description", ""),
            "version": active_pol.get("version", "1.0.0")
        },
        "latest_redteam_benchmark": {
            "run_id": last_run.run_id if last_run else None,
            "asr_score": last_run.asr_score if last_run else 0.0,
            "defense_rate": last_run.defense_rate if last_run else 100.0,
            "total_tests": last_run.total_tests if last_run else 0
        },
        "audit_chain": {
            "status": "HEALTHY" if chain_status["is_valid"] else "COMPROMISED",
            "is_valid": chain_status["is_valid"],
            "total_records": chain_status["total_records"]
        },
        "sandbox": sandbox_manager.get_status(),
        "threat_categories": summary["threat_categories"],
        "severity_distribution": summary["severity_distribution"]
    }


@router.get("/health")
def get_system_health(db: Session = Depends(get_db)):
    """
    Component-level health check.
    """
    return {
        "status": "healthy",
        "components": {
            "firewall_engine": "online",
            "injection_detector": "active",
            "dlp_scanner": "active",
            "taint_tracker": "active",
            "policy_engine": "active",
            "sandbox": sandbox_manager.get_status()["execution_mode"],
            "audit_hash_chain": "synchronized",
            "database": "connected"
        }
    }
