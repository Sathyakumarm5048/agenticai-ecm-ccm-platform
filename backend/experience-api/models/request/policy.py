# backend/experience-api/models/request/policy.py

from pydantic import BaseModel
from typing import Dict, Any


class PolicyEvaluateRequest(BaseModel):
    policy: Dict[str, Any]
    target: Dict[str, Any]