/// <reference types="vite/client" />

import axios from 'axios'
import { WorkflowExecution, StepExecution } from '@shared/types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8008'

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface ExecutionFilters {
  status?: string | null
  workflowId?: string | null
  dateRange?: { start: Date; end: Date } | null
}

export async function fetchExecutions(filters?: ExecutionFilters): Promise<WorkflowExecution[]> {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)
  if (filters?.workflowId) params.append('workflow_id', filters.workflowId)
  if (filters?.dateRange) {
    params.append('start_date', filters.dateRange.start.toISOString())
    params.append('end_date', filters.dateRange.end.toISOString())
  }

  const response = await axiosInstance.get<WorkflowExecution[]>(`/executions?${params}`)
  return response.data
}

export async function fetchExecutionById(executionId: string): Promise<{
  execution: WorkflowExecution
  stepExecutions: StepExecution[]
}> {
  const [executionResponse, stepsResponse] = await Promise.all([
    axiosInstance.get<WorkflowExecution>(`/executions/${executionId}`),
    axiosInstance.get<StepExecution[]>(`/executions/${executionId}/steps`),
  ])

  return {
    execution: executionResponse.data,
    stepExecutions: stepsResponse.data,
  }
}

export async function startExecution(workflowId: string): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>('/executions', {
    workflow_id: workflowId,
    trigger_source: 'ui',
  })
  return response.data
}

export async function stopExecution(executionId: string): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>(`/executions/${executionId}/stop`)
  return response.data
}

export async function retryWorkflowExecution(executionId: string, stepId?: string): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>(`/executions/${executionId}/retry`, {
    step_id: stepId,
  })
  return response.data
}

export async function retryExecution(executionId: string, stepId?: string): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>(`/executions/${executionId}/retry`, {
    step_id: stepId,
  })
  return response.data
}

export async function bulkRetryExecutions(executionIds: string[]): Promise<WorkflowExecution[]> {
  const response = await axiosInstance.post<WorkflowExecution[]>('/executions/bulk/retry', {
    execution_ids: executionIds,
  })
  return response.data
}

export async function bulkStopExecutions(executionIds: string[]): Promise<WorkflowExecution[]> {
  const response = await axiosInstance.post<WorkflowExecution[]>('/executions/bulk/stop', {
    execution_ids: executionIds,
  })
  return response.data
}