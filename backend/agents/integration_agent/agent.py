"""
Integration Agent - manages connectors and integration health.
"""
from typing import Dict, List, Any, Optional
import logging

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import APIClient, AuditLogger

logger = logging.getLogger(__name__)


class IntegrationAgent(BaseAgent):
    """Manages connectors, integrations, and data flows."""

    def __init__(
        self,
        agent_name: str = "integration-agent",
        integration_api_url: str = "http://localhost:8002",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define integration agent guardrails
        guardrails = [
            Guardrail(
                name="integration_scope",
                scope=ActionScope.READ_WRITE,
                allowed_systems=["integration"],
                allowed_actions=["read", "update", "disable"],
                requires_compliance_check=True,
                requires_approval=True  # Disabling connector needs approval
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="integration",
            guardrails=guardrails
        )

        self.integration_api = APIClient(integration_api_url)
        self.audit_logger = AuditLogger(audit_url)

        # Register tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        self.register_tool(Tool(
            name="get_connectors",
            description="Get all connectors and their status",
            func=self._tool_get_connectors,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="get_integration_links",
            description="Get all integration links",
            func=self._tool_get_integration_links,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="get_recent_integration_events",
            description="Get recent events for a connector",
            func=self._tool_get_recent_integration_events,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="update_integration_link",
            description="Update an integration link configuration",
            func=self._tool_update_integration_link,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="disable_connector",
            description="Disable a connector (requires approval)",
            func=self._tool_disable_connector,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="check_connector_health",
            description="Check health status of a connector",
            func=self._tool_check_connector_health,
            guardrails=[]
        ))

    def _tool_get_connectors(self) -> List[Dict]:
        """Get all connectors."""
        try:
            result = self.integration_api.get("/connectors")
            logger.info("Retrieved connectors")
            return result.get("connectors", [])
        except Exception as e:
            logger.error(f"Failed to get connectors: {str(e)}")
            return []

    def _tool_get_integration_links(self) -> List[Dict]:
        """Get all integration links."""
        try:
            result = self.integration_api.get("/integration-links")
            logger.info("Retrieved integration links")
            return result.get("links", [])
        except Exception as e:
            logger.error(f"Failed to get integration links: {str(e)}")
            return []

    def _tool_get_recent_integration_events(self, connector_id: str) -> List[Dict]:
        """Get recent events for a connector."""
        try:
            result = self.integration_api.get(f"/connectors/{connector_id}/events")
            logger.info(f"Retrieved events for connector {connector_id}")
            return result.get("events", [])
        except Exception as e:
            logger.error(f"Failed to get events for connector {connector_id}: {str(e)}")
            return []

    def _tool_update_integration_link(self, link: Dict) -> Dict:
        """Update an integration link."""
        allowed, reason = self.can_execute_action("update", "integration")
        if not allowed:
            return {"success": False, "error": reason}

        try:
            result = self.integration_api.put("/integration-links", link)
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="integration_link_updated",
                target=link.get("linkId", "unknown"),
                status="success"
            )
            logger.info(f"Updated integration link: {link.get('linkId')}")
            return result
        except Exception as e:
            logger.error(f"Failed to update integration link: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_disable_connector(self, connector_id: str, reason: str) -> Dict:
        """Disable a connector (with guardrail check)."""
        allowed, reason_msg = self.can_execute_action("disable", "integration", requires_human_approval=True)
        if not allowed:
            return {"success": False, "error": reason_msg, "requires_approval": True}

        try:
            result = self.integration_api.post(
                f"/connectors/{connector_id}/disable",
                {"reason": reason}
            )
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="connector_disabled",
                target=connector_id,
                status="success",
                details={"reason": reason}
            )
            logger.info(f"Disabled connector {connector_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to disable connector {connector_id}: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_check_connector_health(self, connector_id: str) -> Dict:
        """Check health of a connector."""
        try:
            result = self.integration_api.get(f"/connectors/{connector_id}/health")
            logger.info(f"Checked health for connector {connector_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to check connector health: {str(e)}")
            return {"success": False, "error": str(e), "status": "unknown"}

    def get_system_prompt(self) -> str:
        """Return system prompt for integration agent."""
        return """You are the Integration Agent. Your responsibilities:
1. Monitor and maintain connector health
2. Diagnose integration failures
3. Propose fallback routes for data flows
4. Suggest configuration improvements
5. Manage integration links and connections

Available tools:
- get_connectors: View all connectors and their status
- get_integration_links: View integration links
- get_recent_integration_events: Check connector event logs
- update_integration_link: Modify integration configuration
- disable_connector: Disable a failing connector (requires approval)
- check_connector_health: Verify connector status

Important:
- Disabling connectors requires human approval
- All changes must pass compliance checks
- Log all diagnostic actions
- Do not modify workflows or policies"""

    def monitor_connectors(self) -> Dict[str, Any]:
        """Monitor all connectors and report health issues."""
        logger.info("Starting connector health monitoring")

        try:
            connectors = self._tool_get_connectors()
            health_report = {}
            issues = []

            for connector in connectors:
                connector_id = connector.get("connectorId")
                health = self._tool_check_connector_health(connector_id)

                health_report[connector_id] = health

                if health.get("status") != "healthy":
                    issues.append({
                        "connector_id": connector_id,
                        "connector_type": connector.get("type"),
                        "status": health.get("status"),
                        "message": health.get("message")
                    })

            result = {
                "connectors_checked": len(connectors),
                "health_report": health_report,
                "issues": issues,
                "recommendations": self._generate_recommendations(issues)
            }

            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="connectors_monitored",
                target="all",
                status="success",
                details={"issues": len(issues)}
            )

            return result
        except Exception as e:
            logger.error(f"Connector monitoring failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _generate_recommendations(self, issues: List[Dict]) -> List[str]:
        """Generate recommendations based on connector issues."""
        recommendations = []
        for issue in issues:
            if issue.get("status") == "unhealthy":
                recommendations.append(
                    f"Consider disabling {issue['connector_type']} connector {issue['connector_id']}"
                )
            elif issue.get("status") == "degraded":
                recommendations.append(
                    f"Review configuration for {issue['connector_type']} connector {issue['connector_id']}"
                )
        return recommendations

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Integration Agent thinking about: {goal}")
        return f"Analyzing integrations to: {goal}"

    def act(self, plan: str) -> Dict[str, Any]:
        """Execute a plan."""
        return self.monitor_connectors()
