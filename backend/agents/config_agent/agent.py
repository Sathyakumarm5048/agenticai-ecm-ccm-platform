"""
Configuration Agent - manages configuration drift and optimization.
"""
from typing import Dict, List, Any, Optional
import logging

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import APIClient, AuditLogger

logger = logging.getLogger(__name__)


class ConfigurationAgent(BaseAgent):
    """Manages configuration drift and optimization."""

    def __init__(
        self,
        agent_name: str = "config-agent",
        config_api_url: str = "http://localhost:8005",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define configuration agent guardrails
        guardrails = [
            Guardrail(
                name="config_scope",
                scope=ActionScope.READ_WRITE,
                allowed_systems=["config"],
                allowed_actions=["read", "update", "rollback"],
                requires_compliance_check=True,
                requires_approval=True  # Config changes need approval
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="config",
            guardrails=guardrails
        )

        self.config_api = APIClient(config_api_url)
        self.audit_logger = AuditLogger(audit_url)

        # Register tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        self.register_tool(Tool(
            name="get_configuration_items",
            description="Get configuration items for a scope",
            func=self._tool_get_configuration_items,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="update_configuration_item",
            description="Update a configuration item",
            func=self._tool_update_configuration_item,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="get_change_history",
            description="Get change history for a configuration",
            func=self._tool_get_change_history,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="detect_drift",
            description="Detect configuration drift from baseline",
            func=self._tool_detect_drift,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="propose_optimization",
            description="Propose optimization changes",
            func=self._tool_propose_optimization,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="rollback_change",
            description="Rollback a configuration change",
            func=self._tool_rollback_change,
            guardrails=[]
        ))

    def _tool_get_configuration_items(self, scope: str) -> List[Dict]:
        """Get configuration items."""
        try:
            result = self.config_api.get("/configurations", params={"scope": scope})
            logger.info(f"Retrieved configuration items for scope: {scope}")
            return result.get("configurations", [])
        except Exception as e:
            logger.error(f"Failed to get configuration items: {str(e)}")
            return []

    def _tool_update_configuration_item(self, config_id: str, updates: Dict) -> Dict:
        """Update a configuration item."""
        allowed, reason = self.can_execute_action("update", "config", requires_human_approval=True)
        if not allowed:
            return {"success": False, "error": reason, "requires_approval": True}

        try:
            result = self.config_api.put(
                f"/configurations/{config_id}",
                updates
            )
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="config_updated",
                target=config_id,
                status="success",
                details={"updates": updates}
            )
            logger.info(f"Updated configuration {config_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to update configuration: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_get_change_history(self, config_id: str) -> List[Dict]:
        """Get change history for a configuration."""
        try:
            result = self.config_api.get(f"/configurations/{config_id}/history")
            logger.info(f"Retrieved change history for {config_id}")
            return result.get("history", [])
        except Exception as e:
            logger.error(f"Failed to get change history: {str(e)}")
            return []

    def _tool_detect_drift(self, scope: str) -> Dict:
        """Detect configuration drift."""
        try:
            configs = self._tool_get_configuration_items(scope)
            drift_issues = []

            for config in configs:
                config_id = config.get("configId")
                history = self._tool_get_change_history(config_id)

                # Check for unexpected changes
                if history and len(history) > 0:
                    latest_change = history[0]
                    if latest_change.get("status") == "risky":
                        drift_issues.append({
                            "config_id": config_id,
                            "issue": latest_change.get("description"),
                            "last_change": latest_change.get("timestamp")
                        })

            result = {
                "scope": scope,
                "configurations_checked": len(configs),
                "drift_issues": drift_issues,
                "status": "safe" if not drift_issues else "drift_detected"
            }

            logger.info(f"Drift detection completed for scope {scope}: {len(drift_issues)} issues")
            return result
        except Exception as e:
            logger.error(f"Drift detection failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_propose_optimization(self, scope: str) -> Dict:
        """Propose optimization changes."""
        try:
            result = self.config_api.post(
                "/configurations/optimize",
                {"scope": scope}
            )
            logger.info(f"Generated optimization proposals for scope {scope}")
            return result
        except Exception as e:
            logger.error(f"Optimization proposal failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_rollback_change(self, config_id: str, change_id: str) -> Dict:
        """Rollback a configuration change."""
        allowed, reason = self.can_execute_action("rollback", "config", requires_human_approval=True)
        if not allowed:
            return {"success": False, "error": reason, "requires_approval": True}

        try:
            result = self.config_api.post(
                f"/configurations/{config_id}/rollback",
                {"change_id": change_id}
            )
            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="config_rolled_back",
                target=config_id,
                status="success",
                details={"change_id": change_id}
            )
            logger.info(f"Rolled back change {change_id} for config {config_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to rollback change: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_system_prompt(self) -> str:
        """Return system prompt for configuration agent."""
        return """You are the Configuration Agent. Your responsibilities:
1. Detect risky or inconsistent configurations
2. Propose safer defaults and optimizations
3. Manage configuration changes and rollbacks
4. Tune timeouts, retries, and thresholds
5. Monitor configuration drift from baseline

Available tools:
- get_configuration_items: View configurations for a scope
- update_configuration_item: Make configuration changes (requires approval)
- get_change_history: View past changes
- detect_drift: Find unexpected configuration deviations
- propose_optimization: Generate improvement suggestions
- rollback_change: Undo a configuration change (requires approval)

Optimization areas:
- Timeout tuning
- Retry policies
- Batch sizes
- Memory/resource limits
- Rate limiting thresholds

Important:
- All changes require human approval
- Always detect and report drift
- Never make risky changes without approval
- Log all optimizations
- Do not modify workflows or policies"""

    def monitor_and_optimize(self, scope: str) -> Dict[str, Any]:
        """Monitor configurations and propose optimizations."""
        logger.info(f"Monitoring and optimizing configurations for scope: {scope}")

        try:
            # Detect drift
            drift_report = self._tool_detect_drift(scope)

            # Get current configurations
            configs = self._tool_get_configuration_items(scope)

            # Propose optimizations
            optimizations = self._tool_propose_optimization(scope)

            result = {
                "scope": scope,
                "drift_report": drift_report,
                "configurations_count": len(configs),
                "optimizations": optimizations.get("suggestions", []),
                "summary": self._generate_summary(drift_report, optimizations)
            }

            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="config_monitoring",
                target=scope,
                status="success",
                details={
                    "drift_issues": len(drift_report.get("drift_issues", [])),
                    "optimizations": len(optimizations.get("suggestions", []))
                }
            )

            return result
        except Exception as e:
            logger.error(f"Monitoring and optimization failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _generate_summary(self, drift_report: Dict, optimizations: Dict) -> str:
        """Generate a summary of the monitoring results."""
        drift_count = len(drift_report.get("drift_issues", []))
        opt_count = len(optimizations.get("suggestions", []))

        if drift_count == 0 and opt_count == 0:
            return "All configurations are healthy and optimized"
        elif drift_count > 0:
            return f"Detected {drift_count} drift issue(s). {opt_count} optimization(s) available."
        else:
            return f"No drift detected. {opt_count} optimization opportunity/ies available."

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Configuration Agent thinking about: {goal}")
        return f"Optimizing configurations for: {goal}"

    def act(self, scope: str) -> Dict[str, Any]:
        """Execute monitoring and optimization."""
        return self.monitor_and_optimize(scope)
