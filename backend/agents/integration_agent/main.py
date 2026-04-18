"""
Integration Agent Service - FastAPI service for the integration agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging
import os

from agents.integration_agent.agent import IntegrationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Integration Agent",
    description="Manages connectors and integration health",
    version="1.0.0"
)

# Initialize agent
agent = IntegrationAgent(
    agent_name="integration-agent",
    integration_api_url=os.getenv("INTEGRATION_API_URL", "http://localhost:8002"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class ConnectorMonitoringResponse(BaseModel):
    """Response with connector monitoring results."""
    connectors_checked: int
    health_report: Dict[str, Any]
    issues: list
    recommendations: list


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Integration Agent service started")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "integration"}


@app.get("/monitor", response_model=ConnectorMonitoringResponse)
async def monitor_connectors():
    """Monitor all connectors and report health issues."""
    try:
        logger.info("Starting connector monitoring")
        result = agent.monitor_connectors()
        return result
    except Exception as e:
        logger.error(f"Connector monitoring failed: {str(e)}")
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
    port = int(os.getenv("PORT", 8002))
    uvicorn.run(app, host="0.0.0.0", port=port)
