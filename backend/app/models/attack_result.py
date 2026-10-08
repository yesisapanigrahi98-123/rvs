from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from app.database.database import Base


class AttackCase(BaseModel):
    id: str
    name: str
    category: str
    payload: str
    target_tool: Optional[str] = None
    description: str
    expected_decision: str = "BLOCK"
    severity: str = "HIGH"
    tags: List[str] = Field(default_factory=list)


class AttackRunRequest(BaseModel):
    suite_name: Optional[str] = Field(default="Full Red Team Benchmark Suite")
    category_filter: Optional[str] = Field(default=None, description="Optional category filter (e.g. direct_injection)")
    policy_name: Optional[str] = Field(default=None, description="Policy to test against")
    session_id: Optional[str] = Field(default=None)


class AttackCaseResult(BaseModel):
    case_id: str
    name: str
    category: str
    passed: bool
    firewall_decision: str
    severity: str
    confidence_score: float
    detected_threat: Optional[str] = None
    reason: str
    latency_ms: float
    details: Dict[str, Any] = Field(default_factory=dict)


class AttackSuiteSummary(BaseModel):
    run_id: str
    timestamp: datetime
    suite_name: str
    policy_name: str
    total_tests: int
    passed_tests: int
    blocked_tests: int
    bypassed_tests: int
    asr_score: float = Field(description="Attack Success Rate (lower is better for defense, 0.0% is impervious)")
    defense_rate: float = Field(description="Defense Rate (higher is better, 100.0% is perfect)")
    average_latency_ms: float
    results: List[AttackCaseResult]


class AttackRunDB(Base):
    __tablename__ = "attack_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    run_id = Column(String(100), unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    suite_name = Column(String(150), default="Red Team Benchmark")
    policy_name = Column(String(100), default="default")
    total_tests = Column(Integer, default=0)
    passed_tests = Column(Integer, default=0)
    blocked_tests = Column(Integer, default=0)
    bypassed_tests = Column(Integer, default=0)
    asr_score = Column(Float, default=0.0)
    defense_rate = Column(Float, default=0.0)
    average_latency_ms = Column(Float, default=0.0)
    results_json = Column(JSON, default=list)
