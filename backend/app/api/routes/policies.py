import yaml
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.models.policy import PolicyCreate, PolicyRead
from app.firewall.policy_engine import policy_engine
from app.database import crud
from app.audit.audit_logger import audit_logger

router = APIRouter(prefix="/policies", tags=["Security Policies"])


@router.get("/")
def list_policies(db: Session = Depends(get_db)):
    """
    List all available security policies in the engine.
    """
    db_policies = crud.get_all_policies(db)
    # Merge with memory policies
    policies = []
    seen = set()

    for p in db_policies:
        seen.add(p.name)
        policies.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "version": p.version,
            "is_active": p.is_active,
            "rules": p.rules_json,
            "created_at": p.created_at.isoformat() if p.created_at else None
        })

    for name, p_data in policy_engine._policies_cache.items():
        if name not in seen:
            policies.append({
                "id": None,
                "name": name,
                "description": p_data.get("description", ""),
                "version": p_data.get("version", "1.0.0"),
                "is_active": p_data.get("is_active", False),
                "rules": p_data.get("rules", {}),
                "created_at": None
            })

    return policies


@router.get("/{name}")
def get_policy(name: str, db: Session = Depends(get_db)):
    """
    Get detailed configuration for a specific policy.
    """
    pol = policy_engine.get_policy(name)
    if not pol or not pol.get("rules"):
        raise HTTPException(status_code=404, detail=f"Policy '{name}' not found")
    return pol


@router.post("/", response_model=Dict[str, Any])
def create_or_update_policy(
    policy_data: PolicyCreate,
    db: Session = Depends(get_db)
):
    """
    Create or update a declarative security policy.
    """
    saved = crud.upsert_policy(
        db=db,
        name=policy_data.name,
        description=policy_data.description,
        version=policy_data.version,
        rules=policy_data.rules,
        is_active=policy_data.is_active
    )

    # Sync into engine cache
    policy_engine.register_policy(
        policy_data.name,
        {
            "name": policy_data.name,
            "description": policy_data.description,
            "version": policy_data.version,
            "is_active": policy_data.is_active,
            "rules": policy_data.rules
        }
    )

    audit_logger.record_event(
        db=db,
        event_type="POLICY_UPSERTED",
        session_id="system",
        data={"name": policy_data.name, "version": policy_data.version}
    )

    return {
        "id": saved.id,
        "name": saved.name,
        "description": saved.description,
        "version": saved.version,
        "is_active": saved.is_active,
        "rules": saved.rules_json
    }


@router.put("/{name}/activate")
def activate_policy(name: str, db: Session = Depends(get_db)):
    """
    Switch active runtime security policy.
    """
    target = policy_engine.get_policy(name)
    if not target:
        raise HTTPException(status_code=404, detail=f"Policy '{name}' not found")

    crud.set_active_policy(db, name)
    for p_name, p_val in policy_engine._policies_cache.items():
        p_val["is_active"] = (p_name == name)

    audit_logger.record_event(
        db=db,
        event_type="ACTIVE_POLICY_SWITCHED",
        session_id="system",
        data={"active_policy": name}
    )

    return {"status": "SUCCESS", "active_policy": name}


@router.post("/validate")
def validate_policy_syntax(yaml_content: str = Body(..., media_type="text/plain")):
    """
    Validate YAML syntax and structure for a prospective security policy.
    """
    try:
        parsed = yaml.safe_load(yaml_content)
        if not isinstance(parsed, dict) or "name" not in parsed or "rules" not in parsed:
            return {"valid": False, "error": "Policy must be a YAML object with 'name' and 'rules' root fields"}
        return {"valid": True, "parsed": parsed}
    except Exception as e:
        return {"valid": False, "error": str(e)}
