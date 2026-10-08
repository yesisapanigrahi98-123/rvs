from typing import Dict, Any, Optional
from app.tools import TOOL_REGISTRY
from app.firewall.decision_engine import decision_engine
from app.firewall.taint_tracker import taint_tracker
from app.models.security_event import FirewallDecision


class ToolRouter:
    """
    Safely routes planned tool calls through firewall inspection before execution,
    and updates session taint provenance upon external data ingestion.
    """

    def dispatch(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        session_id: str = "default-session",
        agent_id: str = "default-agent",
        policy_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Inspect and conditionally execute a tool call.
        """
        # 1. Firewall inspection
        inspection = decision_engine.inspect_tool_call(
            tool_name=tool_name,
            tool_args=tool_args,
            session_id=session_id,
            agent_id=agent_id,
            is_tainted=taint_tracker.is_tainted(session_id),
            policy_name=policy_name
        )

        # 2. Block if firewall decided BLOCK
        if inspection.decision == FirewallDecision.BLOCK:
            return {
                "executed": False,
                "blocked": True,
                "tool": tool_name,
                "inspection": inspection.model_dump(),
                "output": None,
                "error": f"Firewall intercepted tool call: {inspection.reason}"
            }

        # 3. Lookup tool in registry
        tool_instance = TOOL_REGISTRY.get(tool_name)
        if not tool_instance:
            return {
                "executed": False,
                "blocked": False,
                "tool": tool_name,
                "inspection": inspection.model_dump(),
                "output": None,
                "error": f"Tool '{tool_name}' not found in registry"
            }

        # 4. Execute tool
        try:
            tool_output = tool_instance.execute(**tool_args)
        except Exception as e:
            tool_output = {"success": False, "error": str(e)}

        # 5. Check if output is tainted from untrusted external source
        if tool_name in ("web_tool", "email_tool"):
            sample = str(tool_output)[:300]
            taint_tracker.mark_tainted(
                session_id=session_id,
                source_tool=tool_name,
                data_sample=sample,
                reason=f"Ingested external data via {tool_name}"
            )

        return {
            "executed": True,
            "blocked": False,
            "tool": tool_name,
            "inspection": inspection.model_dump(),
            "output": tool_output,
            "error": None
        }


tool_router = ToolRouter()
