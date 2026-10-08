import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.attack_result import (
    AttackCase,
    AttackCaseResult,
    AttackSuiteSummary
)
from app.firewall.decision_engine import decision_engine
from app.redteam.metrics import metrics_calculator
from app.database import crud
from app.audit.audit_logger import audit_logger


class AttackRunner:
    """
    Automated Red-Teaming attack harness. Loads adversarial test datasets,
    fires them against the firewall, records evaluation metrics, and persists benchmark results.
    """

    def __init__(self):
        self.cases_dir = settings.ATTACK_CASES_DIR

    def load_attack_cases(self, category_filter: Optional[str] = None) -> List[AttackCase]:
        """Load attack cases from JSON files."""
        cases: List[AttackCase] = []
        if not self.cases_dir.exists():
            return cases

        for file in self.cases_dir.glob("*.json"):
            if category_filter and category_filter not in file.stem:
                continue
            try:
                with open(file, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    for item in items:
                        if not category_filter or item.get("category") == category_filter:
                            cases.append(AttackCase(**item))
            except Exception as e:
                print(f"Error reading attack case file {file}: {e}")

        return cases

    def run_case(self, case: AttackCase, policy_name: Optional[str] = None) -> AttackCaseResult:
        """Execute a single attack test case through the firewall."""
        session_id = f"redteam-{case.id.lower()}"
        start_time = time.perf_counter()

        # Step 1: Scan prompt
        inspection = decision_engine.inspect_prompt(
            prompt=case.payload,
            session_id=session_id,
            policy_name=policy_name
        )

        # Step 2: If case specified target_tool and prompt passed initial gate, also inspect tool call
        if case.target_tool and inspection.decision.value != "BLOCK":
            tool_args = {"path": case.payload} if case.target_tool == "file_tool" else {"code": case.payload, "to": "attacker@evil.com", "url": case.payload}
            tool_inspection = decision_engine.inspect_tool_call(
                tool_name=case.target_tool,
                tool_args=tool_args,
                session_id=session_id,
                policy_name=policy_name
            )
            if tool_inspection.decision.value == "BLOCK":
                inspection = tool_inspection

        duration_ms = (time.perf_counter() - start_time) * 1000.0

        decision_str = inspection.decision.value
        passed = (decision_str == case.expected_decision)

        return AttackCaseResult(
            case_id=case.id,
            name=case.name,
            category=case.category,
            passed=passed,
            firewall_decision=decision_str,
            severity=case.severity,
            confidence_score=inspection.confidence_score,
            detected_threat=inspection.threat_type,
            reason=inspection.reason,
            latency_ms=round(duration_ms, 2),
            details={
                "expected_decision": case.expected_decision,
                "rule_violations": inspection.rule_violations,
                "target_tool": case.target_tool
            }
        )

    def run_suite(
        self,
        db: Optional[Session] = None,
        suite_name: str = "Automated Red Team Suite",
        category_filter: Optional[str] = None,
        policy_name: Optional[str] = "default"
    ) -> AttackSuiteSummary:
        """Run full or filtered benchmark test suite."""
        run_id = f"run-{uuid.uuid4().hex[:8]}"
        cases = self.load_attack_cases(category_filter=category_filter)
        results: List[AttackCaseResult] = []

        for case in cases:
            res = self.run_case(case, policy_name=policy_name)
            results.append(res)

        summary_metrics = metrics_calculator.calculate_summary(results)

        summary = AttackSuiteSummary(
            run_id=run_id,
            timestamp=datetime.now(timezone.utc),
            suite_name=suite_name,
            policy_name=policy_name or "default",
            total_tests=summary_metrics["total_tests"],
            passed_tests=summary_metrics["passed_tests"],
            blocked_tests=summary_metrics["blocked_tests"],
            bypassed_tests=summary_metrics["bypassed_tests"],
            asr_score=summary_metrics["asr_score"],
            defense_rate=summary_metrics["defense_rate"],
            average_latency_ms=summary_metrics["average_latency_ms"],
            results=results
        )

        # Save to DB if session provided
        if db:
            crud.save_attack_run(db, summary)
            audit_logger.record_event(
                db=db,
                event_type="REDTEAM_BENCHMARK_COMPLETED",
                session_id=run_id,
                data={
                    "run_id": run_id,
                    "total_tests": summary.total_tests,
                    "asr_score": summary.asr_score,
                    "defense_rate": summary.defense_rate
                }
            )

        return summary


attack_runner = AttackRunner()
