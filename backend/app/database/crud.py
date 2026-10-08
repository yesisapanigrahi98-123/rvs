from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, Column, Integer, String, DateTime, JSON
from app.database.database import Base
from app.models.security_event import SecurityEventDB, SecurityEventCreate, FirewallDecision, ThreatSeverity
from app.models.policy import PolicyDB
from app.models.attack_result import AttackRunDB, AttackSuiteSummary


class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    event_type = Column(String(50), index=True)
    session_id = Column(String(100), index=True)
    previous_hash = Column(String(64), nullable=False)
    entry_hash = Column(String(64), nullable=False, unique=True, index=True)
    data_json = Column(JSON, default=dict)


def log_security_event(
    db: Session,
    session_id: str,
    agent_id: str,
    event_type: str,
    severity: str,
    decision: str,
    threat_type: Optional[str],
    details: Dict[str, Any],
    latency_ms: float = 0.0
) -> SecurityEventDB:
    event = SecurityEventDB(
        session_id=session_id,
        agent_id=agent_id,
        event_type=event_type,
        severity=severity,
        decision=decision,
        threat_type=threat_type,
        details_json=details,
        latency_ms=latency_ms
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_security_events(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    decision: Optional[str] = None,
    threat_type: Optional[str] = None,
    severity: Optional[str] = None
) -> List[SecurityEventDB]:
    query = db.query(SecurityEventDB)
    if decision:
        query = query.filter(SecurityEventDB.decision == decision)
    if threat_type:
        query = query.filter(SecurityEventDB.threat_type == threat_type)
    if severity:
        query = query.filter(SecurityEventDB.severity == severity)
    return query.order_by(desc(SecurityEventDB.timestamp)).offset(skip).limit(limit).all()


def get_threats_summary(db: Session) -> Dict[str, Any]:
    total_events = db.query(SecurityEventDB).count()
    blocked_count = db.query(SecurityEventDB).filter(SecurityEventDB.decision == FirewallDecision.BLOCK.value).count()
    allowed_count = db.query(SecurityEventDB).filter(SecurityEventDB.decision == FirewallDecision.ALLOW.value).count()
    sanitized_count = db.query(SecurityEventDB).filter(SecurityEventDB.decision == FirewallDecision.SANITIZE.value).count()

    # Breakdown by category
    categories_query = (
        db.query(SecurityEventDB.threat_type, func.count(SecurityEventDB.id))
        .filter(SecurityEventDB.threat_type != None)
        .group_by(SecurityEventDB.threat_type)
        .all()
    )
    category_counts = {cat: count for cat, count in categories_query if cat}

    # Breakdown by severity
    severity_query = (
        db.query(SecurityEventDB.severity, func.count(SecurityEventDB.id))
        .group_by(SecurityEventDB.severity)
        .all()
    )
    severity_counts = {sev: count for sev, count in severity_query}

    return {
        "total_events": total_events,
        "blocked_count": blocked_count,
        "allowed_count": allowed_count,
        "sanitized_count": sanitized_count,
        "threat_categories": category_counts,
        "severity_distribution": severity_counts
    }


def get_all_policies(db: Session) -> List[PolicyDB]:
    return db.query(PolicyDB).all()


def get_policy_by_name(db: Session, name: str) -> Optional[PolicyDB]:
    return db.query(PolicyDB).filter(PolicyDB.name == name).first()


def upsert_policy(
    db: Session,
    name: str,
    description: str,
    version: str,
    rules: Dict[str, Any],
    is_active: bool = False
) -> PolicyDB:
    policy = get_policy_by_name(db, name)
    if policy:
        policy.description = description
        policy.version = version
        policy.rules_json = rules
        if is_active:
            # deactivate other policies
            db.query(PolicyDB).update({PolicyDB.is_active: False})
            policy.is_active = True
    else:
        if is_active:
            db.query(PolicyDB).update({PolicyDB.is_active: False})
        policy = PolicyDB(
            name=name,
            description=description,
            version=version,
            rules_json=rules,
            is_active=is_active
        )
        db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


def set_active_policy(db: Session, name: str) -> Optional[PolicyDB]:
    policy = get_policy_by_name(db, name)
    if not policy:
        return None
    db.query(PolicyDB).update({PolicyDB.is_active: False})
    policy.is_active = True
    db.commit()
    db.refresh(policy)
    return policy


def get_active_policy(db: Session) -> Optional[PolicyDB]:
    return db.query(PolicyDB).filter(PolicyDB.is_active == True).first()


def record_audit_entry(
    db: Session,
    event_type: str,
    session_id: str,
    previous_hash: str,
    entry_hash: str,
    data: Dict[str, Any]
) -> AuditLogDB:
    entry = AuditLogDB(
        event_type=event_type,
        session_id=session_id,
        previous_hash=previous_hash,
        entry_hash=entry_hash,
        data_json=data
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_audit_trail(db: Session, limit: int = 100) -> List[AuditLogDB]:
    return db.query(AuditLogDB).order_by(AuditLogDB.id.asc()).limit(limit).all()


def get_last_audit_entry(db: Session) -> Optional[AuditLogDB]:
    return db.query(AuditLogDB).order_by(AuditLogDB.id.desc()).first()


def save_attack_run(
    db: Session,
    summary: AttackSuiteSummary
) -> AttackRunDB:
    attack_run = AttackRunDB(
        run_id=summary.run_id,
        suite_name=summary.suite_name,
        policy_name=summary.policy_name,
        total_tests=summary.total_tests,
        passed_tests=summary.passed_tests,
        blocked_tests=summary.blocked_tests,
        bypassed_tests=summary.bypassed_tests,
        asr_score=summary.asr_score,
        defense_rate=summary.defense_rate,
        average_latency_ms=summary.average_latency_ms,
        results_json=[r.model_dump() for r in summary.results]
    )
    db.add(attack_run)
    db.commit()
    db.refresh(attack_run)
    return attack_run


def get_attack_runs(db: Session, limit: int = 20) -> List[AttackRunDB]:
    return db.query(AttackRunDB).order_by(desc(AttackRunDB.timestamp)).limit(limit).all()
