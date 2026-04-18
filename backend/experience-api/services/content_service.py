# backend/experience-api/services/content_service.py

from typing import List, Dict, Any, Optional
from datetime import datetime

from neo4j import GraphDatabase
from backend.common.models.canonical.content_item import ContentItem

# In real use, move URI/creds to config/env
NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "password123"


def _get_driver():
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def get_content_by_id(content_id: str) -> Optional[ContentItem]:
    query = """
    MATCH (c:ContentItem {contentId: $contentId})
    RETURN c
    """

    with _get_driver() as driver:
        with driver.session() as session:
            result = session.run(query, contentId=content_id)
            record = result.single()
            if not record:
                return None

            node = record["c"]
            data = dict(node)

            return ContentItem(
                contentId=data["contentId"],
                title=data.get("title", ""),
                contentType=data.get("contentType", ""),
                sourceSystemId=data.get("sourceSystemId", ""),
                uri=data.get("uri", ""),
                status=data.get("status", "Unknown"),
                createdAt=_parse_dt(data.get("createdAt")),
                updatedAt=_parse_dt(data.get("updatedAt")),
                owner=data.get("owner"),
                metadata=data.get("metadata", {}),
            )


def search_content(filters: Dict[str, Any]) -> List[ContentItem]:
    """
    Simple example:
    filters may contain:
      - contentType
      - sourceSystemId
      - titleContains
    """

    where_clauses = []
    params: Dict[str, Any] = {}

    if ct := filters.get("contentType"):
        where_clauses.append("c.contentType = $contentType")
        params["contentType"] = ct

    if ss := filters.get("sourceSystemId"):
        where_clauses.append("c.sourceSystemId = $sourceSystemId")
        params["sourceSystemId"] = ss

    if title := filters.get("titleContains"):
        where_clauses.append("c.title CONTAINS $titleContains")
        params["titleContains"] = title

    where_str = ""
    if where_clauses:
        where_str = "WHERE " + " AND ".join(where_clauses)

    query = f"""
    MATCH (c:ContentItem)
    {where_str}
    RETURN c
    LIMIT 100
    """

    items: List[ContentItem] = []

    with _get_driver() as driver:
        with driver.session() as session:
            result = session.run(query, **params)
            for record in result:
                node = record["c"]
                data = dict(node)
                items.append(
                    ContentItem(
                        contentId=data["contentId"],
                        title=data.get("title", ""),
                        contentType=data.get("contentType", ""),
                        sourceSystemId=data.get("sourceSystemId", ""),
                        uri=data.get("uri", ""),
                        status=data.get("status", "Unknown"),
                        createdAt=_parse_dt(data.get("createdAt")),
                        updatedAt=_parse_dt(data.get("updatedAt")),
                        owner=data.get("owner"),
                        metadata=data.get("metadata", {}),
                    )
                )

    return items


def _parse_dt(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value)
        except Exception:
            pass
    # fallback
    return datetime.utcnow()