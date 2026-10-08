import re
from typing import Dict, Any, List
from app.core.config import settings
from app.core.security import normalize_unicode
from app.models.security_event import ThreatSeverity


class InjectionDetector:
    """
    Advanced heuristic and pattern-based detector for Direct & Indirect Prompt Injections,
    jailbreak archetypes, persona hijacking, and instruction overrides.
    """

    DIRECT_INJECTION_PATTERNS = [
        # Instruction negation / override
        (re.compile(r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior|above|former)\s+(?:instructions|rules|prompts|directives|guidelines)\b"), 0.95, "DIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:rules|instructions|directives)\b"), 0.95, "DIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)\bforget\s+(?:all\s+)?(?:rules|instructions|previous\s+context)\b"), 0.90, "DIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)\boverride\s+(?:all\s+)?(?:safety|system|security)\s+(?:filters|protocols|directives)\b"), 0.95, "DIRECT_PROMPT_INJECTION"),
        
        # Jailbreak archetypes & persona shifts
        (re.compile(r"(?i)\b(?:act\s+as|you\s+are\s+now)\s+(?:dan|unchained|unrestricted|godmode|jailbroken|evil\s+bot)\b"), 0.95, "ROLEPLAY_JAILBREAK"),
        (re.compile(r"(?i)\bdo\s+anything\s+now\b"), 0.90, "ROLEPLAY_JAILBREAK"),
        (re.compile(r"(?i)\bbroken\s+free\s+of\s+the\s+typical\s+ai\s+confines\b"), 0.95, "ROLEPLAY_JAILBREAK"),
        (re.compile(r"(?i)\bdeveloper\s+mode\s+(?:enabled|activated|on)\b"), 0.90, "ROLEPLAY_JAILBREAK"),
        
        # System prompt extraction
        (re.compile(r"(?i)\b(?:reveal|output|print|show|dump|repeat)\s+(?:the\s+)?(?:verbatim\s+)?(?:system\s+prompt|initial\s+prompt|developer\s+instructions)\b"), 0.88, "SYSTEM_PROMPT_EXTRACTION"),
        (re.compile(r"(?i)\bwhat\s+(?:are|were)\s+your\s+(?:original|initial|system)\s+instructions\b"), 0.82, "SYSTEM_PROMPT_EXTRACTION"),
        
        # Administrative / Privilege spoofing
        (re.compile(r"(?i)\b(?:auth_token|root_master_override|sudo|admin_command)\b"), 0.85, "PRIVILEGE_SPOOFING"),
        (re.compile(r"(?i)\belevate\s+session\s+privilege\b"), 0.90, "PRIVILEGE_SPOOFING"),
        
        # Malicious directives in translation/wrapper tasks
        (re.compile(r"(?i)translate\s+the\s+following.*?ignore\s+all\s+safety"), 0.92, "TASK_WRAPPED_INJECTION"),
    ]

    INDIRECT_INJECTION_PATTERNS = [
        (re.compile(r"(?i)(?:important\s+system\s+instruction|system\s+directive):\s*.*?(?:forward|send|execute|delete|exfiltrate|grant)", re.DOTALL), 0.92, "INDIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)<!--\s*hidden\s+instruction:.*?-->", re.DOTALL), 0.95, "INDIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)\[\s*system\s+instruction\s*\]:\s*.*?(?:give|score|grant|trigger|call)", re.DOTALL), 0.90, "INDIRECT_PROMPT_INJECTION"),
        (re.compile(r"(?i)without\s+telling\s+(?:the\s+)?user\b"), 0.80, "INDIRECT_PROMPT_INJECTION"),
    ]

    # Keyword indicators that contribute to suspicion score
    HIGH_RISK_KEYWORDS = [
        "jailbreak", "bypass", "exploit", "exfiltrate", "dump",
        "rm -rf", "delete audit", "shadow", "passwd", "root",
        "unrestricted", "evilcorp", "credential"
    ]

    def detect(self, text: str, threshold: float = None) -> Dict[str, Any]:
        """
        Evaluate input text for prompt injection vulnerabilities.
        """
        if not text:
            return {
                "is_injection": False,
                "confidence_score": 0.0,
                "threat_type": None,
                "severity": ThreatSeverity.NONE.value,
                "matches": [],
                "reason": "Empty input"
            }

        effective_threshold = threshold if threshold is not None else settings.PROMPT_INJECTION_THRESHOLD
        clean_text = normalize_unicode(text)

        highest_score = 0.0
        primary_threat = None
        matched_rules: List[str] = []

        # 1. Direct injection matching
        for pattern, score, threat_type in self.DIRECT_INJECTION_PATTERNS:
            if pattern.search(clean_text) or pattern.search(text):
                matched_rules.append(f"Direct Injection Match: {threat_type}")
                if score > highest_score:
                    highest_score = score
                    primary_threat = threat_type

        # 2. Indirect injection matching
        for pattern, score, threat_type in self.INDIRECT_INJECTION_PATTERNS:
            if pattern.search(clean_text) or pattern.search(text):
                matched_rules.append(f"Indirect Injection Match: {threat_type}")
                if score > highest_score:
                    highest_score = score
                    primary_threat = threat_type

        # 3. High risk keyword frequency boost
        lowered = clean_text.lower()
        keyword_hits = [kw for kw in self.HIGH_RISK_KEYWORDS if kw in lowered]
        if keyword_hits:
            keyword_boost = min(0.30, len(keyword_hits) * 0.10)
            highest_score = min(1.0, highest_score + keyword_boost)
            matched_rules.append(f"High-risk security keywords found: {', '.join(keyword_hits)}")
            if not primary_threat and highest_score >= effective_threshold:
                primary_threat = "SUSPICIOUS_MALICIOUS_KEYWORDS"

        is_injection = highest_score >= effective_threshold

        # Determine severity
        if highest_score >= 0.85:
            severity = ThreatSeverity.CRITICAL.value
        elif highest_score >= effective_threshold:
            severity = ThreatSeverity.HIGH.value
        elif highest_score >= 0.40:
            severity = ThreatSeverity.MEDIUM.value
        elif highest_score > 0.0:
            severity = ThreatSeverity.LOW.value
        else:
            severity = ThreatSeverity.NONE.value

        reason = (
            f"Detected prompt injection threat '{primary_threat}' with confidence {highest_score:.2f} (threshold {effective_threshold:.2f})"
            if is_injection
            else f"Input within safe injection confidence bounds ({highest_score:.2f} < {effective_threshold:.2f})"
        )

        return {
            "is_injection": is_injection,
            "confidence_score": round(highest_score, 3),
            "threat_type": primary_threat if is_injection else None,
            "severity": severity,
            "matches": matched_rules,
            "reason": reason
        }


injection_detector = InjectionDetector()
