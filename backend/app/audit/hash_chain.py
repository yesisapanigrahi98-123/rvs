import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from app.core.security import compute_sha256
from app.core.config import settings


class HashChain:
    """
    Implements a cryptographic, tamper-evident hash chain (Merkle-style sequential log)
    guaranteeing non-repudiation and integrity verification for all audit trail entries.
    """

    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    @staticmethod
    def canonical_json(data: Any) -> str:
        """Produce deterministic, sorted JSON serialization."""
        return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)

    @classmethod
    def calculate_entry_hash(
        cls,
        previous_hash: str,
        timestamp_str: str,
        event_type: str,
        data: Dict[str, Any]
    ) -> str:
        """
        Compute SHA-256 hash for a log entry:
        hash = SHA256(previous_hash + "|" + timestamp + "|" + event_type + "|" + canonical_data)
        """
        canon_data = cls.canonical_json(data)
        payload = f"{previous_hash}|{timestamp_str}|{event_type}|{canon_data}"
        return compute_sha256(payload, salt=settings.HASH_CHAIN_SALT)

    @classmethod
    def verify_chain(cls, entries: List[Any]) -> Tuple[bool, Optional[int], str]:
        """
        Verify the integrity of a chain of audit log entries.
        Returns: (is_valid, broken_index, reason)
        """
        if not entries:
            return True, None, "Empty chain is valid"

        expected_prev_hash = cls.GENESIS_HASH

        for idx, entry in enumerate(entries):
            # Extract attributes whether ORM object or dict
            prev_hash = getattr(entry, "previous_hash", None) or entry.get("previous_hash")
            curr_hash = getattr(entry, "entry_hash", None) or entry.get("entry_hash")
            event_type = getattr(entry, "event_type", None) or entry.get("event_type")
            data = getattr(entry, "data_json", None) or entry.get("data_json", {})
            raw_ts = getattr(entry, "timestamp", None) or entry.get("timestamp")

            ts_str = raw_ts.isoformat() if isinstance(raw_ts, datetime) else str(raw_ts)

            # Check 1: previous hash continuity
            if prev_hash != expected_prev_hash:
                return (
                    False,
                    idx,
                    f"Hash break at record index {idx}: Expected previous hash '{expected_prev_hash[:12]}...', found '{prev_hash[:12]}...'"
                )

            # Check 2: recalculate current hash to verify content hasn't been modified
            recomputed = cls.calculate_entry_hash(prev_hash, ts_str, event_type, data)
            if recomputed != curr_hash:
                return (
                    False,
                    idx,
                    f"Content tampering detected at record index {idx}: Entry hash mismatch."
                )

            expected_prev_hash = curr_hash

        return True, None, f"Hash chain verified successfully ({len(entries)} entries intact)"


hash_chain = HashChain()
