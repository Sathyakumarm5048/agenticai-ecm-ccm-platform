from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CommunicationInstance(BaseModel):
    commId: str
    templateId: Optional[str] = None
    channel: str  # email, sms, print, pdf
    recipient: Optional[str] = None
    status: str  # queued, sent, failed
    sentAt: Optional[datetime] = None
    failedAt: Optional[datetime] = None
    failureReason: Optional[str] = None
    correlationId: Optional[str] = None  # batch or journey ID
    sourceSystemId: Optional[str] = None