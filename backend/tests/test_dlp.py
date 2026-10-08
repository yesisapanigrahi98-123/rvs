import pytest
from app.firewall.dlp_scanner import dlp_scanner


def test_openai_api_key_redaction():
    text = "Here is my OpenAI key: sk-proj-1234567890abcdef1234567890abcdef for your test."
    res = dlp_scanner.scan(text)
    assert res["has_violations"] is True
    assert "[REDACTED_OPENAI_KEY]" in res["sanitized_text"]
    assert "sk-proj-" not in res["sanitized_text"]


def test_aws_key_redaction():
    text = "Deploying to AWS using AKIAIOSFODNN7EXAMPLE credentials."
    res = dlp_scanner.scan(text)
    assert res["has_violations"] is True
    assert "[REDACTED_AWS_KEY]" in res["sanitized_text"]


def test_credit_card_and_ssn_redaction():
    text = "Customer SSN is 000-12-3456 and CC is 4111-2222-3333-4444."
    res = dlp_scanner.scan(text)
    assert res["has_violations"] is True
    assert "[REDACTED_SSN]" in res["sanitized_text"]
    assert "[REDACTED_CREDIT_CARD]" in res["sanitized_text"]


def test_clean_text_no_dlp_violations():
    text = "This is a standard product description for an enterprise software suite."
    res = dlp_scanner.scan(text)
    assert res["has_violations"] is False
    assert res["sanitized_text"] == text
