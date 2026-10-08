import re
from typing import Dict, Any, List
from app.firewall.dlp_scanner import dlp_scanner
from app.models.security_event import ThreatSeverity, FirewallDecision


class OutputScanner:
    """
    Scans generated agent output to prevent data leakage, exfiltration beacons,
    system prompt revelations, and dangerous code patterns.
    """

    SYSTEM_LEAK_PATTERNS = [
        re.compile(r"(?i)\byou\s+are\s+an\s+ai\s+(?:agent|assistant)\s+created\s+by\b"),
        re.compile(r"(?i)\bmy\s+(?:system\s+prompt|developer\s+instructions)\s+(?:is|are|states):\b"),
        re.compile(r"(?i)###\s*system\s*(?:directive|instructions)\b"),
    ]

    # Markdown image exfiltration: ![alt](url?param=sensitive)
    IMAGE_BEACON_PATTERN = re.compile(r"!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)")

    def scan(self, output_text: str, policy: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Scan output for safety, DLP leaks, and exfiltration beacons.
        """
        if not output_text:
            return {
                "decision": FirewallDecision.ALLOW.value,
                "sanitized_output": "",
                "severity": ThreatSeverity.NONE.value,
                "violations": [],
                "reason": "Empty output"
            }

        violations: List[str] = []
        severity = ThreatSeverity.NONE.value
        sanitized = output_text
        threat_type = None

        # 1. Check for Markdown Image Exfiltration Beacons
        image_matches = self.IMAGE_BEACON_PATTERN.findall(output_text)
        for alt, url in image_matches:
            if any(term in url.lower() for term in ["token", "key", "secret", "telemetry", "leak", "attacker", "evil"]):
                violations.append(f"Detected potential Markdown Image Exfiltration Beacon targeting '{url}'")
                severity = ThreatSeverity.CRITICAL.value
                threat_type = "MARKDOWN_BEACON_EXFILTRATION"
                # Remove the dangerous markdown image
                sanitized = self.IMAGE_BEACON_PATTERN.sub("[BLOCKED_IMAGE_BEACON]", sanitized)

        # 2. Check for System Prompt Leakage
        for pattern in self.SYSTEM_LEAK_PATTERNS:
            if pattern.search(output_text):
                violations.append("Detected possible system prompt leakage in output")
                severity = ThreatSeverity.HIGH.value
                threat_type = "SYSTEM_PROMPT_LEAKAGE"
                break

        # 3. DLP Scan
        dlp_res = dlp_scanner.scan(sanitized)
        if dlp_res["has_violations"]:
            violations.append(f"DLP: Detected {dlp_res['total_matches']} sensitive data matches ({', '.join(f['type'] for f in dlp_res['findings'])})")
            sanitized = dlp_res["sanitized_text"]
            if severity != ThreatSeverity.CRITICAL.value:
                severity = dlp_res["highest_severity"]
            if not threat_type:
                threat_type = "DLP_SENSITIVE_DATA_EXPOSURE"

        # Determine decision
        if severity == ThreatSeverity.CRITICAL.value:
            decision = FirewallDecision.BLOCK.value
            reason = f"Critical security violation detected in output: {violations[0]}"
        elif len(violations) > 0:
            decision = FirewallDecision.SANITIZE.value
            reason = f"Output sanitized to mitigate data exposure: {'; '.join(violations)}"
        else:
            decision = FirewallDecision.ALLOW.value
            reason = "Agent output passed security checks"

        return {
            "decision": decision,
            "sanitized_output": sanitized,
            "severity": severity,
            "threat_type": threat_type,
            "violations": violations,
            "reason": reason
        }


output_scanner = OutputScanner()
