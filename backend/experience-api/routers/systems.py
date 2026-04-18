# backend/experience-api/routers/systems.py

from fastapi import APIRouter
from typing import List, Dict, Any

from services.system_service import list_systems, get_system_health

router = APIRouter()

@router.get("/", response_model=List[Dict[str, Any]])
def systems():
    return list_systems()

@router.get("/{system_id}/health")
def health(system_id: str):
    return get_system_health(system_id)