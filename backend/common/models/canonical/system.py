from pydantic import BaseModel
from typing import Optional, List


class SystemEndpoint(BaseModel):
    systemId: str
    name: str
    type: str  # ECM, CCM, CRM, ERP
    vendor: Optional[str] = None
    environment: Optional[str] = "prod"
    baseUrl: Optional[str] = None
    status: Optional[str] = "Healthy"
    capabilities: Optional[List[str]] = None  # content, workflow, events, templates