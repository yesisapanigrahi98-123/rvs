from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.database import crud
from app.models.security_event import SecurityEventDB

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])


@router.get("/")
def list_threats(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    decision: Optional[str] = Query(None, description="Filter by ALLOW, BLOCK, SANITIZE"),
    threat_type: Optional[str] = Query(None, description="Filter by threat identifier"),
    severity: Optional[str] = Query(None, description="Filter by LOW, MEDIUM, HIGH, CRITICAL"),
    db: Session = Depends(get_db)
):
    """
    Query logged security threats and firewall interventions with filtering.
    """
    events = crud.get_security_events(
        db=db,
        skip=skip,
        limit=limit,
        decision=decision,
        threat_type=threat_type,
        severity=severity
    )
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "session_id": e.session_id,
            "agent_id": e.agent_id,
            "event_type": e.event_type,
            "severity": e.severity,
            "decision": e.decision,
            "threat_type": e.threat_type,
            "details": e.details_json,
            "latency_ms": e.latency_ms
        }
        for e in events
    ]


@router.get("/summary")
def get_threats_summary(db: Session = Depends(get_db)):
    """
    Get aggregated counts and category distribution of identified threats.
    """
    return crud.get_threats_summary(db)


@router.get("/{event_id}")
def get_threat_detail(event_id: int, db: Session = Depends(get_db)):
    """
    Get detailed audit records for a specific security event.
    """
    event = db.query(SecurityEventDB).filter(SecurityEventDB.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Security event not found")
    return {
        "id": event.id,
        "timestamp": event.timestamp.isoformat(),
        "session_id": event.session_id,
        "agent_id": event.agent_id,
        "event_type": event.event_type,
        "severity": event.severity,
        "decision": event.decision,
        "threat_type": event.threat_type,
        "details": event.details_json,
        "latency_ms": event.latency_ms
    }
