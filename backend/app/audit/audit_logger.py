from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.audit.hash_chain import hash_chain
from app.database import crud
from app.database.crud import AuditLogDB


class AuditLogger:
    """
    Service responsible for recording cryptographically chained audit logs
    and verifying whole-chain tamper evidence.
    """

    def record_event(
        self,
        db: Session,
        event_type: str,
        session_id: str,
        data: Dict[str, Any]
    ) -> AuditLogDB:
        """
        Record a new tamper-evident audit log entry linked to the previous entry hash.
        """
        # 1. Fetch previous entry to get parent hash
        last_entry = crud.get_last_audit_entry(db)
        previous_hash = last_entry.entry_hash if last_entry else hash_chain.GENESIS_HASH

        # 2. Compute timestamp and hash
        now = datetime.now(timezone.utc)
        ts_str = now.isoformat()
        entry_hash = hash_chain.calculate_entry_hash(
            previous_hash=previous_hash,
            timestamp_str=ts_str,
            event_type=event_type,
            data=data
        )

        # 3. Store record in database
        entry = crud.record_audit_entry(
            db=db,
            event_type=event_type,
            session_id=session_id,
            previous_hash=previous_hash,
            entry_hash=entry_hash,
            data=data
        )
        return entry

    def verify_chain_integrity(self, db: Session) -> Dict[str, Any]:
        """
        Validate the complete sequence of audit entries from genesis to present.
        """
        entries = crud.get_audit_trail(db, limit=10000)
        is_valid, broken_idx, reason = hash_chain.verify_chain(entries)

        return {
            "is_valid": is_valid,
            "total_records": len(entries),
            "broken_index": broken_idx,
            "verification_message": reason,
            "genesis_seed": hash_chain.GENESIS_HASH[:16] + "...",
            "last_hash": entries[-1].entry_hash if entries else hash_chain.GENESIS_HASH
        }


audit_logger = AuditLogger()
