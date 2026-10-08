from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.audit.audit_logger import audit_logger
from app.database import crud

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Trail"])


@router.get("/logs")
def get_audit_logs(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """
    Retrieve ordered audit log entries including cryptographic hash chain references.
    """
    entries = crud.get_audit_trail(db, limit=limit)
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "event_type": e.event_type,
            "session_id": e.session_id,
            "previous_hash": e.previous_hash,
            "entry_hash": e.entry_hash,
            "data": e.data_json
        }
        for e in entries
    ]


@router.get("/verify")
def verify_hash_chain(db: Session = Depends(get_db)):
    """
    Perform a complete cryptographic integrity audit across the hash chain
    to detect any unauthorized record alterations, deletions, or insertions.
    """
    return audit_logger.verify_chain_integrity(db)


@router.post("/export")
def export_audit_trail(db: Session = Depends(get_db)):
    """
    Export full audit log dataset formatted for external compliance archiving.
    """
    entries = crud.get_audit_trail(db, limit=50000)
    integrity_status = audit_logger.verify_chain_integrity(db)
    return {
        "integrity_verified": integrity_status["is_valid"],
        "total_records": len(entries),
        "exported_records": [
            {
                "id": e.id,
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "session_id": e.session_id,
                "previous_hash": e.previous_hash,
                "entry_hash": e.entry_hash,
                "data": e.data_json
            }
            for e in entries
        ]
    }
