from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class Event(BaseModel):
    eventId: str
    eventType: str  # ContentCreated, WorkflowFailed, etc.
    timestamp: datetime
    source: str  # system, connector, platform
    payload: Optional[Dict[str, Any]] = None
    relatedId: Optional[str] = None  # contentId, workflowInstId, connectorId