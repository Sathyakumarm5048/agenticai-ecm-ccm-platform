"""
Compliance Agent - enforces policies and prevents violations.
"""
from typing import Dict, List, Any, Optional
from enum import Enum
import logging

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import APIClient, AuditLogger

logger = logging.getLogger(__name__)


class PolicyEvaluationResult(Enum):
    """Result of policy evaluation."""
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    NEEDS_REVIEW = "needs_review"


class ComplianceAgent(BaseAgent):
    """Enforces policies and prevents violations."""

    def __init__(
        self,
        agent_name: str = "compliance-agent",
        policy_api_url: str = "http://localhost:8003",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define compliance agent guardrails
        guardrails = [
            Guardrail(
                name="compliance_scope",
                scope=ActionScope.READ_ONLY,
                allowed_systems=["compliance", "workflow", "integration", "content", "config"],
                allowed_actions=["read", "evaluate"],
                requires_compliance_check=False
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="compliance",
            guardrails=guardrails
        )

        self.policy_api = APIClient(policy_api_url)
        self.audit_logger = AuditLogger(audit_url)

        # Register tools
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        self.register_tool(Tool(
            name="get_policies",
            description="Retrieve policies with optional filters",
            func=self._tool_get_policies,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="evaluate_policy",
            description="Evaluate if a target violates a policy",
            func=self._tool_evaluate_policy,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="log_policy_violation",
            description="Log a policy violation",
            func=self._tool_log_policy_violation,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="get_violation_history",
            description="Get violation history for a target",
            func=self._tool_get_violation_history,
            guardrails=[]
        ))

        self.register_tool(Tool(
            name="suggest_compliant_alternative",
            description="Suggest a compliant alternative for a proposed action",
            func=self._tool_suggest_compliant_alternative,
            guardrails=[]
        ))

    def _tool_get_policies(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get policies."""
        try:
            result = self.policy_api.get("/policies", params=filters)
            logger.info(f"Retrieved policies with filters: {filters}")
            return result.get("policies", [])
        except Exception as e:
            logger.error(f"Failed to get policies: {str(e)}")
            return []

    def _tool_evaluate_policy(self, policy_id: str, target: Dict) -> Dict:
        """Evaluate if a target complies with a policy."""
        try:
            result = self.policy_api.post(
                f"/policies/{policy_id}/evaluate",
                {"target": target}
            )
            logger.info(f"Evaluated policy {policy_id}")
            return result
        except Exception as e:
            logger.error(f"Policy evaluation failed: {str(e)}")
            return {
                "compliant": False,
                "error": str(e),
                "result": PolicyEvaluationResult.NEEDS_REVIEW.value
            }

    def _tool_log_policy_violation(
        self,
        policy_id: str,
        target_id: str,
        reason: str
    ) -> Dict:
        """Log a policy violation."""
        try:
            self.audit_logger.log_policy_violation(
                agent_name=self.agent_name,
                policy_id=policy_id,
                target_id=target_id,
                reason=reason
            )
            logger.warning(f"Policy violation logged: {policy_id} on {target_id}")
            return {"success": True, "logged": True}
        except Exception as e:
            logger.error(f"Failed to log policy violation: {str(e)}")
            return {"success": False, "error": str(e)}

    def _tool_get_violation_history(self, target_id: str) -> List[Dict]:
        """Get violation history for a target."""
        try:
            result = self.policy_api.get(f"/violations/target/{target_id}")
            logger.info(f"Retrieved violation history for {target_id}")
            return result.get("violations", [])
        except Exception as e:
            logger.error(f"Failed to get violation history: {str(e)}")
            return []

    def _tool_suggest_compliant_alternative(
        self,
        policy_id: str,
        proposed_action: Dict
    ) -> Dict:
        """Suggest a compliant alternative for a proposed action."""
        try:
            result = self.policy_api.post(
                f"/policies/{policy_id}/suggest-alternative",
                {"action": proposed_action}
            )
            logger.info(f"Generated compliant alternative for policy {policy_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to suggest alternative: {str(e)}")
            return {"success": False, "error": str(e)}

    def get_system_prompt(self) -> str:
        """Return system prompt for compliance agent."""
        return """You are the Compliance Agent. Your responsibilities:
1. Evaluate actions against organizational policies
2. Flag potential policy violations
3. Suggest compliant alternatives
4. Approve or deny agent plans based on policy
5. Maintain compliance audit trail

Available tools:
- get_policies: View all applicable policies
- evaluate_policy: Check if an action violates a policy
- log_policy_violation: Record a violation
- get_violation_history: View past violations
- suggest_compliant_alternative: Find compliant alternatives

Key principles:
- Never allow non-compliant actions
- Always provide alternatives, not just rejections
- Log all evaluations for audit purposes
- Be strict but fair in policy interpretation
- Do not modify policies themselves"""

    def evaluate_plan(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate a plan for compliance."""
        logger.info(f"Evaluating plan for compliance: {plan.get('name', 'unnamed')}")

        try:
            policies = self._tool_get_policies()
            evaluations = []
            violations = []

            for policy in policies:
                policy_id = policy.get("policyId")
                evaluation = self._tool_evaluate_policy(policy_id, plan)

                evaluations.append({
                    "policy_id": policy_id,
                    "result": evaluation.get("result", PolicyEvaluationResult.NEEDS_REVIEW.value)
                })

                if evaluation.get("result") == PolicyEvaluationResult.NON_COMPLIANT.value:
                    violations.append({
                        "policy_id": policy_id,
                        "reason": evaluation.get("reason", "Policy violation"),
                        "suggestion": evaluation.get("suggestion")
                    })

            result = {
                "plan_name": plan.get("name"),
                "compliant": len(violations) == 0,
                "evaluations": evaluations,
                "violations": violations,
                "recommendations": self._generate_recommendations(violations)
            }

            self.audit_logger.log_event(
                agent_name=self.agent_name,
                action="plan_evaluated",
                target=plan.get("name", "unknown"),
                status="success",
                details={"violations": len(violations)}
            )

            return result
        except Exception as e:
            logger.error(f"Plan evaluation failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def _generate_recommendations(self, violations: List[Dict]) -> List[str]:
        """Generate recommendations based on violations."""
        recommendations = []
        for violation in violations:
            if violation.get("suggestion"):
                recommendations.append(violation["suggestion"])
            else:
                recommendations.append(
                    f"Resolve violation in policy {violation['policy_id']}"
                )
        return recommendations

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Compliance Agent thinking about: {goal}")
        return f"Evaluating compliance for: {goal}"

    def act(self, plan: Dict) -> Dict[str, Any]:
        """Execute compliance evaluation."""
        return self.evaluate_plan(plan)
