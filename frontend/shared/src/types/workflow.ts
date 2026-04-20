import { WorkflowStep } from "./step";

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  steps: WorkflowStep[];
}