import os
import yaml
import re
from pathlib import Path
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.models.security_event import ThreatSeverity


class PolicyEngine:
    """
    Evaluates agent actions, tool permissions, parameter constraints,
    and rate limits against declarative YAML policies.
    """

    def __init__(self):
        self._policies_cache: Dict[str, Dict[str, Any]] = {}
        self._load_policies_from_disk()

    def _load_policies_from_disk(self):
        """Preload all YAML policies found in policies directory."""
        if not settings.POLICIES_DIR.exists():
            return
        for file in settings.POLICIES_DIR.glob("*.yaml"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if data and "name" in data:
                        self._policies_cache[data["name"]] = data
            except Exception as e:
                print(f"Error loading policy {file}: {e}")

    def get_policy(self, name: Optional[str] = None) -> Dict[str, Any]:
        """Get policy by name or active default."""
        target_name = name or settings.ACTIVE_POLICY_NAME
        if target_name in self._policies_cache:
            return self._policies_cache[target_name]
        # Reload disk if missing
        self._load_policies_from_disk()
        return self._policies_cache.get(target_name, self._policies_cache.get("default", {}))

    def register_policy(self, name: str, data: Dict[str, Any]):
        """Register or update in-memory policy cache."""
        self._policies_cache[name] = data

    def evaluate_tool_call(
        self,
        tool_name: str,
        tool_args: Dict[str, Any],
        policy_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate tool call permissions and argument constraints against policy.
        """
        policy = self.get_policy(policy_name)
        rules = policy.get("rules", {})

        allowed_tools = rules.get("allowed_tools", [])
        blocked_tools = rules.get("blocked_tools", [])

        # 1. Allowed / Blocked tool list verification
        if blocked_tools and tool_name in blocked_tools:
            return {
                "allowed": False,
                "reason": f"Tool '{tool_name}' is explicitly blocked by policy '{policy.get('name')}'",
                "severity": ThreatSeverity.HIGH.value,
                "threat_type": "BLOCKED_TOOL_INVOCATION"
            }

        if allowed_tools and tool_name not in allowed_tools:
            return {
                "allowed": False,
                "reason": f"Tool '{tool_name}' is not authorized in allowed_tools for policy '{policy.get('name')}'",
                "severity": ThreatSeverity.HIGH.value,
                "threat_type": "UNAUTHORIZED_TOOL_INVOCATION"
            }

        # 2. Tool Parameter Constraints
        param_rules = rules.get("parameter_constraints", {})

        # File Tool Constraints
        if tool_name == "file_tool":
            file_rules = param_rules.get("file_tool", {})
            path_arg = str(tool_args.get("path", "")).strip()

            if file_rules.get("disallow_path_traversal", True):
                if ".." in path_arg or path_arg.startswith("/") or re.search(r"^[a-zA-Z]:\\", path_arg):
                    # Check for path traversal or root escape
                    if ".." in path_arg or any(forbidden in path_arg.lower() for forbidden in [".env", "/etc", "windows", "system32"]):
                        return {
                            "allowed": False,
                            "reason": f"Path traversal or prohibited directory detected in path '{path_arg}'",
                            "severity": ThreatSeverity.CRITICAL.value,
                            "threat_type": "PATH_TRAVERSAL"
                        }

            # Check blocked extensions
            blocked_exts = file_rules.get("blocked_extensions", [".env", ".pem", ".key"])
            for ext in blocked_exts:
                if path_arg.lower().endswith(ext.lower()):
                    return {
                        "allowed": False,
                        "reason": f"Access to sensitive file extension '{ext}' is forbidden",
                        "severity": ThreatSeverity.CRITICAL.value,
                        "threat_type": "SENSITIVE_FILE_ACCESS"
                    }

            if file_rules.get("read_only", False) and tool_args.get("action") in ("write", "delete", "create"):
                return {
                    "allowed": False,
                    "reason": "File system is restricted to read-only operations",
                    "severity": ThreatSeverity.HIGH.value,
                    "threat_type": "READ_ONLY_VIOLATION"
                }

        # Web Tool Constraints
        elif tool_name == "web_tool":
            web_rules = param_rules.get("web_tool", {})
            url_arg = str(tool_args.get("url", "")).strip().lower()

            # SSRF internal IP protection
            if web_rules.get("block_internal_ips", True):
                internal_patterns = [
                    r"^https?:\/\/127\.",
                    r"^https?:\/\/localhost",
                    r"^https?:\/\/169\.254\.169\.254", # AWS metadata
                    r"^https?:\/\/10\.",
                    r"^https?:\/\/192\.168\.",
                    r"^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\."
                ]
                for p in internal_patterns:
                    if re.search(p, url_arg):
                        return {
                            "allowed": False,
                            "reason": f"SSRF Protection: Web requests to private/internal IPs or cloud metadata ({url_arg}) are blocked",
                            "severity": ThreatSeverity.CRITICAL.value,
                            "threat_type": "SSRF_ATTEMPT"
                        }

            # Blocked schemes
            blocked_schemes = web_rules.get("blocked_schemes", ["file", "gopher", "ftp"])
            for scheme in blocked_schemes:
                if url_arg.startswith(f"{scheme}:"):
                    return {
                        "allowed": False,
                        "reason": f"Access via scheme '{scheme}://' is prohibited",
                        "severity": ThreatSeverity.HIGH.value,
                        "threat_type": "FORBIDDEN_URL_SCHEME"
                    }

        # Email Tool Constraints
        elif tool_name == "email_tool":
            email_rules = param_rules.get("email_tool", {})
            recipient = str(tool_args.get("to", "")).lower()
            blocked_domains = email_rules.get("blocked_recipient_domains", ["mailinator.com", "tempmail.com"])
            for domain in blocked_domains:
                if domain in recipient:
                    return {
                        "allowed": False,
                        "reason": f"Recipient domain '{domain}' is on the untrusted/disposable domain blacklist",
                        "severity": ThreatSeverity.HIGH.value,
                        "threat_type": "DISPOSABLE_EMAIL_BLOCKED"
                    }

        return {
            "allowed": True,
            "reason": "Tool invocation conforms with security policy",
            "severity": ThreatSeverity.NONE.value
        }


policy_engine = PolicyEngine()
