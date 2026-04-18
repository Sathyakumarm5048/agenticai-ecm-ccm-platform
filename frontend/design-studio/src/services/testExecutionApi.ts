// frontend/design-studio/src/services/testExecutionApi.ts

import axios from 'axios'
import { WorkflowDefinition, WorkflowExecution } from '@shared/types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8008'

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Execute a workflow definition for testing purposes
 * This creates a temporary execution for validating workflow logic
 */
export async function executeWorkflowTest(workflow: WorkflowDefinition): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>('/executions/test', {
    workflow_definition: workflow,
    trigger_source: 'design-studio-test',
  })
  return response.data
}

/**
 * Get test execution status and results
 */
export async function getTestExecutionStatus(executionId: string): Promise<WorkflowExecution> {
  const response = await axiosInstance.get<WorkflowExecution>(`/executions/${executionId}`)
  return response.data
}

/**
 * Simulate execution with sample data
 */
export async function simulateWorkflowExecution(
  workflow: WorkflowDefinition,
  sampleData?: Record<string, any>
): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>('/executions/simulate', {
    workflow_definition: workflow,
    sample_data: sampleData,
  })
  return response.data
}
