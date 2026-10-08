import base64
import re
from typing import Dict, Any, List
from app.core.config import settings
from app.core.security import normalize_unicode
from app.models.security_event import ThreatSeverity


class InputScanner:
    """
    Analyzes raw user input for format anomalies, delimiter hijacking,
    zero-width character obfuscation, encoded payloads, and structure exploits.
    """

    # Delimiters and role spoofing indicators
    DELIMITER_PATTERNS = [
        re.compile(r"(?i)<\s*\|\s*im_start\s*\|\s*system", re.IGNORECASE),
        re.compile(r"(?i)<<\s*SYS\s*>>", re.IGNORECASE),
        re.compile(r"(?i)\[\s*INST\s*\]", re.IGNORECASE),
        re.compile(r"(?i)###\s*(?:system|directive|instruction|override)\b", re.IGNORECASE),
        re.compile(r"(?i)\[\s*(?:system|admin|root|system_prompt|auth_token)\s*[:\]]", re.IGNORECASE),
        re.compile(r"(?i)<!--\s*(?:hidden|override|instruction|system)[\s\S]*?-->", re.IGNORECASE),
        re.compile(r"(?i)\[\/\/\]:\s*#\s*\([\s\S]*?\)", re.IGNORECASE),
    ]

    # Obfuscation regex: zero-width spaces or soft hyphens
    ZERO_WIDTH_REGEX = re.compile(r"[\u200B-\u200D\uFEFF\u00AD\u2060]")

    # Base64 detection
    BASE64_CANDIDATE_REGEX = re.compile(r"\b([A-Za-z0-9+/]{28,}={0,2})\b")

    def scan(self, raw_input: str) -> Dict[str, Any]:
        """
        Scan input text for low-level structural attacks and obfuscation.
        """
        violations: List[str] = []
        severity = ThreatSeverity.NONE.value
        threat_type = None

        if not raw_input:
            return {
                "is_safe": True,
                "violations": [],
                "severity": severity,
                "threat_type": None,
                "cleaned_text": "",
                "details": {}
            }

        # 1. Length check
        if len(raw_input) > settings.MAX_PROMPT_LENGTH:
            violations.append(f"Input exceeds maximum allowed length of {settings.MAX_PROMPT_LENGTH} characters")
            severity = ThreatSeverity.MEDIUM.value
            threat_type = "INPUT_OVERFLOW"

        # 2. Check for zero-width / hidden character evasion
        zero_width_matches = self.ZERO_WIDTH_REGEX.findall(raw_input)
        if len(zero_width_matches) > 2:
            violations.append(f"Detected {len(zero_width_matches)} zero-width / invisible unicode characters (obfuscation attempt)")
            severity = ThreatSeverity.HIGH.value
            threat_type = "UNICODE_OBFUSCATION"

        # Clean text
        normalized_text = normalize_unicode(raw_input)

        # 3. Delimiter and system role spoofing checks
        for pattern in self.DELIMITER_PATTERNS:
            if pattern.search(raw_input) or pattern.search(normalized_text):
                violations.append(f"Detected role-delimiter or hidden instruction tag: {pattern.pattern[:30]}")
                severity = ThreatSeverity.CRITICAL.value
                threat_type = "DELIMITER_HIJACKING"
                break

        # 4. Base64 payload inspection
        base64_candidates = self.BASE64_CANDIDATE_REGEX.findall(raw_input)
        decoded_payloads = []
        for candidate in base64_candidates[:3]:
            try:
                decoded = base64.b64decode(candidate).decode("utf-8", errors="ignore")
                if len(decoded) > 10 and any(kw in decoded.lower() for kw in ["curl", "rm ", "bash", "system", "token", "key", "password", "exec"]):
                    decoded_payloads.append(decoded)
                    violations.append(f"Suspicious decoded Base64 payload contains high-risk commands/keywords")
                    severity = ThreatSeverity.CRITICAL.value
                    threat_type = "ENCODED_PAYLOAD_EXECUTION"
            except Exception:
                pass

        is_safe = len(violations) == 0

        return {
            "is_safe": is_safe,
            "violations": violations,
            "severity": severity,
            "threat_type": threat_type,
            "cleaned_text": normalized_text,
            "details": {
                "zero_width_count": len(zero_width_matches),
                "decoded_base64_detected": len(decoded_payloads) > 0,
                "decoded_snippets": decoded_payloads[:2]
            }
        }


input_scanner = InputScanner()
