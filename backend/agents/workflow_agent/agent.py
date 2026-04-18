"""
Workflow Agent - designs, analyzes, and optimizes workflows.
"""
from typing import Dict, List, Any, Optional
import logging

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import APIClient, KnowledgeGraphClient, AuditLogger

logger = logging.getLogger(__name__)


class WorkflowAgent(BaseAgent):
    """Designs, analyzes, and optimizes workflows."""

    def __init__(
        self,
        agent_name: str = "workflow-agent",
        workflow_api_url: str = "http://localhost:8001",
        kg_url: str = "http://localhost:8080/api/graph",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define workflow agent guardrails
        guardrails = [
            Guardrail(
                name="workflow_scope",
                scope=ActionScope.READ_WRITE,
                allowed_systems=["workflow"],
                allowed_actions=["read", "create", "update", "simulate"],
                requires_compliance_check=True
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="workflow",
            guardrails=guardrails
        )

        self.workflow_api = APIClient(workflow_api_url)
        self.kg_client = KnowledgeGraphClient(kg_url)
        self.audit_logger = AuditLogger(audit_url)

        # Register tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        self.register_tool(Tool(
            name="get_workflow_definitions",
            description="Retrieve all workflow definitions",
            func=self._tool_get_workflow_definitions,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="get_workflow_instances",
            description="Retrieve workflow instances with filters",
            func=self._tool_get_workflow_instances,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="update_workflow_definition",
            description="Update a workflow definition",
            func=self._tool_update_workflow_definition,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="simulate_workflow",
            description="Simulate a workflow with sample input",
            func=self._tool_simulate_workflow,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="analyze_bottlenecks",
            description="Analyze workflow for performance bottlenecks",
            func=self._tool_analyze_bottlenecks,
            guardrails=[]
        ))

    def _tool_get_workflow_definitions(self) -> List[Dict]:
        """Get all workflow definitions."""
        try:
            result = self.workflow_api.get("/workflows/definitions")
            logger.info("Retrieved workflow definitions")
            return result.get("definitions", [])
        except Exception as e:
            logger.error(f"Failed to get workflow definitions: {str(e)}")
            return []

    def _tool_get_workflow_instances(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get workflow instances."""
        try:
            result = self.workflow_api.get("/workflows/instances", params=filters)
            logger.info(f"Retrieved workflow instances with filters: {filters}")
            return result.get("instances", [])
        except Exception as e:
            logger.error(f"Failed to get workflow instances: {str(e)}")
            return []

    def _tool_update_workflow_definition(self, definition: Dict) -> Dict:
        """Update a workflow definition."""
        allowed, reason = self.can_execute_action("update", "workflow")
        if not allowed:
            return {"success": False, "error": reason}

        try:
            result = self.workflow_api.put("/workflows/definitions", definition)
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="workflow_updated",
                target=definition.get("workflowId", "unknown"),
                status="success"
            )
            logger.info(f"Updated workflow definition: {definition.get('workflowId')}")
            return result
        except Exception as e:
            logger.error(f"Failed to update workflow definition: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_simulate_workflow(self, definition: Dict, sample_input: Dict) -> Dict:
        """Simulate a workflow execution."""
        try:
            result = self.workflow_api.post(
                "/workflows/simulate",
                {"definition": definition, "input": sample_input}
            )
            logger.info("Workflow simulation completed")
            return result
        except Exception as e:
            logger.error(f"Workflow simulation failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_analyze_bottlenecks(self, workflow_id: str) -> Dict:
        """Analyze workflow for bottlenecks."""
        try:
            instances = self._tool_get_workflow_instances({"workflowId": workflow_id})
            
            if not instances:
                return {"bottlenecks": [], "message": "No instances found"}

            # Calculate average step durations
            step_durations = {}
            for instance in instances:
                for step in instance.get("steps", []):
                    step_name = step.get("name")
                    duration = step.get("duration", 0)
                    if step_name not in step_durations:
                        step_durations[step_name] = []
                    step_durations[step_name].append(duration)

            # Find bottlenecks (steps with high avg duration)
            bottlenecks = []
            for step_name, durations in step_durations.items():
                avg_duration = sum(durations) / len(durations)
                if avg_duration > 5000:  # > 5 seconds
                    bottlenecks.append({
                        "step": step_name,
                        "avg_duration_ms": avg_duration,
                        "samples": len(durations)
                    })

            return {
                "workflow_id": workflow_id,
                "bottlenecks": sorted(bottlenecks, key=lambda x: x["avg_duration_ms"], reverse=True)
            }
        except Exception as e:
            logger.error(f"Bottleneck analysis failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_system_prompt(self) -> str:
        """Return system prompt for workflow agent."""
        return """You are the Workflow Agent. Your responsibilities:
1. Analyze and optimize workflow definitions
2. Identify and resolve bottlenecks and failures
3. Suggest improvements like parallelization and retries
4. Simulate workflows before deployment
5. Generate canonical WorkflowDefinition models

Available tools:
- get_workflow_definitions: Get all workflow definitions
- get_workflow_instances: Get workflow execution instances
- update_workflow_definition: Update a workflow
- simulate_workflow: Test a workflow with sample data
- analyze_bottlenecks: Find performance issues

Always:
- Respect compliance guardrails
- Log all actions
- Consult the knowledge graph for context
- Do not modify integrations or connectors"""

    def analyze_workflows(self, goal: str) -> Dict[str, Any]:
        """Analyze workflows to meet a goal."""
        logger.info(f"Analyzing workflows for: {goal}")

        try:
            definitions = self._tool_get_workflow_definitions()
            bottlenecks_by_workflow = {}

            for wf_def in definitions:
                bottlenecks = self._tool_analyze_bottlenecks(wf_def.get("workflowId"))
                bottlenecks_by_workflow[wf_def.get("workflowId")] = bottlenecks

            result = {
                "goal": goal,
                "workflows_analyzed": len(definitions),
                "bottlenecks": bottlenecks_by_workflow,
                "recommendations": self._generate_recommendations(bottlenecks_by_workflow)
            }

            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="workflows_analyzed",
                target="all",
                status="success",
                details={"workflows": len(definitions)}
            )

            return result
        except Exception as e:
            logger.error(f"Workflow analysis failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _generate_recommendations(self, bottlenecks: Dict) -> List[str]:
        """Generate recommendations based on bottleneck analysis."""
        recommendations = []
        for workflow_id, analysis in bottlenecks.items():
            if analysis.get("bottlenecks"):
                recommendations.append(
                    f"Workflow {workflow_id}: Consider optimizing {len(analysis['bottlenecks'])} bottleneck(s)"
                )
        return recommendations

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Workflow Agent thinking about: {goal}")
        return f"Analyzing workflows to: {goal}"

    def act(self, plan: str) -> Dict[str, Any]:
        """Execute a plan."""
        return self.analyze_workflows(plan)
