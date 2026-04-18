# backend/experience-api/models/request/connector.py

from pydantic import BaseModel


class ConnectorActionRequest(BaseModel):
    reason: str
    requestedBy: str