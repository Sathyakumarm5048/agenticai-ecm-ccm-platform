# backend/experience-api/services/agent_service.py

from typing import List, Dict, Any
from datetime import datetime


def send_goal_to_orchestrator(goal: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """
    This will typically:
      - Call the Orchestrator Agent service (HTTP/gRPC)
      - Pass goal + context
      - Return a tracking ID or initial plan
    """
    # TODO: implement HTTP call to agent-orchestrator
    return {
        "goal": goal,
        "status": "accepted",
        "trackingId": "AGT-123",
        "timestamp": datetime.utcnow().isoformat(),
    }


def list_agent_activity(limit: int = 50) -> List[Dict[str, Any]]:
    # TODO: fetch from audit log / KG
    return []