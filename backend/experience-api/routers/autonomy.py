# backend/experience-api/routers/autonomy.py

from fastapi import APIRouter
from typing import Dict, Any

from services.autonomy_service import (
    list_incidents,
    resolve_incident,
    simulate_self_healing_scenario,
)

router = APIRouter()

@router.get("/incidents")
def incidents():
    return list_incidents()

@router.post("/incidents/{incident_id}/resolve")
def resolve(incident_id: str, payload: Dict[str, Any] = {}):
    return {"success": resolve_incident(incident_id, payload)}

@router.post("/simulate")
def simulate(payload: Dict[str, Any]):
    return simulate_self_healing_scenario(payload)