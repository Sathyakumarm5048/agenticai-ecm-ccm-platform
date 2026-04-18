"""
Workflow Agent Service - FastAPI service for the workflow agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
import os

from agents.workflow_agent.agent import WorkflowAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Workflow Agent",
    description="Designs, analyzes, and optimizes workflows",
    version="1.0.0"
)

# Initialize agent
agent = WorkflowAgent(
    agent_name="workflow-agent",
    workflow_api_url=os.getenv("WORKFLOW_API_URL", "http://localhost:8001"),
    kg_url=os.getenv("KG_API_URL", "http://localhost:8080/api/graph"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class WorkflowAnalysisRequest(BaseModel):
    """Request to analyze workflows."""
    goal: str


class WorkflowAnalysisResponse(BaseModel):
    """Response with analysis results."""
    goal: str
    workflows_analyzed: int
    bottlenecks: Dict[str, Any]
    recommendations: list


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Workflow Agent service started")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "workflow"}


@app.post("/analyze", response_model=WorkflowAnalysisResponse)
async def analyze_workflows(request: WorkflowAnalysisRequest):
    """Analyze workflows to meet a goal."""
    try:
        logger.info(f"Analyzing workflows for goal: {request.goal}")
        result = agent.analyze_workflows(request.goal)
        return result
    except Exception as e:
        logger.error(f"Workflow analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/tools")
async def list_tools():
    """List available tools."""
    return {"tools": agent.get_available_tools()}


@app.get("/system-prompt")
async def get_system_prompt():
    """Get system prompt for this agent."""
    return {"prompt": agent.get_system_prompt()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
