import re
from typing import Dict, List, Any, Tuple
from app.models.security_event import ThreatSeverity


class DLPScanner:
    """
    Data Loss Prevention (DLP) scanner for identifying sensitive data,
    Personally Identifiable Information (PII), and exposed secrets/credentials.
    """

    PATTERNS: Dict[str, Tuple[re.Pattern, str, str]] = {
        # (Pattern, Redaction Label, Threat Severity)
        "openai_api_key": (
            re.compile(r"\b(sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9_-]{20,})\b"),
            "[REDACTED_OPENAI_KEY]",
            ThreatSeverity.CRITICAL.value
        ),
        "aws_access_key": (
            re.compile(r"\b(AKIA[0-9A-Z]{16})\b"),
            "[REDACTED_AWS_KEY]",
            ThreatSeverity.CRITICAL.value
        ),
        "aws_secret_key": (
            re.compile(r"(?i)aws_secret_access_key\s*[:=]\s*['\"]?([a-zA-Z0-9/+=]{40})['\"]?"),
            "[REDACTED_AWS_SECRET]",
            ThreatSeverity.CRITICAL.value
        ),
        "github_token": (
            re.compile(r"\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,})\b"),
            "[REDACTED_GITHUB_TOKEN]",
            ThreatSeverity.CRITICAL.value
        ),
        "private_key": (
            re.compile(r"-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----"),
            "[REDACTED_PRIVATE_KEY]",
            ThreatSeverity.CRITICAL.value
        ),
        "jwt_token": (
            re.compile(r"\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b"),
            "[REDACTED_JWT_TOKEN]",
            ThreatSeverity.HIGH.value
        ),
        "db_connection_uri": (
            re.compile(r"\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s:]+:[^\s@]+@[^\s]+\b"),
            "[REDACTED_DB_URI]",
            ThreatSeverity.CRITICAL.value
        ),
        "credit_card": (
            re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b"),
            "[REDACTED_CREDIT_CARD]",
            ThreatSeverity.HIGH.value
        ),
        "ssn": (
            re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
            "[REDACTED_SSN]",
            ThreatSeverity.HIGH.value
        ),
        "email": (
            re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"),
            "[REDACTED_EMAIL]",
            ThreatSeverity.MEDIUM.value
        ),
        "phone_number": (
            re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
            "[REDACTED_PHONE]",
            ThreatSeverity.LOW.value
        )
    }

    def scan(self, text: str) -> Dict[str, Any]:
        """
        Scan text for PII and secrets, returning findings and sanitized text.
        """
        if not text:
            return {
                "has_violations": False,
                "findings": [],
                "sanitized_text": "",
                "highest_severity": ThreatSeverity.NONE.value,
                "total_matches": 0
            }

        sanitized = text
        findings = []
        severity_order = {
            ThreatSeverity.CRITICAL.value: 4,
            ThreatSeverity.HIGH.value: 3,
            ThreatSeverity.MEDIUM.value: 2,
            ThreatSeverity.LOW.value: 1,
            ThreatSeverity.NONE.value: 0
        }
        max_severity_score = 0
        highest_severity = ThreatSeverity.NONE.value

        for key, (pattern, redact_label, severity) in self.PATTERNS.items():
            matches = list(pattern.finditer(text))
            if matches:
                count = len(matches)
                findings.append({
                    "type": key,
                    "count": count,
                    "severity": severity,
                    "redaction_label": redact_label
                })
                # Redact in sanitized output
                sanitized = pattern.sub(redact_label, sanitized)

                sev_score = severity_order.get(severity, 0)
                if sev_score > max_severity_score:
                    max_severity_score = sev_score
                    highest_severity = severity

        has_violations = len(findings) > 0
        return {
            "has_violations": has_violations,
            "findings": findings,
            "sanitized_text": sanitized,
            "highest_severity": highest_severity,
            "total_matches": sum(f["count"] for f in findings)
        }

    def redact(self, text: str) -> str:
        """Convenience method returning solely the sanitized/redacted string."""
        return self.scan(text)["sanitized_text"]


dlp_scanner = DLPScanner()
