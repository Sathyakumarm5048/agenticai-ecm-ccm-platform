import { WorkflowStep } from "./step.js";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  steps: WorkflowStep[];
}

/**
 * Full workflow definition used by the builder, API, and runtime.
 * This is what your UI and backend expect when loading a workflow.
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: number;
  published: boolean;
  enabled: boolean;
  tags: string[];
  created_at: string;
  modified_at: string;
  schedule?: string;
  steps: WorkflowStep[];
}