# backend/experience-api/models/request/system.py

from pydantic import BaseModel


class SystemHealthRequest(BaseModel):
    includeMetrics: bool = False