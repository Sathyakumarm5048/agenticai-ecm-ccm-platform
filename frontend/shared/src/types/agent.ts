export type AgentType = "llm" | "rule" | "tool" | "hybrid";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description?: string;

  // LLM config
  model?: string;
  temperature?: number;

  // Tool / skill config
  tools?: string[];

  // Custom metadata
  metadata?: Record<string, any>;
}