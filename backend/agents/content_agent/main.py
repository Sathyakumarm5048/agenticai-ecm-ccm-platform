"""
Content Agent Service - FastAPI service for the content agent.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
import os

from agents.content_agent.agent import ContentAgent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Content Agent",
    description="Understands and classifies content",
    version="1.0.0"
)

# Initialize agent
agent = ContentAgent(
    agent_name="content-agent",
    content_api_url=os.getenv("CONTENT_API_URL", "http://localhost:8004"),
    audit_url=os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit")
)


class ContentBatchAnalysisRequest(BaseModel):
    """Request to analyze a batch of content."""
    content_ids: List[str]


class ContentBatchAnalysisResponse(BaseModel):
    """Response with batch analysis results."""
    items_analyzed: int
    results: list
    pii_findings: list
    recommendations: list


@app.on_event("startup")
async def startup_event():
    """Initialize agent on startup."""
    logger.info("Content Agent service started")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "content"}


@app.post("/analyze-batch", response_model=ContentBatchAnalysisResponse)
async def analyze_batch(request: ContentBatchAnalysisRequest):
    """Analyze a batch of content items."""
    try:
        logger.info(f"Analyzing batch of {len(request.content_ids)} content items")
        result = agent.analyze_content_batch(request.content_ids)
        return result
    except Exception as e:
        logger.error(f"Batch analysis failed: {str(e)}")
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
    port = int(os.getenv("PORT", 8004))
    uvicorn.run(app, host="0.0.0.0", port=port)
