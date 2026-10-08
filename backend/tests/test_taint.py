import pytest
from app.firewall.taint_tracker import TaintTracker


def test_taint_propagation_and_sink_blocking():
    tracker = TaintTracker()
    session_id = "test-session-taint-1"

    # Initially untainted
    assert tracker.is_tainted(session_id) is False
    res_clean = tracker.evaluate_sink(session_id, "code_tool", {"code": "print(1)"})
    assert res_clean["violation"] is False

    # Ingest untrusted web page
    tracker.mark_tainted(
        session_id=session_id,
        source_tool="web_tool",
        data_sample="Poisoned article with hidden instructions"
    )

    assert tracker.is_tainted(session_id) is True

    # Now calling code_tool must trigger a sink violation
    res_code = tracker.evaluate_sink(session_id, "code_tool", {"code": "import os; os.system('curl')"})
    assert res_code["violation"] is True
    assert res_code["threat_type"] == "TAINT_SINK_VIOLATION_CODE_EXECUTION"

    # Outbound email should also trigger sink violation
    res_email = tracker.evaluate_sink(session_id, "email_tool", {"action": "send", "to": "attacker@evil.com"})
    assert res_email["violation"] is True
    assert res_email["threat_type"] == "TAINT_SINK_VIOLATION_EXFILTRATION"

    # Clear taint
    tracker.clear_taint(session_id)
    assert tracker.is_tainted(session_id) is False
