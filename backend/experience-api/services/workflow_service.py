# backend/experience-api/services/workflow_service.py

from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path
import json
import uuid

from backend.common.models.canonical.workflow import (
    WorkflowDefinition,
    WorkflowInstance,
)

STORE_DIR = Path(__file__).resolve().parent / 'data'
STORE_FILE = STORE_DIR / 'workflows.json'


def _ensure_store_dir() -> None:
    STORE_DIR.mkdir(parents=True, exist_ok=True)


def _load_store() -> List[Dict[str, Any]]:
    _ensure_store_dir()
    if not STORE_FILE.exists():
        return []

    try:
        with STORE_FILE.open('r', encoding='utf-8') as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError):
        return []


def _save_store(workflows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    _ensure_store_dir()
    with STORE_FILE.open('w', encoding='utf-8') as handle:
        json.dump(workflows, handle, indent=2)
    return workflows


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + 'Z'


def _find_workflow(workflow_id: str) -> Optional[Dict[str, Any]]:
    workflows = _load_store()
    return next((item for item in workflows if item.get('workflow_id') == workflow_id), None)


def get_workflow_definitions() -> List[WorkflowDefinition]:
    # TODO: call workflow-orchestrator service or Postgres
    return []


def get_workflow_instances(filters: Dict[str, Any]) -> List[WorkflowInstance]:
    # TODO: query workflow instances from DB or orchestrator
    return []


def create_or_update_workflow_definition(defn: WorkflowDefinition) -> WorkflowDefinition:
    # TODO: persist to DB and/or orchestrator
    return defn


def get_design_workflows() -> List[Dict[str, Any]]:
    return _load_store()


def get_design_workflow_by_id(workflow_id: str) -> Dict[str, Any]:
    workflow = _find_workflow(workflow_id)
    if workflow is None:
        raise ValueError(f'Workflow not found: {workflow_id}')
    return workflow


def create_design_workflow(defn: Dict[str, Any]) -> Dict[str, Any]:
    workflows = _load_store()
    workflow_id = defn.get('workflow_id') or str(uuid.uuid4())
    now = _now_iso()
    saved = {
        **defn,
        'workflow_id': workflow_id,
        'created_at': defn.get('created_at', now),
        'modified_at': now,
        'version': defn.get('version', 1),
        'enabled': defn.get('enabled', True),
        'published': defn.get('published', False),
        'tags': defn.get('tags', []),
        'trigger_events': defn.get('trigger_events', []),
        'guardrails': defn.get('guardrails', []),
        'approval_roles': defn.get('approval_roles', []),
    }
    workflows.append(saved)
    _save_store(workflows)
    return saved


def update_design_workflow(workflow_id: str, defn: Dict[str, Any]) -> Dict[str, Any]:
    current = _find_workflow(workflow_id)
    if current is None:
        raise ValueError(f'Workflow not found: {workflow_id}')

    updated = {
        **current,
        **defn,
        'workflow_id': workflow_id,
        'modified_at': _now_iso(),
    }
    workflows = _load_store()
    workflows = [updated if item.get('workflow_id') == workflow_id else item for item in workflows]
    _save_store(workflows)
    return updated


def delete_design_workflow(workflow_id: str) -> bool:
    workflows = _load_store()
    new_workflows = [item for item in workflows if item.get('workflow_id') != workflow_id]
    if len(new_workflows) == len(workflows):
        return False
    _save_store(new_workflows)
    return True


def retry_workflow_instance(instance_id: str) -> bool:
    # TODO: call orchestrator to retry
    return True


def reroute_workflow_instance(instance_id: str, new_route: Dict[str, Any]) -> bool:
    # TODO: call orchestrator to reroute
    return True