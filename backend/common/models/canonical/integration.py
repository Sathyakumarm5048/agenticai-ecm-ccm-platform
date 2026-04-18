from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class IntegrationLink(BaseModel):
    integrationId: str
    name: str
    sourceSystemId: str
    targetSystemId: str
    direction: str  # inbound, outbound, bidirectional
    protocol: str  # REST, SOAP, MQ, FileDrop
    status: Optional[str] = "Healthy"
    lastHealthCheck: Optional[datetime] = None