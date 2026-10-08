from typing import Dict, Any, Optional, List
from app.agent.planner import planner
from app.agent.tool_router import tool_router
from app.firewall.decision_engine import decision_engine
from app.models.security_event import FirewallDecision


class Agent:
    """
    Autonomous agent execution runtime with deep firewall integration
    at input, tool-dispatch, and output stages.
    """

    def __init__(self, agent_id: str = "agent-primary"):
        self.agent_id = agent_id

    def process_turn(
        self,
        prompt: str,
        session_id: str = "session-default",
        policy_name: Optional[str] = None,
        simulate_tools: bool = True
    ) -> Dict[str, Any]:
        """
        Execute a full interactive turn:
        Prompt Scanner -> Planner -> Tool Router -> Response Generator -> Output Scanner
        """
        # Phase 1: Input Firewall Inspection
        prompt_inspection = decision_engine.inspect_prompt(
            prompt=prompt,
            session_id=session_id,
            agent_id=self.agent_id,
            policy_name=policy_name
        )

        if prompt_inspection.decision == FirewallDecision.BLOCK:
            return {
                "status": "BLOCKED",
                "final_response": f"Request blocked by Firewall: {prompt_inspection.reason}",
                "prompt_inspection": prompt_inspection.model_dump(),
                "tool_executions": [],
                "output_inspection": None,
                "overall_decision": FirewallDecision.BLOCK.value
            }

        # Effective prompt after DLP sanitization (if sanitized)
        effective_prompt = prompt_inspection.sanitized_content or prompt

        # Phase 2: Planning
        planned_actions = planner.plan(effective_prompt) if simulate_tools else []
        tool_executions: List[Dict[str, Any]] = []
        aborted_by_tool_firewall = False

        # Phase 3: Tool Execution guarded by Firewall
        for action in planned_actions:
            result = tool_router.dispatch(
                tool_name=action["tool"],
                tool_args=action.get("args", {}),
                session_id=session_id,
                agent_id=self.agent_id,
                policy_name=policy_name
            )
            tool_executions.append(result)

            if result["blocked"]:
                aborted_by_tool_firewall = True
                break

        # Phase 4: Synthesize Response
        if aborted_by_tool_firewall:
            raw_response = "Action could not be completed: A planned tool invocation was blocked by security policy."
        elif tool_executions:
            tool_summaries = []
            for t in tool_executions:
                if t.get("executed"):
                    tool_summaries.append(f"Used {t['tool']} successfully.")
            raw_response = f"Processed request. Actions completed: {'; '.join(tool_summaries)}"
        else:
            raw_response = f"Response to user query: '{effective_prompt[:100]}' processed safely."

        # Phase 5: Output Firewall Inspection
        output_inspection = decision_engine.inspect_output(
            output_text=raw_response,
            session_id=session_id,
            agent_id=self.agent_id,
            policy_name=policy_name
        )

        final_response_text = output_inspection.sanitized_content or raw_response
        overall_decision = (
            FirewallDecision.BLOCK.value if output_inspection.decision == FirewallDecision.BLOCK or aborted_by_tool_firewall
            else (FirewallDecision.SANITIZE.value if output_inspection.decision == FirewallDecision.SANITIZE or prompt_inspection.decision == FirewallDecision.SANITIZE else FirewallDecision.ALLOW.value)
        )

        return {
            "status": "SUCCESS" if overall_decision != FirewallDecision.BLOCK.value else "BLOCKED",
            "final_response": final_response_text,
            "prompt_inspection": prompt_inspection.model_dump(),
            "tool_executions": tool_executions,
            "output_inspection": output_inspection.model_dump(),
            "overall_decision": overall_decision
        }


agent = Agent()
