from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from app.models.security_event import ThreatSeverity


class TaintRecord:
    def __init__(self, source_tool: str, data_sample: str, reason: str):
        self.timestamp = datetime.now(timezone.utc)
        self.source_tool = source_tool
        self.data_sample = data_sample[:250]
        self.reason = reason

    def to_dict(self) -> Dict[str, Any]:
        return {
            "timestamp": self.timestamp.isoformat(),
            "source_tool": self.source_tool,
            "data_sample": self.data_sample,
            "reason": self.reason
        }


class TaintTracker:
    """
    Tracks data provenance and taint propagation across multi-turn agent interactions
    and tool executions to prevent indirect injection data from breaching sensitive sinks.
    """

    DEFAULT_UNTRUSTED_SOURCES = {"web_tool", "email_tool"}
    DEFAULT_CRITICAL_SINKS = {"code_tool", "email_tool", "file_tool"}

    def __init__(self):
        # session_id -> list of TaintRecords
        self._session_taints: Dict[str, List[TaintRecord]] = {}

    def mark_tainted(
        self,
        session_id: str,
        source_tool: str,
        data_sample: str,
        reason: str = "External untrusted data ingested"
    ):
        """Register that a session has ingested tainted external data."""
        if session_id not in self._session_taints:
            self._session_taints[session_id] = []
        record = TaintRecord(source_tool=source_tool, data_sample=str(data_sample), reason=reason)
        self._session_taints[session_id].append(record)

    def is_tainted(self, session_id: str) -> bool:
        """Check if session is currently in a tainted state."""
        return len(self._session_taints.get(session_id, [])) > 0

    def get_taint_history(self, session_id: str) -> List[Dict[str, Any]]:
        return [r.to_dict() for r in self._session_taints.get(session_id, [])]

    def clear_taint(self, session_id: str):
        """Clear taint records for a session."""
        if session_id in self._session_taints:
            del self._session_taints[session_id]

    def evaluate_sink(
        self,
        session_id: str,
        target_tool: str,
        tool_args: Dict[str, Any],
        taint_rules: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate if calling target_tool with the given tool_args while in a tainted state
        constitutes a taint sink violation.
        """
        rules = taint_rules or {}
        critical_sinks = set(rules.get("critical_sinks", self.DEFAULT_CRITICAL_SINKS))
        enforce = rules.get("enforce_taint_sinks", True)

        is_tainted_session = self.is_tainted(session_id)
        if not is_tainted_session or not enforce:
            return {
                "violation": False,
                "reason": "Session is untainted or enforcement disabled",
                "severity": ThreatSeverity.NONE.value
            }

        # If calling a critical sink while tainted:
        if target_tool in critical_sinks:
            records = self._session_taints[session_id]
            last_source = records[-1].source_tool if records else "unknown"
            
            # Special case: reading safe local file or simple search might be exempt, but code execution or outbound email is strictly blocked
            if target_tool == "code_tool":
                return {
                    "violation": True,
                    "reason": f"Tainted data from '{last_source}' cannot flow into execution sink '{target_tool}'",
                    "severity": ThreatSeverity.CRITICAL.value,
                    "threat_type": "TAINT_SINK_VIOLATION_CODE_EXECUTION",
                    "source": last_source
                }
            elif target_tool == "email_tool" and tool_args.get("action") in ("send", "forward", None):
                return {
                    "violation": True,
                    "reason": f"Tainted external data from '{last_source}' cannot be dispatched via outbound email sink",
                    "severity": ThreatSeverity.CRITICAL.value,
                    "threat_type": "TAINT_SINK_VIOLATION_EXFILTRATION",
                    "source": last_source
                }
            elif target_tool == "file_tool" and tool_args.get("action") in ("write", "delete"):
                return {
                    "violation": True,
                    "reason": f"Tainted external data from '{last_source}' cannot perform state-modifying file operations",
                    "severity": ThreatSeverity.HIGH.value,
                    "threat_type": "TAINT_SINK_VIOLATION_FILE_MODIFICATION",
                    "source": last_source
                }

        return {
            "violation": False,
            "reason": "Tool invocation permitted under current taint policy",
            "severity": ThreatSeverity.NONE.value
        }


taint_tracker = TaintTracker()
