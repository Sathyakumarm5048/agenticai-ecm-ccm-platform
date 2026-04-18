from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class Template(BaseModel):
    templateId: str
    name: str
    channel: str  # email, print, sms, pdf
    version: Optional[str] = None
    sourceSystemId: str
    variables: Optional[List[str]] = None
    layoutRef: Optional[str] = None
    status: Optional[str] = "Active"
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None