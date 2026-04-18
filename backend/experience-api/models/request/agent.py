# backend/experience-api/models/request/agent.py

from pydantic import BaseModel
from typing import Optional, Dict, Any


class AgentGoalRequest(BaseModel):
    goal: str
    context: Optional[Dict[str, Any]] = None