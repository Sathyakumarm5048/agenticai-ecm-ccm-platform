# backend/experience-api/routers/policies.py

from fastapi import APIRouter
from typing import List, Dict, Any

from services.policy_service import list_policies, evaluate_policy
from backend.common.models.canonical.policy import Policy

router = APIRouter()

@router.get("/", response_model=List[Policy])
def policies():
    return list_policies()

@router.post("/evaluate")
def evaluate(payload: Dict[str, Any]):
    policy = Policy(**payload["policy"])
    target = payload["target"]
    return evaluate_policy(policy, target)