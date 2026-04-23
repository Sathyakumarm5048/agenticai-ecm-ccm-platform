// frontend/shared/src/types/connector.ts

export interface ConnectorMetadata {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon_url?: string;
}

export interface ConnectorConnection {
  id: string;
  connector_id: string;
  name: string;
  created_at: string;
  modified_at: string;
  config: Record<string, unknown>;
}