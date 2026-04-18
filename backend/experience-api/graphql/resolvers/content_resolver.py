import strawberry
from typing import List
from services.content_service import get_content_by_id, search_content

@strawberry.type
class ContentItemGQL:
    contentId: str
    title: str
    contentType: str
    uri: str

@strawberry.type
class ContentQuery:
    @strawberry.field
    def content(self, content_id: str) -> ContentItemGQL:
        item = get_content_by_id(content_id)
        return ContentItemGQL(**item.dict())

    @strawberry.field
    def searchContent(self, query: str) -> List[ContentItemGQL]:
        items = search_content({"query": query})
        return [ContentItemGQL(**i.dict()) for i in items]