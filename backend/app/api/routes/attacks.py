from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.models.attack_result import (
    AttackRunRequest,
    AttackSuiteSummary,
    AttackCase
)
from app.redteam.attack_runner import attack_runner
from app.database import crud
from app.models.attack_result import AttackRunDB

router = APIRouter(prefix="/attacks", tags=["Red Team Benchmark"])


@router.get("/cases", response_model=List[AttackCase])
def list_attack_cases(category: Optional[str] = Query(None)):
    """
    List all pre-configured red-teaming adversarial attack scenarios.
    """
    return attack_runner.load_attack_cases(category_filter=category)


@router.post("/run", response_model=AttackSuiteSummary)
def run_attacks_suite(
    req: AttackRunRequest,
    db: Session = Depends(get_db)
):
    """
    Trigger execution of the red-teaming attack benchmark suite against the firewall.
    """
    summary = attack_runner.run_suite(
        db=db,
        suite_name=req.suite_name or "Automated Red Team Suite",
        category_filter=req.category_filter,
        policy_name=req.policy_name or "default"
    )
    return summary


@router.get("/runs")
def list_attack_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Get historical records of red team benchmark runs.
    """
    runs = crud.get_attack_runs(db, limit=limit)
    return [
        {
            "id": r.id,
            "run_id": r.run_id,
            "timestamp": r.timestamp.isoformat(),
            "suite_name": r.suite_name,
            "policy_name": r.policy_name,
            "total_tests": r.total_tests,
            "passed_tests": r.passed_tests,
            "blocked_tests": r.blocked_tests,
            "bypassed_tests": r.bypassed_tests,
            "asr_score": r.asr_score,
            "defense_rate": r.defense_rate,
            "average_latency_ms": r.average_latency_ms
        }
        for r in runs
    ]


@router.get("/runs/{run_id}")
def get_attack_run_detail(run_id: str, db: Session = Depends(get_db)):
    """
    Fetch comprehensive benchmark results for a specific attack run.
    """
    run = db.query(AttackRunDB).filter(AttackRunDB.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Attack run not found")
    return {
        "id": run.id,
        "run_id": run.run_id,
        "timestamp": run.timestamp.isoformat(),
        "suite_name": run.suite_name,
        "policy_name": run.policy_name,
        "total_tests": run.total_tests,
        "passed_tests": run.passed_tests,
        "blocked_tests": run.blocked_tests,
        "bypassed_tests": run.bypassed_tests,
        "asr_score": run.asr_score,
        "defense_rate": run.defense_rate,
        "average_latency_ms": run.average_latency_ms,
        "results": run.results_json
    }
