"""
Autonomy Engine Core - Self-healing and autonomous remediation system.

The engine implements the Detection → Diagnosis → Plan → Act → Learn loop:
1. Detection: Monitor systems and detect anomalies/issues
2. Diagnosis: Root cause analysis using agents
3. Plan: Generate remediation plans
4. Act: Execute actions with approvals and guardrails
5. Learn: Track outcomes and improve recommendations
"""
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime, timedelta
import logging
import uuid

logger = logging.getLogger(__name__)


class LoopPhase(Enum):
    """Phases in the self-healing loop."""
    DETECTION = "detection"
    DIAGNOSIS = "diagnosis"
    PLANNING = "planning"
    ACTING = "acting"
    LEARNING = "learning"
    COMPLETED = "completed"
    FAILED = "failed"


class IncidentSeverity(Enum):
    """Severity levels for incidents."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class Metric:
    """Represents a monitored metric."""
    name: str
    value: float
    timestamp: str
    unit: str
    threshold: Optional[float] = None
    is_anomaly: bool = False


@dataclass
class Incident:
    """Represents an issue detected by the autonomy engine."""
    incident_id: str
    title: str
    description: str
    severity: IncidentSeverity
    detected_at: str
    scenario_type: str  # e.g., "sla_violation", "connector_health", etc.
    affected_systems: List[str] = field(default_factory=list)
    metrics: List[Metric] = field(default_factory=list)
    root_cause: Optional[str] = None
    is_resolved: bool = False


@dataclass
class RemediationPlan:
    """Represents a proposed remediation plan."""
    plan_id: str
    incident_id: str
    title: str
    estimated_impact: str  # "high", "medium", "low"
    confidence: float  # 0.0 to 1.0
    actions: List[Dict[str, Any]] = field(default_factory=list)
    requires_approval: bool = False
    compliance_checked: bool = False
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class ExecutionResult:
    """Result of executing a remediation action."""
    action_id: str
    plan_id: str
    action_type: str
    status: str  # "success", "failed", "pending"
    message: str
    start_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    end_time: Optional[str] = None
    metrics_before: Optional[Dict] = None
    metrics_after: Optional[Dict] = None


@dataclass
class HealingLoop:
    """Represents a complete self-healing loop execution."""
    loop_id: str
    incident_id: str
    phase: LoopPhase
    current_step: str
    start_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    end_time: Optional[str] = None
    
    detection_results: Optional[Dict] = None
    diagnosis_results: Optional[Dict] = None
    remediation_plan: Optional[RemediationPlan] = None
    execution_results: List[ExecutionResult] = field(default_factory=list)
    learning_outcomes: Optional[Dict] = None
    
    is_successful: bool = False
    error_message: Optional[str] = None


class AutonomyEngine:
    """
    Self-healing autonomy engine that detects issues and autonomously remediates them.
    
    Implements: Detection → Diagnosis → Plan → Act → Learn
    """

    def __init__(
        self,
        name: str = "autonomy-engine",
        orchestrator_url: str = "http://localhost:8000",
        kg_url: str = "http://localhost:8080/api/graph"
    ):
        self.name = name
        self.orchestrator_url = orchestrator_url
        self.kg_url = kg_url
        
        self.active_loops: Dict[str, HealingLoop] = {}
        self.completed_loops: List[HealingLoop] = []
        self.incident_history: List[Incident] = []
        
        # Detection handlers by scenario type
        self.detection_handlers: Dict[str, Callable] = {}
        # Diagnosis handlers by scenario type
        self.diagnosis_handlers: Dict[str, Callable] = {}
        # Planning handlers by scenario type
        self.planning_handlers: Dict[str, Callable] = {}
        # Action handlers by action type
        self.action_handlers: Dict[str, Callable] = {}

    def register_detection_handler(self, scenario_type: str, handler: Callable) -> None:
        """Register a detection handler for a scenario."""
        self.detection_handlers[scenario_type] = handler
        logger.info(f"Registered detection handler for {scenario_type}")

    def register_diagnosis_handler(self, scenario_type: str, handler: Callable) -> None:
        """Register a diagnosis handler for a scenario."""
        self.diagnosis_handlers[scenario_type] = handler
        logger.info(f"Registered diagnosis handler for {scenario_type}")

    def register_planning_handler(self, scenario_type: str, handler: Callable) -> None:
        """Register a planning handler for a scenario."""
        self.planning_handlers[scenario_type] = handler
        logger.info(f"Registered planning handler for {scenario_type}")

    def register_action_handler(self, action_type: str, handler: Callable) -> None:
        """Register an action execution handler."""
        self.action_handlers[action_type] = handler
        logger.info(f"Registered action handler for {action_type}")

    async def detect_issues(self, scenario_type: str) -> Optional[Incident]:
        """
        PHASE 1: Detection - Monitor systems and detect anomalies.
        """
        logger.info(f"Starting detection for scenario: {scenario_type}")

        if scenario_type not in self.detection_handlers:
            logger.warning(f"No detection handler for {scenario_type}")
            return None

        try:
            detection_result = await self.detection_handlers[scenario_type]()
            
            if detection_result:
                incident = Incident(
                    incident_id=str(uuid.uuid4()),
                    title=detection_result.get("title", f"Issue in {scenario_type}"),
                    description=detection_result.get("description", ""),
                    severity=IncidentSeverity(detection_result.get("severity", "medium")),
                    detected_at=datetime.utcnow().isoformat(),
                    scenario_type=scenario_type,
                    affected_systems=detection_result.get("affected_systems", []),
                    metrics=detection_result.get("metrics", [])
                )
                
                self.incident_history.append(incident)
                logger.info(f"Incident detected: {incident.incident_id}")
                return incident
            
            return None
        except Exception as e:
            logger.error(f"Detection failed for {scenario_type}: {str(e)}")
            return None

    async def diagnose_incident(self, incident: Incident, loop: HealingLoop) -> Dict[str, Any]:
        """
        PHASE 2: Diagnosis - Root cause analysis using agents.
        """
        logger.info(f"Starting diagnosis for incident: {incident.incident_id}")

        if incident.scenario_type not in self.diagnosis_handlers:
            logger.warning(f"No diagnosis handler for {incident.scenario_type}")
            return {"error": "No diagnosis handler available"}

        try:
            diagnosis_result = await self.diagnosis_handlers[incident.scenario_type](incident)
            
            loop.diagnosis_results = diagnosis_result
            incident.root_cause = diagnosis_result.get("root_cause", "Unknown")
            
            logger.info(f"Diagnosis complete: {diagnosis_result.get('summary', '')}")
            return diagnosis_result
        except Exception as e:
            logger.error(f"Diagnosis failed: {str(e)}")
            return {"error": str(e)}

    async def plan_remediation(self, incident: Incident, diagnosis: Dict, loop: HealingLoop) -> Optional[RemediationPlan]:
        """
        PHASE 3: Planning - Generate remediation plans.
        """
        logger.info(f"Starting planning for incident: {incident.incident_id}")

        if incident.scenario_type not in self.planning_handlers:
            logger.warning(f"No planning handler for {incident.scenario_type}")
            return None

        try:
            planning_result = await self.planning_handlers[incident.scenario_type](incident, diagnosis)
            
            plan = RemediationPlan(
                plan_id=str(uuid.uuid4()),
                incident_id=incident.incident_id,
                title=planning_result.get("title", f"Remediation for {incident.title}"),
                actions=planning_result.get("actions", []),
                estimated_impact=planning_result.get("estimated_impact", "medium"),
                confidence=planning_result.get("confidence", 0.7),
                requires_approval=planning_result.get("requires_approval", False),
                compliance_checked=planning_result.get("compliance_checked", False)
            )
            
            loop.remediation_plan = plan
            logger.info(f"Remediation plan created: {plan.plan_id}")
            return plan
        except Exception as e:
            logger.error(f"Planning failed: {str(e)}")
            return None

    async def execute_remediation(self, plan: RemediationPlan, loop: HealingLoop) -> bool:
        """
        PHASE 4: Acting - Execute remediation actions with approvals and guardrails.
        """
        logger.info(f"Starting execution of plan: {plan.plan_id}")

        if plan.requires_approval:
            logger.warning(f"Plan {plan.plan_id} requires approval - waiting for human sign-off")
            # In production, would integrate with approval workflow
            return False

        try:
            for action in plan.actions:
                action_type = action.get("type")
                
                if action_type not in self.action_handlers:
                    logger.warning(f"No handler for action type: {action_type}")
                    continue

                logger.info(f"Executing action: {action_type}")
                
                try:
                    action_result = await self.action_handlers[action_type](action)
                    
                    execution = ExecutionResult(
                        action_id=str(uuid.uuid4()),
                        plan_id=plan.plan_id,
                        action_type=action_type,
                        status=action_result.get("status", "success"),
                        message=action_result.get("message", ""),
                        metrics_before=action_result.get("metrics_before"),
                        metrics_after=action_result.get("metrics_after")
                    )
                    
                    loop.execution_results.append(execution)
                    logger.info(f"Action {action_type} execution complete")
                    
                except Exception as e:
                    logger.error(f"Action {action_type} execution failed: {str(e)}")
                    execution = ExecutionResult(
                        action_id=str(uuid.uuid4()),
                        plan_id=plan.plan_id,
                        action_type=action_type,
                        status="failed",
                        message=str(e)
                    )
                    loop.execution_results.append(execution)

            return True
        except Exception as e:
            logger.error(f"Remediation execution failed: {str(e)}")
            return False

    async def learn_from_outcome(self, loop: HealingLoop, incident: Incident) -> Dict[str, Any]:
        """
        PHASE 5: Learning - Track outcomes and improve recommendations.
        """
        logger.info(f"Starting learning phase for loop: {loop.loop_id}")

        try:
            # Analyze execution results
            successful_actions = sum(1 for r in loop.execution_results if r.status == "success")
            total_actions = len(loop.execution_results)
            success_rate = successful_actions / total_actions if total_actions > 0 else 0

            # Check if incident is resolved
            incident_resolved = await self._check_incident_resolution(incident)
            incident.is_resolved = incident_resolved

            learning_outcomes = {
                "loop_id": loop.loop_id,
                "incident_id": incident.incident_id,
                "scenario_type": incident.scenario_type,
                "success_rate": success_rate,
                "incident_resolved": incident_resolved,
                "execution_results": len(loop.execution_results),
                "lessons": self._extract_lessons(loop, incident_resolved)
            }

            loop.learning_outcomes = learning_outcomes
            loop.is_successful = incident_resolved and success_rate > 0.7

            # Store learning data for future improvements
            await self._store_learning_data(learning_outcomes)

            logger.info(f"Learning phase complete: {success_rate * 100:.1f}% success, resolved={incident_resolved}")
            return learning_outcomes

        except Exception as e:
            logger.error(f"Learning phase failed: {str(e)}")
            return {"error": str(e)}

    async def execute_healing_loop(self, scenario_type: str) -> HealingLoop:
        """
        Execute the complete self-healing loop: Detection → Diagnosis → Plan → Act → Learn
        """
        loop = HealingLoop(
            loop_id=str(uuid.uuid4()),
            incident_id="",
            phase=LoopPhase.DETECTION,
            current_step="Initializing detection"
        )

        try:
            # PHASE 1: Detection
            logger.info(f"[LOOP {loop.loop_id}] Starting healing loop for {scenario_type}")
            incident = await self.detect_issues(scenario_type)

            if not incident:
                logger.info(f"[LOOP {loop.loop_id}] No issues detected")
                loop.phase = LoopPhase.COMPLETED
                loop.current_step = "No issues detected"
                return loop

            loop.incident_id = incident.incident_id
            loop.phase = LoopPhase.DIAGNOSIS
            loop.current_step = "Diagnosing root cause"

            # PHASE 2: Diagnosis
            diagnosis = await self.diagnose_incident(incident, loop)

            if "error" in diagnosis:
                raise Exception(f"Diagnosis failed: {diagnosis['error']}")

            loop.phase = LoopPhase.PLANNING
            loop.current_step = "Creating remediation plan"

            # PHASE 3: Planning
            plan = await self.plan_remediation(incident, diagnosis, loop)

            if not plan:
                raise Exception("Failed to create remediation plan")

            loop.phase = LoopPhase.ACTING
            loop.current_step = "Executing remediation"

            # PHASE 4: Acting
            execution_success = await self.execute_remediation(plan, loop)

            loop.phase = LoopPhase.LEARNING
            loop.current_step = "Learning from outcome"

            # PHASE 5: Learning
            learning_outcomes = await self.learn_from_outcome(loop, incident)

            loop.phase = LoopPhase.COMPLETED
            loop.end_time = datetime.utcnow().isoformat()

            self.completed_loops.append(loop)
            logger.info(f"[LOOP {loop.loop_id}] Healing loop completed successfully")

            return loop

        except Exception as e:
            logger.error(f"[LOOP {loop.loop_id}] Healing loop failed: {str(e)}")
            loop.phase = LoopPhase.FAILED
            loop.error_message = str(e)
            loop.end_time = datetime.utcnow().isoformat()
            self.completed_loops.append(loop)
            return loop

    async def _check_incident_resolution(self, incident: Incident) -> bool:
        """Check if an incident has been resolved."""
        # In production, would query metrics to verify resolution
        # For now, check if metrics have improved
        if not incident.metrics:
            return False

        improved_metrics = sum(
            1 for m in incident.metrics
            if m.threshold and abs(m.value - m.threshold) < abs(m.value * 0.1)
        )

        return improved_metrics > 0

    def _extract_lessons(self, loop: HealingLoop, resolved: bool) -> List[str]:
        """Extract lessons from a healing loop execution."""
        lessons = []

        if resolved:
            lessons.append("Issue was successfully resolved through automation")
        else:
            lessons.append("Issue required manual intervention")

        if loop.remediation_plan and loop.remediation_plan.confidence > 0.8:
            lessons.append(f"High confidence in remediation strategy ({loop.remediation_plan.confidence * 100:.0f}%)")
        elif loop.remediation_plan:
            lessons.append(f"Medium confidence in remediation - consider manual review ({loop.remediation_plan.confidence * 100:.0f}%)")

        success_rate = len([r for r in loop.execution_results if r.status == "success"]) / len(loop.execution_results) if loop.execution_results else 0
        if success_rate == 1.0:
            lessons.append("All remediation actions executed successfully")
        elif success_rate > 0.5:
            lessons.append(f"Partial success: {success_rate * 100:.0f}% of actions succeeded")

        return lessons

    async def _store_learning_data(self, learning_outcomes: Dict) -> None:
        """Store learning outcomes for future improvements."""
        logger.info(f"Storing learning data: scenario={learning_outcomes['scenario_type']}, success={learning_outcomes['incident_resolved']}")
        # In production, would store in knowledge graph or database
        # This enables continuous improvement of remediation strategies

    def get_loop_status(self, loop_id: str) -> Optional[Dict]:
        """Get status of a healing loop."""
        loop = next((l for l in self.active_loops.values() if l.loop_id == loop_id), None)
        if not loop:
            loop = next((l for l in self.completed_loops if l.loop_id == loop_id), None)

        if loop:
            return {
                "loop_id": loop.loop_id,
                "incident_id": loop.incident_id,
                "phase": loop.phase.value,
                "current_step": loop.current_step,
                "is_successful": loop.is_successful,
                "start_time": loop.start_time,
                "end_time": loop.end_time,
                "error_message": loop.error_message
            }
        return None

    def get_incident_history(self, scenario_type: Optional[str] = None) -> List[Dict]:
        """Get incident history."""
        incidents = self.incident_history

        if scenario_type:
            incidents = [i for i in incidents if i.scenario_type == scenario_type]

        return [
            {
                "incident_id": i.incident_id,
                "title": i.title,
                "severity": i.severity.value,
                "detected_at": i.detected_at,
                "scenario_type": i.scenario_type,
                "is_resolved": i.is_resolved,
                "root_cause": i.root_cause
            }
            for i in incidents
        ]
