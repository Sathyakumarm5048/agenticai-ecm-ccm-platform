# backend/experience-api/routers/connectors.py

from fastapi import APIRouter
from typing import List, Dict, Any

from services.connector_service import (
    list_connectors,
    get_connector_health,
    restart_connector,
    disable_connector,
)

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def connectors():
    return list_connectors()

@router.get("/{connector_id}/health")
def health(connector_id: str):
    return get_connector_health(connector_id)

@router.post("/{connector_id}/restart")
def restart(connector_id: str):
    return {"success": restart_connector(connector_id)}

@router.post("/{connector_id}/disable")
def disable(connector_id: str):
    return {"success": disable_connector(connector_id)}