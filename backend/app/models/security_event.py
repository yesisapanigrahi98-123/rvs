from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from app.database.database import Base


class FirewallDecision(str, Enum):
    ALLOW = "ALLOW"
    BLOCK = "BLOCK"
    SANITIZE = "SANITIZE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    ESCALATE = "ESCALATE"


class ThreatSeverity(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class EventType(str, Enum):
    PROMPT_INSPECTION = "PROMPT_INSPECTION"
    TOOL_CALL = "TOOL_CALL"
    AGENT_OUTPUT = "AGENT_OUTPUT"
    TAINT_ALERT = "TAINT_ALERT"
    DLP_VIOLATION = "DLP_VIOLATION"
    POLICY_VIOLATION = "POLICY_VIOLATION"
    REDTEAM_TEST = "REDTEAM_TEST"


# Pydantic Request Schemas
class PromptInspectionRequest(BaseModel):
    prompt: str = Field(..., description="User prompt text to scan")
    session_id: Optional[str] = Field(default="session-default", description="Active session ID")
    agent_id: Optional[str] = Field(default="agent-default", description="Target agent ID")
    policy_name: Optional[str] = Field(default=None, description="Policy to evaluate against")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ToolCallInspectionRequest(BaseModel):
    tool_name: str = Field(..., description="Name of the tool the agent is invoking")
    tool_args: Dict[str, Any] = Field(default_factory=dict, description="Arguments passed to the tool")
    session_id: Optional[str] = Field(default="session-default")
    agent_id: Optional[str] = Field(default="agent-default")
    is_tainted: bool = Field(default=False, description="Whether current state or input is tainted")
    taint_source: Optional[str] = Field(default=None, description="Origin tool of tainted data")
    policy_name: Optional[str] = Field(default=None)


class OutputInspectionRequest(BaseModel):
    output_text: str = Field(..., description="Generated text response from the agent")
    session_id: Optional[str] = Field(default="session-default")
    agent_id: Optional[str] = Field(default="agent-default")
    policy_name: Optional[str] = Field(default=None)


class TurnExecutionRequest(BaseModel):
    prompt: str = Field(..., description="User prompt to process through agent and firewall")
    agent_id: Optional[str] = Field(default="agent-default")
    session_id: Optional[str] = Field(default="session-default")
    policy_name: Optional[str] = Field(default="default")
    simulate_tools: bool = Field(default=True, description="Whether to execute simulated tool loop")


# Pydantic Response Schemas
class InspectionResult(BaseModel):
    decision: FirewallDecision
    severity: ThreatSeverity
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    threat_detected: bool
    threat_type: Optional[str] = None
    reason: str
    rule_violations: List[str] = Field(default_factory=list)
    sanitized_content: Optional[str] = None
    latency_ms: float = 0.0


class SecurityEventCreate(BaseModel):
    session_id: str
    agent_id: str
    event_type: str
    severity: str
    decision: str
    threat_type: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    latency_ms: float = 0.0


class SecurityEventRead(BaseModel):
    id: int
    timestamp: datetime
    session_id: str
    agent_id: str
    event_type: EventType
    severity: ThreatSeverity
    decision: FirewallDecision
    threat_type: Optional[str] = None
    details: Dict[str, Any]
    latency_ms: float

    model_config = {"from_attributes": True}


# SQLAlchemy ORM Model
class SecurityEventDB(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    session_id = Column(String(100), index=True)
    agent_id = Column(String(100), index=True)
    event_type = Column(String(50), index=True)
    severity = Column(String(20), index=True)
    decision = Column(String(30), index=True)
    threat_type = Column(String(100), nullable=True, index=True)
    details_json = Column(JSON, default=dict)
    latency_ms = Column(Float, default=0.0)
