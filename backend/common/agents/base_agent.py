"""
Base Agent class with guardrails, tool execution, and common functionality.
"""
from typing import Dict, List, Any, Callable, Optional
from enum import Enum
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ActionScope(Enum):
    """Allowed action scopes for agents."""
    READ_ONLY = "read_only"
    READ_WRITE = "read_write"
    ADMIN = "admin"


@dataclass
class Guardrail:
    """Represents a guardrail constraint for agent actions."""
    name: str
    scope: ActionScope
    allowed_systems: List[str]  # e.g., ["workflow", "integration"]
    allowed_actions: List[str]  # e.g., ["read", "update"]
    requires_approval: bool = False
    requires_compliance_check: bool = False


@dataclass
class Tool:
    """Represents a tool available to an agent."""
    name: str
    description: str
    func: Callable
    guardrails: List[Guardrail]


class BaseAgent:
    """Base class for all agents."""

    def __init__(
        self,
        agent_name: str,
        agent_type: str,
        guardrails: List[Guardrail],
        tools: Optional[Dict[str, Tool]] = None
    ):
        """
        Initialize a base agent.

        Args:
            agent_name: Unique identifier for the agent
            agent_type: Type of agent (e.g., "workflow", "compliance")
            guardrails: List of guardrail constraints
            tools: Dictionary of available tools
        """
        self.agent_name = agent_name
        self.agent_type = agent_type
        self.guardrails = guardrails
        self.tools = tools or {}
        self.logger = logging.getLogger(f"{self.__class__.__module__}.{agent_name}")

    def register_tool(self, tool: Tool) -> None:
        """Register a new tool for the agent."""
        self.tools[tool.name] = tool
        self.logger.info(f"Tool registered: {tool.name}")

    def can_execute_action(
        self,
        action: str,
        target_system: str,
        requires_human_approval: bool = False
    ) -> tuple[bool, str]:
        """
        Check if an action can be executed based on guardrails.

        Args:
            action: The action to perform (e.g., "update", "delete")
            target_system: The system being targeted
            requires_human_approval: Whether human approval is needed

        Returns:
            (allowed: bool, reason: str)
        """
        for guardrail in self.guardrails:
            if target_system not in guardrail.allowed_systems:
                return False, f"Target system '{target_system}' not in allowed systems"

            if action not in guardrail.allowed_actions:
                return False, f"Action '{action}' not allowed by guardrail '{guardrail.name}'"

            if guardrail.requires_approval and requires_human_approval:
                return False, f"Action requires human approval per guardrail '{guardrail.name}'"

        return True, "Action permitted"

    def execute_tool(
        self,
        tool_name: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Execute a tool with guardrail validation.

        Args:
            tool_name: Name of the tool to execute
            **kwargs: Arguments to pass to the tool

        Returns:
            Tool execution result
        """
        if tool_name not in self.tools:
            raise ValueError(f"Tool '{tool_name}' not found")

        tool = self.tools[tool_name]
        self.logger.debug(f"Executing tool: {tool_name} with args: {kwargs}")

        try:
            result = tool.func(**kwargs)
            self.logger.info(f"Tool '{tool_name}' executed successfully")
            return {
                "success": True,
                "tool": tool_name,
                "result": result,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            self.logger.error(f"Tool '{tool_name}' execution failed: {str(e)}")
            return {
                "success": False,
                "tool": tool_name,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    def get_system_prompt(self) -> str:
        """
        Return the system prompt for this agent.
        Should be overridden by subclasses.
        """
        return f"You are the {self.agent_name} agent of type {self.agent_type}."

    def get_available_tools(self) -> List[Dict[str, Any]]:
        """Get list of available tools with descriptions."""
        return [
            {
                "name": name,
                "description": tool.description,
                "guardrails": [g.name for g in tool.guardrails]
            }
            for name, tool in self.tools.items()
        ]

    def think(self, goal: str) -> str:
        """
        Process a goal and return reasoning/plan.
        Should be overridden by subclasses for LLM integration.
        """
        self.logger.info(f"Agent {self.agent_name} thinking about goal: {goal}")
        return f"Processing goal: {goal}"

    def act(self, plan: str) -> Dict[str, Any]:
        """
        Execute a plan based on reasoning.
        Should be overridden by subclasses.
        """
        self.logger.info(f"Agent {self.agent_name} executing plan: {plan}")
        return {"status": "executed", "plan": plan}
