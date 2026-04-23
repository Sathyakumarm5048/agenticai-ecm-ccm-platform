export type StepType =
  | "start"
  | "action"
  | "condition"
  | "connector"
  | "agent"
  | "end";

export interface WorkflowStep {
  /** Unique workflow step ID (your domain model) */
  step_id: string;

  /** Domain-level step type */
  step_type: StepType;

  /** Display name */
  name: string;
  description?: string;

  /** ReactFlow node ID (mirrors step_id) */
  id: string;

  /** ReactFlow node type */
  type?: string;

  /** ReactFlow node position */
  position: {
    x: number;
    y: number;
  };

  /** ReactFlow node data */
  data?: Record<string, any>;

  /** Workflow logic */
  next?: string[];
  config?: Record<string, any>;
}