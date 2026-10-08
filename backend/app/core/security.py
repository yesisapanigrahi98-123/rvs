import hashlib
import hmac
import secrets
import unicodedata
import re
from typing import Optional
from app.core.config import settings


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random hexadecimal token."""
    return secrets.token_hex(length)


def compute_sha256(data: str, salt: Optional[str] = None) -> str:
    """Compute SHA-256 hash of a string with optional salt."""
    salt_val = salt if salt is not None else settings.HASH_CHAIN_SALT
    combined = f"{salt_val}:{data}".encode("utf-8")
    return hashlib.sha256(combined).hexdigest()


def constant_time_compare(val1: str, val2: str) -> bool:
    """Safely compare two strings in constant time to prevent timing attacks."""
    return hmac.compare_digest(val1.encode("utf-8"), val2.encode("utf-8"))


def normalize_unicode(text: str) -> str:
    """
    Normalize unicode text to NFKC form and strip invisible characters
    such as zero-width spaces, soft hyphens, direction overrides.
    """
    if not text:
        return ""
    # Unicode NFKC normalization
    normalized = unicodedata.normalize("NFKC", text)

    # Invisible unicode characters pattern (zero-width space, non-joiner, joiner, soft hyphen, etc.)
    invisible_chars_pattern = re.compile(
        r"[\u200B-\u200D\uFEFF\u00AD\u2060\u200E\u200F\u202A-\u202E]"
    )
    stripped = invisible_chars_pattern.sub("", normalized)
    return stripped


def mask_sensitive_value(value: str, visible_prefix: int = 4, visible_suffix: int = 4) -> str:
    """Mask a sensitive credential or secret string, preserving edge hints for audit."""
    if len(value) <= visible_prefix + visible_suffix:
        return "[REDACTED_SECRET]"
    return f"{value[:visible_prefix]}...[REDACTED]...{value[-visible_suffix:]}"
