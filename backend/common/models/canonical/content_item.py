from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from datetime import datetime

class ContentItem(BaseModel):
    contentId: str
    title: str
    contentType: str
    sourceSystemId: str
    uri: str
    status: str
    createdAt: datetime
    updatedAt: datetime
    owner: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None