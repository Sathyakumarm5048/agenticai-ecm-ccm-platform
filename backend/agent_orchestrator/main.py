"""
Orchestrator Agent Service - FastAPI service for the orchestrator agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import os

from agent_orchestrator.orchestrator_agent import OrchestratorAgent, TaskGraph

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Orchestrator Agent",
    description="Coordinates all specialized agents",
    version="1.0.0"
)

# Initialize orchestrator agent
orchestrator = OrchestratorAgent(
    agent_name="orchestrator",
    kg_url=os.getenv("KG_API_URL", "http://localhost:8080/api/graph"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class GoalRequest(BaseModel):
    """Request to process a goal."""
    goal: str
    context: Optional[Dict[str, Any]] = None


class TaskGraphResponse(BaseModel):
    """Response with task graph execution results."""
    graph_id: str
    status: str
    results: Dict[str, Any]


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Orchestrator Agent service started")
    # Register specialized agents
    orchestrator.register_agent("workflow", os.getenv("WORKFLOW_AGENT_URL", "http://localhost:8001"))
    orchestrator.register_agent("integration", os.getenv("INTEGRATION_AGENT_URL", "http://localhost:8002"))
    orchestrator.register_agent("compliance", os.getenv("COMPLIANCE_AGENT_URL", "http://localhost:8003"))
    orchestrator.register_agent("content", os.getenv("CONTENT_AGENT_URL", "http://localhost:8004"))
    orchestrator.register_agent("config", os.getenv("CONFIG_AGENT_URL", "http://localhost:8005"))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "orchestrator"}


@app.post("/orchestrate", response_model=TaskGraphResponse)
async def orchestrate_goal(request: GoalRequest):
    """
    Orchestrate a complex goal by decomposing it into tasks and coordinating agents.
    """
    try:
        logger.info(f"Received goal: {request.goal}")

        # Decompose goal into task graph
        task_graph = orchestrator.decompose_goal(request.goal)
        logger.info(f"Decomposed goal into {len(task_graph.tasks)} tasks")

        # Execute the task graph
        result = orchestrator.execute_task_graph(task_graph)

        return TaskGraphResponse(**result)

    except Exception as e:
        logger.error(f"Orchestration failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/task-graphs/{graph_id}")
async def get_task_graph(graph_id: str):
    """Get task graph details."""
    if graph_id not in orchestrator.task_graphs:
        raise HTTPException(status_code=404, detail="Task graph not found")

    graph = orchestrator.task_graphs[graph_id]
    return {
        "graph_id": graph.graph_id,
        "goal": graph.goal,
        "status": graph.status.value,
        "created_at": graph.created_at,
        "completed_at": graph.completed_at,
        "tasks": {
            task_id: {
                "agent_type": task.agent_type,
                "goal": task.goal,
                "status": task.status.value,
                "result": task.result,
                "error": task.error
            }
            for task_id, task in graph.tasks.items()
        }
    }


@app.get("/agents")
async def list_registered_agents():
    """List all registered agent services."""
    return {
        "agents": orchestrator.agent_registry
    }


@app.post("/agents/register")
async def register_agent(agent_type: str, service_url: str):
    """Register a new agent service."""
    orchestrator.register_agent(agent_type, service_url)
    return {
        "agent_type": agent_type,
        "service_url": service_url,
        "registered": True
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
