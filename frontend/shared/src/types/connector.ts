export type ConnectorType =
  | "rest"
  | "graphql"
  | "database"
  | "ai"
  | "webhook"
  | "custom";

export interface Connector {
  id: string;
  name: string;
  type: ConnectorType;
  config: Record<string, any>;
  enabled: boolean;
}