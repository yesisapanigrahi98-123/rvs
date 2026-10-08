import time
from typing import Dict, Any, Optional
from app.core.config import settings
from app.models.security_event import (
    FirewallDecision,
    ThreatSeverity,
    InspectionResult
)
from app.firewall.input_scanner import input_scanner
from app.firewall.injection_detector import injection_detector
from app.firewall.taint_tracker import taint_tracker
from app.firewall.policy_engine import policy_engine
from app.firewall.dlp_scanner import dlp_scanner
from app.firewall.output_scanner import output_scanner


class DecisionEngine:
    """
    Central orchestration engine for evaluating security across prompts,
    tool calls, external data provenance (taint), and agent outputs.
    """

    def inspect_prompt(
        self,
        prompt: str,
        session_id: str = "default-session",
        agent_id: str = "default-agent",
        policy_name: Optional[str] = None
    ) -> InspectionResult:
        """
        Inspect raw user input prompt before forwarding to agent.
        """
        start_time = time.perf_counter()
        policy = policy_engine.get_policy(policy_name)
        policy_rules = policy.get("rules", {})
        injection_cfg = policy_rules.get("injection_defense", {})
        threshold = injection_cfg.get("confidence_threshold", settings.PROMPT_INJECTION_THRESHOLD)

        violations = []
        threat_detected = False
        primary_threat = None
        severity = ThreatSeverity.NONE
        decision = FirewallDecision.ALLOW
        confidence_score = 0.0
        sanitized_content = prompt

        # 1. Structural / Obfuscation Scan
        input_res = input_scanner.scan(prompt)
        if not input_res["is_safe"]:
            violations.extend(input_res["violations"])
            threat_detected = True
            primary_threat = input_res["threat_type"]
            severity = ThreatSeverity(input_res["severity"])
            confidence_score = max(confidence_score, 0.90)

        # 2. Prompt Injection Detection
        inj_res = injection_detector.detect(input_res["cleaned_text"], threshold=threshold)
        confidence_score = max(confidence_score, inj_res["confidence_score"])
        if inj_res["is_injection"]:
            threat_detected = True
            violations.extend(inj_res["matches"])
            primary_threat = inj_res["threat_type"] or primary_threat
            inj_sev = ThreatSeverity(inj_res["severity"])
            if inj_sev.value in (ThreatSeverity.CRITICAL.value, ThreatSeverity.HIGH.value):
                severity = inj_sev

        # 3. DLP Scan on Prompt
        dlp_cfg = policy_rules.get("dlp", {})
        if dlp_cfg.get("scan_inputs", True):
            dlp_res = dlp_scanner.scan(input_res["cleaned_text"])
            if dlp_res["has_violations"]:
                sanitized_content = dlp_res["sanitized_text"]
                action = dlp_cfg.get("action_on_secrets", "REDACT")
                if action == "BLOCK" and dlp_res["highest_severity"] in (ThreatSeverity.HIGH.value, ThreatSeverity.CRITICAL.value):
                    threat_detected = True
                    violations.append(f"DLP Policy Block: Sensitive data detected in input ({dlp_res['findings'][0]['type']})")
                    primary_threat = "DLP_PROMPT_BLOCKED"
                    severity = ThreatSeverity.CRITICAL
                else:
                    violations.append(f"DLP Sanitized: Redacted sensitive items from input")
                    if not primary_threat:
                        primary_threat = "DLP_SENSITIVE_DATA_DETECTED"

        # Determine Decision
        if threat_detected:
            decision = FirewallDecision.BLOCK
            reason = f"Prompt blocked: {violations[0] if violations else 'Security policy breach'}"
        elif sanitized_content != prompt:
            decision = FirewallDecision.SANITIZE
            reason = "Prompt sanitized to remove sensitive entities"
        else:
            decision = FirewallDecision.ALLOW
            reason = "Prompt passed all security checks"

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return InspectionResult(
            decision=decision,
            severity=severity,
            confidence_score=round(confidence_score, 3),
            threat_detected=threat_detected,
            threat_type=primary_threat,
            reason=reason,
            rule_violations=violations,
            sanitized_content=sanitized_content,
            latency_ms=round(latency_ms, 2)
        )

    def inspect_tool_call(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        session_id: str = "default-session",
        agent_id: str = "default-agent",
        is_tainted: bool = False,
        taint_source: Optional[str] = None,
        policy_name: Optional[str] = None
    ) -> InspectionResult:
        """
        Inspect tool invocation for permissions, parameter boundaries, and taint flow.
        """
        start_time = time.perf_counter()
        policy = policy_engine.get_policy(policy_name)
        policy_rules = policy.get("rules", {})
        violations = []
        threat_detected = False
        primary_threat = None
        severity = ThreatSeverity.NONE
        decision = FirewallDecision.ALLOW

        # If explicit taint passed, update tracker
        if is_tainted and taint_source:
            taint_tracker.mark_tainted(session_id, taint_source, str(tool_args))

        # 1. Policy Tool and Parameter Checks
        policy_res = policy_engine.evaluate_tool_call(tool_name, tool_args, policy_name)
        if not policy_res["allowed"]:
            threat_detected = True
            primary_threat = policy_res.get("threat_type", "POLICY_VIOLATION")
            severity = ThreatSeverity(policy_res.get("severity", ThreatSeverity.HIGH.value))
            violations.append(policy_res["reason"])

        # 2. Taint Sink Violation Check
        taint_rules = policy_rules.get("taint_tracking", {})
        taint_res = taint_tracker.evaluate_sink(session_id, tool_name, tool_args, taint_rules)
        if taint_res["violation"]:
            threat_detected = True
            primary_threat = taint_res.get("threat_type", "TAINT_SINK_VIOLATION")
            severity = ThreatSeverity(taint_res.get("severity", ThreatSeverity.CRITICAL.value))
            violations.append(taint_res["reason"])

        # 3. DLP on Tool Arguments
        dlp_cfg = policy_rules.get("dlp", {})
        sanitized_args = tool_args
        if dlp_cfg.get("scan_tool_args", True):
            for k, v in list(tool_args.items()):
                if isinstance(v, str):
                    d_scan = dlp_scanner.scan(v)
                    if d_scan["has_violations"]:
                        if dlp_cfg.get("action_on_secrets") == "BLOCK" and d_scan["highest_severity"] == ThreatSeverity.CRITICAL.value:
                            threat_detected = True
                            primary_threat = "DLP_SECRET_IN_TOOL_ARGS"
                            severity = ThreatSeverity.CRITICAL
                            violations.append(f"Tool argument '{k}' contains forbidden unmasked secrets")
                        else:
                            sanitized_args[k] = d_scan["sanitized_text"]

        if threat_detected:
            decision = FirewallDecision.BLOCK
            reason = f"Tool call blocked: {violations[0] if violations else 'Policy violation'}"
        else:
            decision = FirewallDecision.ALLOW
            reason = f"Tool call to '{tool_name}' verified and permitted"

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return InspectionResult(
            decision=decision,
            severity=severity,
            confidence_score=1.0 if threat_detected else 0.0,
            threat_detected=threat_detected,
            threat_type=primary_threat,
            reason=reason,
            rule_violations=violations,
            sanitized_content=str(sanitized_args),
            latency_ms=round(latency_ms, 2)
        )

    def inspect_output(
        self,
        output_text: str,
        session_id: str = "default-session",
        agent_id: str = "default-agent",
        policy_name: Optional[str] = None
    ) -> InspectionResult:
        """
        Inspect final agent output text before delivering to user.
        """
        start_time = time.perf_counter()
        policy = policy_engine.get_policy(policy_name)
        out_res = output_scanner.scan(output_text, policy)

        decision = FirewallDecision(out_res["decision"])
        severity = ThreatSeverity(out_res["severity"])
        threat_detected = decision == FirewallDecision.BLOCK
        latency_ms = (time.perf_counter() - start_time) * 1000.0

        return InspectionResult(
            decision=decision,
            severity=severity,
            confidence_score=1.0 if threat_detected else (0.5 if decision == FirewallDecision.SANITIZE else 0.0),
            threat_detected=threat_detected,
            threat_type=out_res.get("threat_type"),
            reason=out_res["reason"],
            rule_violations=out_res["violations"],
            sanitized_content=out_res["sanitized_output"],
            latency_ms=round(latency_ms, 2)
        )


decision_engine = DecisionEngine()
