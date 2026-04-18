from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class WorkflowStep(BaseModel):
    stepId: str
    name: str
    type: str  # humanTask, systemTask, decision, integrationCall
    assignee: Optional[str] = None
    conditions: Optional[Dict[str, Any]] = None
    timeoutSec: Optional[int] = None
    retryPolicy: Optional[Dict[str, Any]] = None


class WorkflowDefinition(BaseModel):
    workflowDefId: str
    name: str
    description: Optional[str] = None
    steps: List[WorkflowStep]
    triggers: Optional[List[str]] = None
    sla: Optional[int] = None  # seconds
    owner: Optional[str] = None
    sourceSystemId: Optional[str] = None
    version: Optional[str] = None


class WorkflowInstance(BaseModel):
    workflowInstId: str
    definitionId: str
    state: str  # running, completed, failed
    currentStep: Optional[str] = None
    startedAt: datetime
    completedAt: Optional[datetime] = None
    slaDeadline: Optional[datetime] = None
    slaStatus: Optional[str] = None  # onTrack, atRisk, breached
    context: Optional[Dict[str, Any]] = None
    relatedContentIds: Optional[List[str]] = None