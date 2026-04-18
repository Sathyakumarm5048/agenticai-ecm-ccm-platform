"""
SLA Management System - Tracks and enforces service level agreements.
"""
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class SLAStatus(Enum):
    """SLA compliance status."""
    HEALTHY = "healthy"
    WARNING = "warning"
    VIOLATION = "violation"


@dataclass
class SLATarget:
    """Defines a single SLA target."""
    metric_name: str  # e.g., "workflow.p99_latency"
    threshold: float  # Max acceptable value
    unit: str  # e.g., "milliseconds", "percent"
    measurement_window: str  # e.g., "1h", "24h", "7d"
    penalty_percentage: float = 0.0  # Service credit percentage
    escalation_threshold: float = 0.8  # Trigger escalation at 80% of threshold


@dataclass
class SLA:
    """Represents a service level agreement."""
    sla_id: str
    name: str
    service_name: str  # e.g., "invoice-processing", "document-classification"
    targets: List[SLATarget] = field(default_factory=list)
    reporting_period: str = "monthly"  # "daily", "weekly", "monthly"
    active: bool = True
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class SLAMetric:
    """Current metric value against an SLA target."""
    metric_name: str
    current_value: float
    target_value: float
    unit: str
    measurement_window: str
    compliance_percentage: float  # 100% = target met, 0% = target missed completely
    status: SLAStatus
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class SLAViolation:
    """Represents an SLA violation event."""
    violation_id: str
    sla_id: str
    metric_name: str
    violation_severity: str  # "warning", "critical"
    current_value: float
    target_value: float
    exceeded_by_percentage: float
    violation_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    auto_remediation_triggered: bool = False
    remediation_plan_id: Optional[str] = None


@dataclass
class SLAReport:
    """SLA compliance report."""
    report_id: str
    period_start: str
    period_end: str
    slas_evaluated: int
    metrics_healthy: int
    metrics_warning: int
    metrics_violation: int
    overall_compliance: float  # 0.0 to 1.0
    violations: List[SLAViolation] = field(default_factory=list)
    escalations: List[str] = field(default_factory=list)
    generated_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


