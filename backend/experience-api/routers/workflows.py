# backend/experience-api/routers/workflows.py

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from services.workflow_service import (
    get_workflow_definitions,
    get_workflow_instances,
    create_or_update_workflow_definition,
    get_design_workflows,
    get_design_workflow_by_id,
    create_design_workflow,
    update_design_workflow,
    delete_design_workflow,
    retry_workflow_instance,
    reroute_workflow_instance,
)
from backend.common.models.canonical.workflow import WorkflowDefinition, WorkflowInstance

router = APIRouter()

@router.get("/definitions", response_model=List[WorkflowDefinition])
def list_definitions():
    return get_workflow_definitions()

@router.get("/instances", response_model=List[WorkflowInstance])
def list_instances(filters: Dict[str, Any] = {}):
    return get_workflow_instances(filters)

@router.post("/definitions", response_model=WorkflowDefinition)
def upsert_definition(defn: WorkflowDefinition):
    return create_or_update_workflow_definition(defn)

@router.get("", response_model=List[Dict[str, Any]])
def list_workflows():
    return get_design_workflows()

@router.get("/{workflow_id}", response_model=Dict[str, Any])
def get_workflow(workflow_id: str):
    try:
        return get_design_workflow_by_id(workflow_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.post("", response_model=Dict[str, Any])
def create_workflow(defn: Dict[str, Any]):
    return create_design_workflow(defn)

@router.put("/{workflow_id}", response_model=Dict[str, Any])
def update_workflow(workflow_id: str, defn: Dict[str, Any]):
    try:
        return update_design_workflow(workflow_id, defn)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: str):
    success = delete_design_workflow(workflow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"success": True}

@router.post("/{instance_id}/retry")
def retry(instance_id: str):
    return {"success": retry_workflow_instance(instance_id)}

@router.post("/{instance_id}/reroute")
def reroute(instance_id: str, payload: Dict[str, Any]):
    return {"success": reroute_workflow_instance(instance_id, payload)}