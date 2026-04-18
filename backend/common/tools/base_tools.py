"""
Common tool wrappers for knowledge graph, API calls, and audit logging.
"""
from typing import Dict, List, Any, Optional
import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class KnowledgeGraphClient:
    """Wrapper for Knowledge Graph queries."""

    def __init__(self, kg_api_url: str = "http://localhost:8080/api/graph"):
        self.kg_api_url = kg_api_url

    def query(self, cypher_query: str, params: Optional[Dict] = None) -> List[Dict]:
        """Execute a Cypher query on the knowledge graph."""
        try:
            response = requests.post(
                f"{self.kg_api_url}/query",
                json={"query": cypher_query, "params": params or {}},
                timeout=10
            )
            response.raise_for_status()
            return response.json().get("results", [])
        except Exception as e:
            logger.error(f"Knowledge graph query failed: {str(e)}")
            raise

    def write_entity(self, entity_type: str, entity_data: Dict) -> Dict:
        """Write an entity to the knowledge graph."""
        try:
            response = requests.post(
                f"{self.kg_api_url}/entities",
                json={"type": entity_type, "data": entity_data},
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Knowledge graph write failed: {str(e)}")
            raise

    def get_relationships(self, entity_id: str) -> List[Dict]:
        """Get relationships for an entity."""
        try:
            response = requests.get(
                f"{self.kg_api_url}/entities/{entity_id}/relationships",
                timeout=10
            )
            response.raise_for_status()
            return response.json().get("relationships", [])
        except Exception as e:
            logger.error(f"Failed to fetch relationships: {str(e)}")
            raise


class APIClient:
    """Generic wrapper for service API calls."""

    def __init__(self, base_url: str):
        self.base_url = base_url

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """GET request to a service."""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API GET failed for {endpoint}: {str(e)}")
            raise

    def post(self, endpoint: str, data: Dict) -> Dict:
        """POST request to a service."""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API POST failed for {endpoint}: {str(e)}")
            raise

    def put(self, endpoint: str, data: Dict) -> Dict:
        """PUT request to a service."""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = requests.put(url, json=data, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API PUT failed for {endpoint}: {str(e)}")
            raise

    def delete(self, endpoint: str) -> Dict:
        """DELETE request to a service."""
        try:
            url = f"{self.base_url}/{endpoint.lstrip('/')}"
            response = requests.delete(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"API DELETE failed for {endpoint}: {str(e)}")
            raise


class AuditLogger:
    """Wrapper for audit event logging."""

    def __init__(self, audit_api_url: str = "http://localhost:8080/api/audit"):
        self.audit_api_url = audit_api_url

    def log_event(
        self,
        agent_name: str,
        action: str,
        target: str,
        status: str,
        details: Optional[Dict] = None
    ) -> Dict:
        """Log an audit event."""
        try:
            event = {
                "agent": agent_name,
                "action": action,
                "target": target,
                "status": status,
                "details": details or {},
                "timestamp": datetime.utcnow().isoformat()
            }
            response = requests.post(
                f"{self.audit_api_url}/events",
                json=event,
                timeout=10
            )
            response.raise_for_status()
            logger.info(f"Audit event logged: {action} on {target}")
            return response.json()
        except Exception as e:
            logger.error(f"Audit logging failed: {str(e)}")
            raise

    def log_policy_violation(
        self,
        agent_name: str,
        policy_id: str,
        target_id: str,
        reason: str
    ) -> Dict:
        """Log a policy violation."""
        return self.log_event(
            agent_name=agent_name,
            action="policy_violation",
            target=target_id,
            status="violation",
            details={"policy_id": policy_id, "reason": reason}
        )
