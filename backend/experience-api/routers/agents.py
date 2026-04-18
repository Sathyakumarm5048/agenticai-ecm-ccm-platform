# backend/experience-api/routers/agents.py

from fastapi import APIRouter
from typing import Dict, Any

from services.agent_service import send_goal_to_orchestrator, list_agent_activity

router = APIRouter()

@router.post("/orchestrator/goal")
def send_goal(payload: Dict[str, Any]):
    return send_goal_to_orchestrator(payload["goal"], payload.get("context"))

@router.get("/activity")
def activity():
    return list_agent_activity()