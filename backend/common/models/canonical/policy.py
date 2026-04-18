from pydantic import BaseModel
from typing import Optional, Dict, Any
from enum import Enum


class PolicyType(str, Enum):
    RETENTION = "retention"
    ACCESS = "access"
    CLASSIFICATION = "classification"
    MASKING = "masking"
    RESIDENCY = "residency"


class Policy(BaseModel):
    policyId: str
    type: PolicyType
    name: str
    rules: Dict[str, Any]  # JSON rules
    priority: Optional[int] = 1
    status: Optional[str] = "Active"
    appliesTo: Optional[Dict[str, Any]] = None  # content types, systems, workflows