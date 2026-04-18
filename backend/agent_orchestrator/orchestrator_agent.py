"""
Orchestrator Agent - coordinates all specialized agents and manages task graphs.
"""
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
import logging
import uuid
from datetime import datetime

from common.agents.base_agent import BaseAgent, Guardrail, Tool, ActionScope
from common.tools.base_tools import KnowledgeGraphClient, AuditLogger

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """Status of a task in the task graph."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    BLOCKED = "blocked"


@dataclass
class Task:
    """Represents a single task in a task graph."""
    task_id: str
    agent_type: str  # "workflow", "integration", etc.
    goal: str
    status: TaskStatus = TaskStatus.PENDING
    dependencies: List[str] = field(default_factory=list)
    result: Optional[Dict] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None


@dataclass
class TaskGraph:
    """Represents a graph of tasks with dependencies."""
    graph_id: str
    goal: str
    tasks: Dict[str, Task] = field(default_factory=dict)
    status: TaskStatus = TaskStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    completed_at: Optional[str] = None

    def add_task(self, task: Task) -> None:
        """Add a task to the graph."""
        self.tasks[task.task_id] = task

    def get_next_runnable_tasks(self) -> List[Task]:
        """Get tasks that are ready to run (all dependencies completed)."""
        runnable = []
        for task in self.tasks.values():
            if task.status != TaskStatus.PENDING:
                continue

            # Check if all dependencies are completed
            deps_complete = all(
                self.tasks[dep_id].status == TaskStatus.COMPLETED
                for dep_id in task.dependencies
            )

            if deps_complete:
                runnable.append(task)

        return runnable

    def mark_task_completed(self, task_id: str, result: Dict) -> None:
        """Mark a task as completed with its result."""
        if task_id in self.tasks:
            self.tasks[task_id].status = TaskStatus.COMPLETED
            self.tasks[task_id].result = result
            self.tasks[task_id].completed_at = datetime.utcnow().isoformat()

    def mark_task_failed(self, task_id: str, error: str) -> None:
        """Mark a task as failed."""
        if task_id in self.tasks:
            self.tasks[task_id].status = TaskStatus.FAILED
            self.tasks[task_id].error = error
            self.tasks[task_id].completed_at = datetime.utcnow().isoformat()


class OrchestratorAgent(BaseAgent):
    """
    Orchestrator Agent - breaks down goals into tasks, assigns to agents,
    and coordinates results.
    """

    def __init__(
        self,
        agent_name: str = "orchestrator",
        kg_url: str = "http://localhost:8080/api/graph",
        audit_url: str = "http://localhost:8080/api/audit"
    ):
        # Define orchestrator guardrails
        guardrails = [
            Guardrail(
                name="orchestrator_scope",
                scope=ActionScope.READ_WRITE,
                allowed_systems=["workflow", "integration", "compliance", "content", "config"],
                allowed_actions=["read", "invoke_agent", "query_kg", "log_audit"],
                requires_compliance_check=True
            )
        ]

        super().__init__(
            agent_name=agent_name,
            agent_type="orchestrator",
            guardrails=guardrails
        )

        self.kg_client = KnowledgeGraphClient(kg_url)
        self.audit_logger = AuditLogger(audit_url)
        self.task_graphs: Dict[str, TaskGraph] = {}
        self.agent_registry: Dict[str, str] = {}  # Maps agent_type to service_url

    def register_agent(self, agent_type: str, service_url: str) -> None:
        """Register a specialized agent service."""
        self.agent_registry[agent_type] = service_url
        logger.info(f"Registered {agent_type} agent at {service_url}")

    def create_task_graph(self, goal: str) -> TaskGraph:
        """Create a new task graph for a goal."""
        graph = TaskGraph(
            graph_id=str(uuid.uuid4()),
            goal=goal
        )
        self.task_graphs[graph.graph_id] = graph
        logger.info(f"Created task graph {graph.graph_id} for goal: {goal}")
        return graph

    def decompose_goal(self, goal: str) -> TaskGraph:
        """
        Break down a goal into a task graph.
        In a real implementation, this would use an LLM.
        """
        graph = self.create_task_graph(goal)

        # Example: decompose "Keep invoice processing SLA above 99%"
        if "SLA" in goal or "performance" in goal.lower():
            graph.add_task(Task(
                task_id=str(uuid.uuid4()),
                agent_type="workflow",
                goal="Analyze current workflows and find bottlenecks"
            ))
            graph.add_task(Task(
                task_id=str(uuid.uuid4()),
                agent_type="integration",
                goal="Check connector health",
                dependencies=[list(graph.tasks.keys())[-1]]  # Depends on workflow analysis
            ))
            graph.add_task(Task(
                task_id=str(uuid.uuid4()),
                agent_type="content",
                goal="Analyze content distribution patterns",
                dependencies=[list(graph.tasks.keys())[-2]]
            ))
            graph.add_task(Task(
                task_id=str(uuid.uuid4()),
                agent_type="compliance",
                goal="Validate proposed changes",
                dependencies=list(graph.tasks.keys())[:-1]  # Depends on all previous
            ))
            graph.add_task(Task(
                task_id=str(uuid.uuid4()),
                agent_type="config",
                goal="Apply safe configuration changes",
                dependencies=[list(graph.tasks.keys())[-1]]
            ))

        self.audit_logger.log_event(
            agent_name=self.agent_name,
            action="goal_decomposed",
            target=graph.graph_id,
            status="success",
            details={"goal": goal, "tasks": len(graph.tasks)}
        )

        return graph

    def execute_task_graph(self, graph: TaskGraph) -> Dict[str, Any]:
        """Execute all tasks in a task graph."""
        logger.info(f"Executing task graph {graph.graph_id}")
        graph.status = TaskStatus.RUNNING

        results = {}

        while True:
            runnable_tasks = graph.get_next_runnable_tasks()

            if not runnable_tasks:
                break

            for task in runnable_tasks:
                try:
                    task.status = TaskStatus.RUNNING
                    logger.info(f"Invoking {task.agent_type} agent for task {task.task_id}")

                    # In real implementation, invoke actual agent service
                    result = self._invoke_agent(task.agent_type, task.goal)
                    graph.mark_task_completed(task.task_id, result)
                    results[task.task_id] = result

                    self.audit_logger.log_event(
                        agent_name=self.agent_name,
                        action="task_completed",
                        target=task.task_id,
                        status="success",
                        details={"agent": task.agent_type}
                    )

                except Exception as e:
                    logger.error(f"Task {task.task_id} failed: {str(e)}")
                    graph.mark_task_failed(task.task_id, str(e))
                    self.audit_logger.log_event(
                        agent_name=self.agent_name,
                        action="task_failed",
                        target=task.task_id,
                        status="failure",
                        details={"error": str(e)}
                    )

        graph.status = TaskStatus.COMPLETED
        graph.completed_at = datetime.utcnow().isoformat()

        return {
            "graph_id": graph.graph_id,
            "status": graph.status.value,
            "results": results
        }

    def _invoke_agent(self, agent_type: str, goal: str) -> Dict[str, Any]:
        """
        Invoke a specialized agent.
        In real implementation, would call via HTTP to agent service.
        """
        logger.debug(f"Invoking {agent_type} agent with goal: {goal}")
        # Placeholder - in real implementation would call actual service
        return {
            "agent": agent_type,
            "goal": goal,
            "status": "completed",
            "result": f"Processed by {agent_type} agent"
        }

    def get_system_prompt(self) -> str:
        """Return system prompt for orchestrator."""
        return """You are the Orchestrator Agent. Your job is to:
1. Break down complex goals into sub-tasks
2. Assign tasks to specialized agents (Workflow, Integration, Compliance, Content, Config)
3. Coordinate their results and decide next actions
4. Maintain task dependencies and execution order
5. Respect all policies and guardrails
6. Escalate to humans when needed

Available agents:
- Workflow Agent: Designs, analyzes, and optimizes workflows
- Integration Agent: Manages connectors and integration health
- Compliance Agent: Enforces policies and prevents violations
- Content Agent: Understands and classifies content
- Configuration Agent: Manages configuration and optimization

Always:
- Query the Knowledge Graph for context
- Log all actions in the audit trail
- Check compliance before changes
- Handle failures gracefully"""

    def think(self, goal: str) -> str:
        """Process a goal and return reasoning."""
        logger.info(f"Orchestrator thinking about: {goal}")
        # In real implementation, would use LLM
        return f"Decomposing goal: {goal}"

    def act(self, plan: str) -> Dict[str, Any]:
        """Execute a plan."""
        # In real implementation, would create and execute task graph
        return {"status": "executed", "plan": plan}
