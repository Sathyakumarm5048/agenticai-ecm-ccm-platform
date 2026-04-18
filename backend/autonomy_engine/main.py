"""
Autonomy Engine Service - FastAPI service for self-healing and autonomous remediation.
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import os
import asyncio

from autonomy_engine.core import AutonomyEngine, LoopPhase
from autonomy_engine.scenarios.scenarios import (
    SLAViolationScenario,
    ConnectorHealthScenario,
    WorkflowBottleneckScenario,
    ConfigurationDriftScenario
)
from autonomy_engine.sla_manager import (
    SLAManager,
    create_invoice_processing_sla,
    create_document_classification_sla,
    create_connector_integration_sla
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Autonomy Engine",
    description="Self-healing and autonomous remediation system",
    version="1.0.0"
)

# Initialize autonomy engine
autonomy_engine = AutonomyEngine(
    name="autonomy-engine",
    orchestrator_url=os.getenv("ORCHESTRATOR_URL", "http://localhost:8000"),
    kg_url=os.getenv("KG_API_URL", "http://localhost:8080/api/graph")
)

# Initialize SLA manager
sla_manager = SLAManager()


class HealingLoopRequest(BaseModel):
    """Request to start a healing loop."""
    scenario_type: str  # e.g., "sla_violation", "connector_health"


class SLAViolationReportRequest(BaseModel):
    """Request to get SLA violation report."""
    sla_id: Optional[str] = None
    limit: int = 10


class MetricUpdateRequest(BaseModel):
    """Request to update a metric for SLA evaluation."""
    sla_id: str
    metric_name: str
    current_value: float
    unit: str


@app.on_event("startup")
async def startup_event():
    """Initialize autonomy engine on startup."""
    logger.info("Autonomy Engine service started")

    # Register scenario handlers
    autonomy_engine.register_detection_handler("sla_violation", SLAViolationScenario.detect)
    autonomy_engine.register_diagnosis_handler("sla_violation", SLAViolationScenario.diagnose)
    autonomy_engine.register_planning_handler("sla_violation", SLAViolationScenario.plan)
    autonomy_engine.register_action_handler("optimize_workflow", SLAViolationScenario.execute_action)
    autonomy_engine.register_action_handler("tune_config", SLAViolationScenario.execute_action)
    autonomy_engine.register_action_handler("scale_resources", SLAViolationScenario.execute_action)

    autonomy_engine.register_detection_handler("connector_health", ConnectorHealthScenario.detect)
    autonomy_engine.register_diagnosis_handler("connector_health", ConnectorHealthScenario.diagnose)
    autonomy_engine.register_planning_handler("connector_health", ConnectorHealthScenario.plan)
    autonomy_engine.register_action_handler("refresh_connector_credentials", ConnectorHealthScenario.execute_action)
    autonomy_engine.register_action_handler("restart_connector", ConnectorHealthScenario.execute_action)
    autonomy_engine.register_action_handler("scale_connector", ConnectorHealthScenario.execute_action)

    autonomy_engine.register_detection_handler("workflow_bottleneck", WorkflowBottleneckScenario.detect)
    autonomy_engine.register_diagnosis_handler("workflow_bottleneck", WorkflowBottleneckScenario.diagnose)
    autonomy_engine.register_planning_handler("workflow_bottleneck", WorkflowBottleneckScenario.plan)
    autonomy_engine.register_action_handler("enable_parallel_processing", WorkflowBottleneckScenario.execute_action)
    autonomy_engine.register_action_handler("add_timeout_policy", WorkflowBottleneckScenario.execute_action)

    autonomy_engine.register_detection_handler("configuration_drift", ConfigurationDriftScenario.detect)
    autonomy_engine.register_diagnosis_handler("configuration_drift", ConfigurationDriftScenario.diagnose)
    autonomy_engine.register_planning_handler("configuration_drift", ConfigurationDriftScenario.plan)
    autonomy_engine.register_action_handler("restore_configuration_baseline", ConfigurationDriftScenario.execute_action)

    # Register SLAs
    sla_manager.register_sla(create_invoice_processing_sla())
    sla_manager.register_sla(create_document_classification_sla())
    sla_manager.register_sla(create_connector_integration_sla())

    logger.info("All scenario handlers and SLAs registered")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "autonomy-engine"}


@app.post("/healing-loop")
async def start_healing_loop(request: HealingLoopRequest, background_tasks: BackgroundTasks):
    """
    Start a self-healing loop for a scenario.
    
    The loop executes: Detection → Diagnosis → Plan → Act → Learn
    """
    try:
        logger.info(f"Starting healing loop for scenario: {request.scenario_type}")

        # Run healing loop in background
        loop = await autonomy_engine.execute_healing_loop(request.scenario_type)

        return {
            "loop_id": loop.loop_id,
            "incident_id": loop.incident_id,
            "status": "initiated",
            "phase": loop.phase.value,
            "message": f"Healing loop started for {request.scenario_type}"
        }

    except Exception as e:
        logger.error(f"Failed to start healing loop: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/healing-loop/{loop_id}")
async def get_healing_loop_status(loop_id: str):
    """Get status of a healing loop."""
    status = autonomy_engine.get_loop_status(loop_id)

    if not status:
        raise HTTPException(status_code=404, detail="Healing loop not found")

    return status


@app.get("/incidents")
async def list_incidents(scenario_type: Optional[str] = None):
    """Get incident history."""
    incidents = autonomy_engine.get_incident_history(scenario_type)
    return {
        "total": len(incidents),
        "incidents": incidents
    }


@app.post("/metrics/update")
async def update_metric(request: MetricUpdateRequest):
    """
    Update a metric and check against SLA targets.
    
    If SLA is violated, a violation is recorded.
    """
    try:
        from autonomy_engine.sla_manager import SLAMetric, SLAStatus

        # Find the SLA target to determine compliance
        sla = sla_manager.slas.get(request.sla_id)
        if not sla:
            raise HTTPException(status_code=404, detail="SLA not found")

        target = next((t for t in sla.targets if t.metric_name == request.metric_name), None)
        if not target:
            raise HTTPException(status_code=404, detail="Metric target not found")

        # Calculate compliance percentage
        if request.current_value <= target.threshold:
            compliance_pct = 100.0
            status = SLAStatus.HEALTHY
        else:
            exceeded_pct = ((request.current_value - target.threshold) / target.threshold) * 100
            compliance_pct = max(0, 100.0 - exceeded_pct)
            status = SLAStatus.VIOLATION

        metric = SLAMetric(
            metric_name=request.metric_name,
            current_value=request.current_value,
            target_value=target.threshold,
            unit=request.unit,
            measurement_window=target.measurement_window,
            compliance_percentage=compliance_pct,
            status=status
        )

        violation = sla_manager.update_metric(request.sla_id, metric)

        result = {
            "metric_name": request.metric_name,
            "current_value": request.current_value,
            "target_value": target.threshold,
            "compliance": compliance_pct,
            "status": status.value,
            "violation_detected": violation is not None
        }

        if violation:
            result["violation"] = {
                "violation_id": violation.violation_id,
                "severity": violation.violation_severity,
                "exceeded_by": f"{violation.exceeded_by_percentage:.1f}%"
            }

        return result

    except Exception as e:
        logger.error(f"Metric update failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sla/{sla_id}/status")
async def get_sla_status(sla_id: str):
    """Get current SLA compliance status."""
    status = sla_manager.get_sla_status(sla_id)

    if "error" in status:
        raise HTTPException(status_code=404, detail=status["error"])

    return status


@app.get("/sla/violations")
async def get_sla_violations(sla_id: Optional[str] = None, limit: int = 10):
    """Get recent SLA violations."""
    violations = sla_manager.get_violation_history(sla_id, limit)
    return {
        "total": len(violations),
        "violations": violations
    }


@app.get("/slas")
async def list_slas():
    """List all registered SLAs."""
    slas = list(sla_manager.slas.values())
    return {
        "total": len(slas),
        "slas": [
            {
                "sla_id": sla.sla_id,
                "name": sla.name,
                "service_name": sla.service_name,
                "targets": len(sla.targets),
                "active": sla.active
            }
            for sla in slas
        ]
    }


@app.get("/reports")
async def get_sla_reports(limit: int = 5):
    """Get recent SLA reports."""
    reports = sla_manager.reports[-limit:]
    return {
        "total": len(reports),
        "reports": [
            {
                "report_id": r.report_id,
                "period_start": r.period_start,
                "period_end": r.period_end,
                "overall_compliance": f"{r.overall_compliance * 100:.1f}%",
                "violations": len(r.violations),
                "escalations": len(r.escalations),
                "generated_at": r.generated_at
            }
            for r in reports
        ]
    }


@app.get("/scenarios")
async def list_scenarios():
    """List available healing scenarios."""
    return {
        "scenarios": [
            {
                "type": "sla_violation",
                "description": "Detects and remediates SLA violations in workflow processing"
            },
            {
                "type": "connector_health",
                "description": "Detects and remediates connector health degradation"
            },
            {
                "type": "workflow_bottleneck",
                "description": "Detects and optimizes workflow processing bottlenecks"
            },
            {
                "type": "configuration_drift",
                "description": "Detects and remediates configuration drift from baseline"
            }
        ]
    }


@app.post("/simulate-healing-loop")
async def simulate_healing_loop(request: HealingLoopRequest):
    """
    Simulate a healing loop without executing actions.
    Useful for testing and demo purposes.
    """
    try:
        logger.info(f"Simulating healing loop for scenario: {request.scenario_type}")

        # Run detection only
        loop = await autonomy_engine.detect_issues(request.scenario_type)

        if not loop:
            return {
                "status": "no_issues",
                "message": f"No issues detected for scenario: {request.scenario_type}"
            }

        return {
            "status": "issue_detected",
            "incident": {
                "incident_id": loop.incident_id,
                "title": loop.title,
                "description": loop.description,
                "severity": loop.severity.value,
                "affected_systems": loop.affected_systems,
                "metrics": [
                    {
                        "name": m.name,
                        "value": m.value,
                        "threshold": m.threshold,
                        "unit": m.unit,
                        "is_anomaly": m.is_anomaly
                    }
                    for m in loop.metrics
                ]
            }
        }

    except Exception as e:
        logger.error(f"Simulation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8006))
    uvicorn.run(app, host="0.0.0.0", port=port)
