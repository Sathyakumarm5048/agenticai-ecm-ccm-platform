"""
Configuration Agent Service - FastAPI service for the configuration agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
import os

from agents.config_agent.agent import ConfigurationAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Configuration Agent",
    description="Manages configuration drift and optimization",
    version="1.0.0"
)

# Initialize agent
agent = ConfigurationAgent(
    agent_name="config-agent",
    config_api_url=os.getenv("CONFIG_API_URL", "http://localhost:8005"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class ConfigMonitoringRequest(BaseModel):
    """Request to monitor configurations."""
    scope: str


class ConfigMonitoringResponse(BaseModel):
    """Response with monitoring results."""
    scope: str
    drift_report: Dict[str, Any]
    configurations_count: int
    optimizations: list
    summary: str


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Configuration Agent service started")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "config"}


@app.post("/monitor", response_model=ConfigMonitoringResponse)
async def monitor_configurations(request: ConfigMonitoringRequest):
    """Monitor and optimize configurations."""
    try:
        logger.info(f"Monitoring configurations for scope: {request.scope}")
        result = agent.monitor_and_optimize(request.scope)
        return result
    except Exception as e:
        logger.error(f"Configuration monitoring failed: {str(e)}")
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
    port = int(os.getenv("PORT", 8005))
    uvicorn.run(app, host="0.0.0.0", port=port)
