# backend/experience-api/services/system_service.py

from typing import List, Dict, Any

from backend.common.models.canonical.system import SystemEndpoint


def list_systems() -> List[SystemEndpoint]:
    # TODO: fetch from config DB
    return []


def get_system_health(system_id: str) -> Dict[str, Any]:
    # TODO: aggregate metrics from monitoring/telemetry
    return {"systemId": system_id, "status": "Healthy"}