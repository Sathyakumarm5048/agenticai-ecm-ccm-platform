// frontend/shared/src/types/execution.ts

export type ExecutionStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface WorkflowStepExecution {
  step_id: string;
  name: string;
  status: ExecutionStatus;
  started_at?: string;
  finished_at?: string;
  error_message?: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_version: number;
  status: ExecutionStatus;
  started_at: string;
  finished_at?: string;
  steps: WorkflowStepExecution[];
}