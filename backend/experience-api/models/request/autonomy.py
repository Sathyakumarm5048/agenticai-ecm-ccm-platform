# backend/experience-api/models/request/autonomy.py

from pydantic import BaseModel
from typing import Optional, Dict, Any


class AutonomySimulationRequest(BaseModel):
    scenario: str
    connectorId: Optional[str] = None
    workflowId: Optional[str] = None
    systemId: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None