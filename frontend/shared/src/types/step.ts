export type StepType =
  | "start"
  | "action"
  | "condition"
  | "connector"
  | "agent"
  | "end";

export interface WorkflowStep {
  id: string;
  type: StepType;
  name: string;
  description?: string;

  // Graph positioning (ReactFlow)
  position?: { x: number; y: number };

  // Step-specific configuration
  config?: Record<string, any>;

  // Connections
  next?: string[]; // IDs of next steps
}