// frontend/shared/src/types/workflow.ts

export type WorkflowStepType = "connector" | "agent" | "branch";

export interface WorkflowStep {
  step_id: string;
  name: string;
  description?: string;
  step_type: WorkflowStepType;
  order: number;
  config?: Record<string, unknown>;
}

export interface WorkflowDefinition {
  id: string;
  workflow_id: string;
  name: string;
  description?: string;
  version: number;
  published: boolean;
  enabled: boolean;

  trigger_events: string[];
  guardrails?: string[];
  requires_approval?: boolean;
  approval_roles?: string[];

  created_by: string;
  created_at: string;
  modified_at: string;

  steps: WorkflowStep[];
}

export interface NewWorkflowDefinition {
  name: string;
  description?: string;
  trigger_events: string[];
  guardrails?: string[];
  requires_approval?: boolean;
  approval_roles?: string[];
  enabled?: boolean;
}