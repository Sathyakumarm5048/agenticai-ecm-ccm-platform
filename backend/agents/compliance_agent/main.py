"""
Compliance Agent Service - FastAPI service for the compliance agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging
import os

from agents.compliance_agent.agent import ComplianceAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Compliance Agent",
    description="Enforces policies and prevents violations",
    version="1.0.0"
)

# Initialize agent
agent = ComplianceAgent(
    agent_name="compliance-agent",
    policy_api_url=os.getenv("POLICY_API_URL", "http://localhost:8003"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class PlanEvaluationRequest(BaseModel):
    """Request to evaluate a plan for compliance."""
    name: str
    details: Dict[str, Any]


class PlanEvaluationResponse(BaseModel):
    """Response with compliance evaluation."""
    plan_name: str
    compliant: bool
    evaluations: list
    violations: list
    recommendations: list


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Compliance Agent service started")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "compliance"}


@app.post("/evaluate", response_model=PlanEvaluationResponse)
async def evaluate_plan(request: PlanEvaluationRequest):
    """Evaluate a plan for compliance."""
    try:
        logger.info(f"Evaluating plan for compliance: {request.name}")
        plan = {"name": request.name, **request.details}
        result = agent.evaluate_plan(plan)
        return result
    except Exception as e:
        logger.error(f"Plan evaluation failed: {str(e)}")
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
    port = int(os.getenv("PORT", 8003))
    uvicorn.run(app, host="0.0.0.0", port=port)
