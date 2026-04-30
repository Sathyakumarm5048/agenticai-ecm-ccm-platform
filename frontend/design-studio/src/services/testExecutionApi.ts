// frontend/design-studio/src/services/testExecutionApi.ts

import axiosInstance from "./apiClient";
import { WorkflowDefinition, WorkflowExecution } from "@shared/types";

/**
 * Execute a workflow definition for testing purposes.
 * Creates a temporary execution for validating workflow logic.
 */
export async function executeWorkflowTest(
  workflow: WorkflowDefinition
): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>(
    "/executions/test",
    {
      workflow_definition: workflow,
      trigger_source: "design-studio-test",
    }
  );
  return response.data;
}

/**
 * Get test execution status and results.
 */
export async function getTestExecutionStatus(
  executionId: string
): Promise<WorkflowExecution> {
  const response = await axiosInstance.get<WorkflowExecution>(
    `/executions/${executionId}`
  );
  return response.data;
}

/**
 * Simulate execution with sample data.
 */
export async function simulateWorkflowExecution(
  workflow: WorkflowDefinition,
  sampleData?: Record<string, any>
): Promise<WorkflowExecution> {
  const response = await axiosInstance.post<WorkflowExecution>(
    "/executions/simulate",
    {
      workflow_definition: workflow,
      sample_data: sampleData,
    }
  );
  return response.data;
}