class SLAManager:
    """Manages SLAs and monitors compliance."""

    def __init__(self):
        self.slas: Dict[str, SLA] = {}
        self.metrics: Dict[str, SLAMetric] = {}
        self.violations: List[SLAViolation] = []
        self.reports: List[SLAReport] = []

    def register_sla(self, sla: SLA) -> None:
        """Register a new SLA."""
        self.slas[sla.sla_id] = sla
        logger.info(f"Registered SLA: {sla.name}")

    def update_metric(self, sla_id: str, metric: SLAMetric) -> Optional[SLAViolation]:
        """
        Update a metric value and check against SLA targets.
        Returns a violation if threshold is exceeded.
        """
        sla = self.slas.get(sla_id)
        if not sla:
            logger.warning(f"SLA not found: {sla_id}")
            return None

        metric_key = f"{sla_id}:{metric.metric_name}"
        self.metrics[metric_key] = metric

        # Find corresponding SLA target
        target = next((t for t in sla.targets if t.metric_name == metric.metric_name), None)
        if not target:
            logger.warning(f"No target found for metric {metric.metric_name}")
            return None

        # Check for violation
        if metric.current_value > target.threshold:
            exceeded_by = ((metric.current_value - target.threshold) / target.threshold) * 100
            
            violation = SLAViolation(
                violation_id=f"viol_{datetime.utcnow().timestamp()}",
                sla_id=sla_id,
                metric_name=metric.metric_name,
                violation_severity="critical" if exceeded_by > 20 else "warning",
                current_value=metric.current_value,
                target_value=target.threshold,
                exceeded_by_percentage=exceeded_by
            )
            
            self.violations.append(violation)
            logger.warning(f"SLA violation detected: {metric.metric_name} = {metric.current_value} (target: {target.threshold})")
            return violation

        # Check for escalation threshold
        escalation_threshold_value = target.threshold * (1 - (1 - target.escalation_threshold))
        if metric.current_value > escalation_threshold_value:
            logger.warning(f"SLA warning for {metric.metric_name}: approaching threshold")

        return None

    def get_sla_status(self, sla_id: str) -> Dict[str, Any]:
        """Get current compliance status for an SLA."""
        sla = self.slas.get(sla_id)
        if not sla:
            return {"error": "SLA not found"}

        metrics = [
            self.metrics.get(f"{sla_id}:{target.metric_name}")
            for target in sla.targets
        ]
        metrics = [m for m in metrics if m is not None]

        violations = [v for v in self.violations if v.sla_id == sla_id]

        # Calculate overall compliance
        compliance_scores = [m.compliance_percentage for m in metrics]
        overall_compliance = sum(compliance_scores) / len(compliance_scores) if compliance_scores else 100.0

        status = "healthy" if overall_compliance >= 95 else "warning" if overall_compliance >= 80 else "violation"

        return {
            "sla_id": sla_id,
            "sla_name": sla.name,
            "service_name": sla.service_name,
            "overall_compliance": overall_compliance,
            "status": status,
            "metrics": [
                {
                    "name": m.metric_name,
                    "current_value": m.current_value,
                    "target_value": m.target_value,
                    "unit": m.unit,
                    "compliance": m.compliance_percentage,
                    "metric_status": m.status.value
                }
                for m in metrics
            ],
            "recent_violations": len([v for v in violations if v.auto_remediation_triggered is False])
        }

    def generate_sla_report(
        self,
        period_start: datetime,
        period_end: datetime,
        sla_ids: Optional[List[str]] = None
    ) -> SLAReport:
        """Generate an SLA compliance report."""
        logger.info(f"Generating SLA report for period {period_start} to {period_end}")

        slas_to_report = list(self.slas.values())
        if sla_ids:
            slas_to_report = [s for s in slas_to_report if s.sla_id in sla_ids]

        violations_in_period = [
            v for v in self.violations
            if period_start.isoformat() <= v.violation_time <= period_end.isoformat()
        ]

        metrics_healthy = 0
        metrics_warning = 0
        metrics_violation = 0

        for sla in slas_to_report:
            for target in sla.targets:
                metric_key = f"{sla.sla_id}:{target.metric_name}"
                metric = self.metrics.get(metric_key)

                if metric:
                    if metric.status == SLAStatus.HEALTHY:
                        metrics_healthy += 1
                    elif metric.status == SLAStatus.WARNING:
                        metrics_warning += 1
                    else:
                        metrics_violation += 1

        total_metrics = metrics_healthy + metrics_warning + metrics_violation
        overall_compliance = (
            (metrics_healthy + (metrics_warning * 0.5)) / total_metrics * 100
            if total_metrics > 0
            else 100.0
        )

        report = SLAReport(
            report_id=f"sla_report_{datetime.utcnow().timestamp()}",
            period_start=period_start.isoformat(),
            period_end=period_end.isoformat(),
            slas_evaluated=len(slas_to_report),
            metrics_healthy=metrics_healthy,
            metrics_warning=metrics_warning,
            metrics_violation=metrics_violation,
            overall_compliance=overall_compliance / 100.0,
            violations=violations_in_period,
            escalations=self._identify_escalations(violations_in_period)
        )

        self.reports.append(report)
        logger.info(f"SLA report generated: {report.report_id} - Overall compliance: {overall_compliance:.1f}%")

        return report

    def _identify_escalations(self, violations: List[SLAViolation]) -> List[str]:
        """Identify which violations require escalation."""
        escalations = []

        critical_violations = [v for v in violations if v.violation_severity == "critical"]
        if len(critical_violations) > 0:
            escalations.append(f"Critical violations: {len(critical_violations)}")

        recurrent_violations = {}
        for v in violations:
            recurrent_violations[v.metric_name] = recurrent_violations.get(v.metric_name, 0) + 1

        for metric, count in recurrent_violations.items():
            if count > 3:
                escalations.append(f"Recurrent violations in {metric}: {count} times")

        return escalations

    def get_violation_history(self, sla_id: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get recent SLA violations."""
        violations = self.violations

        if sla_id:
            violations = [v for v in violations if v.sla_id == sla_id]

        # Sort by most recent first
        violations = sorted(violations, key=lambda v: v.violation_time, reverse=True)[:limit]

        return [
            {
                "violation_id": v.violation_id,
                "sla_id": v.sla_id,
                "metric_name": v.metric_name,
                "severity": v.violation_severity,
                "exceeded_by": f"{v.exceeded_by_percentage:.1f}%",
                "violation_time": v.violation_time,
                "remediation_plan": v.remediation_plan_id
            }
            for v in violations
        ]


# Common SLA Definitions for ECM/CCM Systems

def create_invoice_processing_sla() -> SLA:
    """Create SLA for invoice processing workflow."""
    return SLA(
        sla_id="sla_invoice_processing",
        name="Invoice Processing SLA",
        service_name="invoice-processing",
        targets=[
            SLATarget(
                metric_name="workflow.p99_latency",
                threshold=60.0,
                unit="seconds",
                measurement_window="1h",
                penalty_percentage=5.0,
                escalation_threshold=0.8
            ),
            SLATarget(
                metric_name="workflow.throughput",
                threshold=50.0,
                unit="items/min",
                measurement_window="1h",
                penalty_percentage=3.0,
                escalation_threshold=0.85
            ),
            SLATarget(
                metric_name="workflow.error_rate",
                threshold=1.0,
                unit="percent",
                measurement_window="1h",
                penalty_percentage=2.0,
                escalation_threshold=0.75
            )
        ]
    )


def create_document_classification_sla() -> SLA:
    """Create SLA for document classification workflow."""
    return SLA(
        sla_id="sla_doc_classification",
        name="Document Classification SLA",
        service_name="document-classification",
        targets=[
            SLATarget(
                metric_name="workflow.accuracy",
                threshold=95.0,  # 95% accuracy
                unit="percent",
                measurement_window="24h",
                penalty_percentage=4.0,
                escalation_threshold=0.85
            ),
            SLATarget(
                metric_name="workflow.processing_time",
                threshold=5.0,
                unit="seconds",
                measurement_window="1h",
                penalty_percentage=3.0,
                escalation_threshold=0.8
            ),
            SLATarget(
                metric_name="connector.availability",
                threshold=99.5,
                unit="percent",
                measurement_window="24h",
                penalty_percentage=5.0,
                escalation_threshold=0.95
            )
        ]
    )


def create_connector_integration_sla() -> SLA:
    """Create SLA for connector integration availability."""
    return SLA(
        sla_id="sla_connector_integration",
        name="Connector Integration SLA",
        service_name="connectors",
        targets=[
            SLATarget(
                metric_name="connector.availability",
                threshold=99.9,
                unit="percent",
                measurement_window="24h",
                penalty_percentage=10.0,
                escalation_threshold=0.99
            ),
            SLATarget(
                metric_name="connector.error_rate",
                threshold=0.1,
                unit="percent",
                measurement_window="1h",
                penalty_percentage=5.0,
                escalation_threshold=0.7
            )
        ]
    )
