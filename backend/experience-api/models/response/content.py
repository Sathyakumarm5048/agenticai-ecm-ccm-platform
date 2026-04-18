from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from backend.common.models.canonical.content_item import ContentItem


class ContentItemResponse(BaseModel):
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

    @staticmethod
    def from_canonical(item: ContentItem):
        return ContentItemResponse(
            contentId=item.contentId,
            title=item.title,
            contentType=item.contentType,
            sourceSystemId=item.sourceSystemId,
            uri=item.uri,
            status=item.status,
            createdAt=item.createdAt,
            updatedAt=item.updatedAt,
            owner=item.owner,
            metadata=item.metadata,
        )