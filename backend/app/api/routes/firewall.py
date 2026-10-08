from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.models.security_event import (
    PromptInspectionRequest,
    ToolCallInspectionRequest,
    OutputInspectionRequest,
    TurnExecutionRequest,
    InspectionResult
)
from app.firewall.decision_engine import decision_engine
from app.agent.agent import agent
from app.database import crud
from app.audit.audit_logger import audit_logger

router = APIRouter(prefix="/firewall", tags=["Firewall"])


@router.post("/inspect-prompt", response_model=InspectionResult)
def inspect_prompt_endpoint(
    req: PromptInspectionRequest,
    db: Session = Depends(get_db)
):
    """
    Inspect a user prompt against active firewall rules before agent consumption.
    """
    result = decision_engine.inspect_prompt(
        prompt=req.prompt,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        policy_name=req.policy_name
    )

    # Persist security event to database
    crud.log_security_event(
        db=db,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        event_type="PROMPT_INSPECTION",
        severity=result.severity.value,
        decision=result.decision.value,
        threat_type=result.threat_type,
        details={
            "reason": result.reason,
            "violations": result.rule_violations,
            "confidence": result.confidence_score,
            "sanitized": result.sanitized_content != req.prompt
        },
        latency_ms=result.latency_ms
    )

    # Record in tamper-evident audit log
    audit_logger.record_event(
        db=db,
        event_type="PROMPT_INSPECTION",
        session_id=req.session_id or "default-session",
        data={
            "decision": result.decision.value,
            "threat_type": result.threat_type,
            "confidence": result.confidence_score,
            "latency_ms": result.latency_ms
        }
    )

    return result


@router.post("/inspect-tool", response_model=InspectionResult)
def inspect_tool_endpoint(
    req: ToolCallInspectionRequest,
    db: Session = Depends(get_db)
):
    """
    Inspect an intended agent tool invocation against policy permissions, taint flows, and arguments.
    """
    result = decision_engine.inspect_tool_call(
        tool_name=req.tool_name,
        tool_args=req.tool_args,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        is_tainted=req.is_tainted,
        taint_source=req.taint_source,
        policy_name=req.policy_name
    )

    crud.log_security_event(
        db=db,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        event_type="TOOL_CALL",
        severity=result.severity.value,
        decision=result.decision.value,
        threat_type=result.threat_type,
        details={
            "tool": req.tool_name,
            "reason": result.reason,
            "violations": result.rule_violations
        },
        latency_ms=result.latency_ms
    )

    return result


@router.post("/inspect-output", response_model=InspectionResult)
def inspect_output_endpoint(
    req: OutputInspectionRequest,
    db: Session = Depends(get_db)
):
    """
    Inspect LLM-generated output for sensitive data exposure and malicious beaconing before client return.
    """
    result = decision_engine.inspect_output(
        output_text=req.output_text,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        policy_name=req.policy_name
    )

    crud.log_security_event(
        db=db,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        event_type="AGENT_OUTPUT",
        severity=result.severity.value,
        decision=result.decision.value,
        threat_type=result.threat_type,
        details={
            "reason": result.reason,
            "violations": result.rule_violations
        },
        latency_ms=result.latency_ms
    )

    return result


@router.post("/execute-turn")
def execute_turn_endpoint(
    req: TurnExecutionRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a complete agent cycle through all 3 firewall interception checkpoints.
    """
    turn_result = agent.process_turn(
        prompt=req.prompt,
        session_id=req.session_id or "default-session",
        policy_name=req.policy_name or "default",
        simulate_tools=req.simulate_tools
    )

    # Log turn completion
    crud.log_security_event(
        db=db,
        session_id=req.session_id or "default-session",
        agent_id=req.agent_id or "default-agent",
        event_type="AGENT_TURN_EXECUTED",
        severity="NONE" if turn_result["status"] == "SUCCESS" else "HIGH",
        decision=turn_result["overall_decision"],
        threat_type=turn_result["prompt_inspection"].get("threat_type"),
        details={
            "status": turn_result["status"],
            "tool_count": len(turn_result["tool_executions"])
        }
    )

    return turn_result
