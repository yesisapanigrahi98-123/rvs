from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from app.database.database import Base


class PolicyRules(BaseModel):
    allowed_tools: List[str] = Field(default_factory=lambda: ["email_tool", "web_tool", "file_tool", "code_tool"])
    blocked_tools: List[str] = Field(default_factory=list)
    rate_limits: Dict[str, Any] = Field(default_factory=lambda: {
        "max_tool_calls_per_turn": 10,
        "max_input_length_chars": 16000
    })
    injection_defense: Dict[str, Any] = Field(default_factory=lambda: {
        "strict_mode": False,
        "confidence_threshold": 0.65,
        "block_on_detection": True
    })
    dlp: Dict[str, Any] = Field(default_factory=lambda: {
        "scan_inputs": True,
        "scan_outputs": True,
        "scan_tool_args": True,
        "action_on_secrets": "REDACT",
        "action_on_pii": "REDACT"
    })
    taint_tracking: Dict[str, Any] = Field(default_factory=lambda: {
        "enabled": True,
        "enforce_taint_sinks": True,
        "untrusted_sources": ["web_tool", "email_tool"],
        "critical_sinks": ["code_tool", "email_tool"]
    })
    parameter_constraints: Dict[str, Any] = Field(default_factory=dict)


class PolicyCreate(BaseModel):
    name: str = Field(..., description="Unique policy identifier")
    description: str = Field(..., description="Human readable description")
    version: str = Field(default="1.0.0")
    is_active: bool = Field(default=False)
    rules: Dict[str, Any] = Field(default_factory=dict)


class PolicyUpdate(BaseModel):
    description: Optional[str] = None
    is_active: Optional[bool] = None
    rules: Optional[Dict[str, Any]] = None


class PolicyRead(BaseModel):
    id: int
    name: str
    description: str
    version: str
    is_active: bool
    rules: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PolicyDB(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), default="")
    version = Column(String(20), default="1.0.0")
    is_active = Column(Boolean, default=False, index=True)
    rules_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
