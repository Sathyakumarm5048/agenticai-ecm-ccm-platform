# backend/experience-api/services/connector_service.py

from typing import List, Dict, Any

from backend.common.models.canonical.integration import IntegrationLink
from backend.common.models.canonical.system import SystemEndpoint


def list_connectors() -> List[IntegrationLink]:
    # TODO: fetch from config DB or connector registry
    return []


def get_connector_health(connector_id: str) -> Dict[str, Any]:
    # TODO: query health metrics
    return {"connectorId": connector_id, "status": "Healthy"}


def restart_connector(connector_id: str) -> bool:
    # TODO: call connector service
    return True


def disable_connector(connector_id: str) -> bool:
    # TODO: call connector service with guardrails
    return True