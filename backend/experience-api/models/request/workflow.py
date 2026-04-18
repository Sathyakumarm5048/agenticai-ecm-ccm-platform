# backend/experience-api/models/request/workflow.py

from pydantic import BaseModel
from typing import Optional, Dict, Any


class WorkflowInstanceFilter(BaseModel):
    status: Optional[str] = None
    workflowDefId: Optional[str] = None
    startedAfter: Optional[str] = None
    startedBefore: Optional[str] = None


class WorkflowRerouteRequest(BaseModel):
    newRoute: Dict[str, Any]