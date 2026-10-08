import pytest
from app.firewall.policy_engine import policy_engine


def test_restricted_agent_blocks_unauthorized_tools():
    # Restricted agent only permits file_tool
    res_code = policy_engine.evaluate_tool_call("code_tool", {"code": "print(1)"}, policy_name="restricted_agent")
    assert res_code["allowed"] is False
    assert "blocked" in res_code["reason"].lower() or "not authorized" in res_code["reason"].lower()

    res_email = policy_engine.evaluate_tool_call("email_tool", {"to": "user@internal.net"}, policy_name="restricted_agent")
    assert res_email["allowed"] is False


def test_path_traversal_prevention():
    res = policy_engine.evaluate_tool_call("file_tool", {"path": "../../app/.env"}, policy_name="default")
    assert res["allowed"] is False
    assert res["threat_type"] in ("PATH_TRAVERSAL", "SENSITIVE_FILE_ACCESS")


def test_sensitive_file_extension_blocking():
    res = policy_engine.evaluate_tool_call("file_tool", {"path": "secrets.env"}, policy_name="default")
    assert res["allowed"] is False
    assert res["threat_type"] == "SENSITIVE_FILE_ACCESS"


def test_ssrf_internal_ip_blocking():
    res = policy_engine.evaluate_tool_call("web_tool", {"url": "http://169.254.169.254/latest/meta-data"}, policy_name="default")
    assert res["allowed"] is False
    assert res["threat_type"] == "SSRF_ATTEMPT"


def test_disposable_email_blocking():
    res = policy_engine.evaluate_tool_call("email_tool", {"to": "leak@mailinator.com"}, policy_name="default")
    assert res["allowed"] is False
    assert res["threat_type"] == "DISPOSABLE_EMAIL_BLOCKED"
