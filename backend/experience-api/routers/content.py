from fastapi import APIRouter, HTTPException
from typing import List

from models.request.content import ContentSearchRequest
from models.response.content import ContentItemResponse
from services.content_service import get_content_by_id, search_content

router = APIRouter()

@router.get("/{content_id}", response_model=ContentItemResponse)
def get_content(content_id: str):
    item = get_content_by_id(content_id)
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    return ContentItemResponse.from_canonical(item)

@router.post("/search", response_model=List[ContentItemResponse])
def search(payload: ContentSearchRequest):
    items = search_content(payload.dict())
    return [ContentItemResponse.from_canonical(i) for i in items]