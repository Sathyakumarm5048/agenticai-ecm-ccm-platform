from common.models.canonical.content_item import ContentItem
from neo4j import Session

def save_content_item(content: ContentItem, neo4j_session: Session):
    query = """
    MERGE (c:ContentItem {contentId: $contentId})
    SET c.title = $title,
        c.contentType = $contentType,
        c.sourceSystemId = $sourceSystemId,
        c.uri = $uri,
        c.status = $status,
        c.createdAt = $createdAt,
        c.updatedAt = $updatedAt,
        c.owner = $owner
    """
    neo4j_session.run(query, **content.dict())
