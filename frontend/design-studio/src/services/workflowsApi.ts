import axiosInstance from './apiClient'
import type { WorkflowDefinition } from '@shared/types'

export type NewWorkflowDefinition = Omit<WorkflowDefinition, 'workflow_id' | 'created_at' | 'modified_at'>

export async function fetchWorkflows(): Promise<WorkflowDefinition[]> {
  const response = await axiosInstance.get<WorkflowDefinition[]>('/workflows')
  return response.data
}

export async function fetchWorkflowById(workflowId: string): Promise<WorkflowDefinition> {
  const response = await axiosInstance.get<WorkflowDefinition>(`/workflows/${workflowId}`)
  return response.data
}

export async function createWorkflow(workflow: NewWorkflowDefinition): Promise<WorkflowDefinition> {
  const response = await axiosInstance.post<WorkflowDefinition>('/workflows', workflow)
  return response.data
}

export async function updateWorkflow(workflowId: string, workflow: WorkflowDefinition): Promise<WorkflowDefinition> {
  const response = await axiosInstance.put<WorkflowDefinition>(`/workflows/${workflowId}`, workflow)
  return response.data
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  await axiosInstance.delete(`/workflows/${workflowId}`)
}
