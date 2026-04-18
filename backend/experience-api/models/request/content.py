# backend/experience-api/models/request/content.py

from pydantic import BaseModel
from typing import Optional


class ContentSearchRequest(BaseModel):
    contentType: Optional[str] = None
    sourceSystemId: Optional[str] = None
    titleContains: Optional[str] = None
    limit: int = 50