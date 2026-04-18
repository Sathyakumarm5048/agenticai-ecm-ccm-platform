/**
 * Shared Type Definitions for AgenticAI Frontend
 */

// ============= Workflow Types =============

export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ActionScope {
  READ = 'READ',
  WRITE = 'WRITE',
  READ_WRITE = 'READ_WRITE',
  RESTRICTED = 'RESTRICTED',
}

export interface Guardrail {
  name: string;
  scope: ActionScope;
  allowed_systems: string[];
  allowed_actions: string[];
  requires_compliance_check: boolean;
  requires_approval: boolean;
}

export interface WorkflowStep {
  step_id: string;
  step_number: number;
  step_type: 'connector' | 'agent' | 'conditional' | 'loop';
  connector_type?: string;
  agent_type?: string;
  name: string;
  description?: string;
  config: Record<string, any>;
  input_mapping: Record<string, string>;
  output_mapping: Record<string, string>;
  error_handling?: {
    retry_count: number;
    fallback_step?: string;
  };
  conditions?: Condition[];
}

export interface Condition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
  value: any;
}

export interface WorkflowDefinition {
  workflow_id: string;
  name: string;
  description?: string;
  version: number;
  steps: WorkflowStep[];
  trigger_events: string[];
  schedule?: string;
  enabled: boolean;
  guardrails: Guardrail[];
  requires_approval: boolean;
  approval_roles: string[];
  tags: string[];
  created_by: string;
  created_at: Date;
  modified_at: Date;
  published: boolean;
}

// ============= Connector Types =============

export enum AuthenticationType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC = 'basic',
  CERTIFICATE = 'certificate',
}

export interface ConnectorConnection {
  connection_id: string;
  connector_type: string;
  connection_name: string;
  credentials: Record<string, any>;
  host?: string;
  port?: number;
  authentication_type: AuthenticationType;
  is_active: boolean;
  last_tested?: Date;
  test_status?: 'success' | 'failed' | 'untested';
  available_operations: string[];
  rate_limit?: number;
  created_at: Date;
  created_by: string;
}

export interface ConnectorMetadata {
  type: string;
  name: string;
  version: string;
  required_fields: ConnectorField[];
  oauth_available: boolean;
  available_objects?: string[];
}

export interface ConnectorField {
  name: string;
  type: string;
  required: boolean;
  example?: string;
  description?: string;
}

// ============= Execution Types =============

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface StepExecution {
  execution_id: string;
  step_id: string;
  step_number: number;
  step_name: string;
  status: ExecutionStatus;
  started_at?: Date;
  completed_at?: Date;
  duration_seconds?: number;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  agent_type?: string;
  agent_decisions?: string[];
  guardrail_violations?: string[];
  connector_type?: string;
  connector_request?: Record<string, any>;
  connector_response?: Record<string, any>;
  records_affected?: number;
  retry_count: number;
  can_retry: boolean;
}

export interface WorkflowExecution {
  execution_id: string;
  workflow_id: string;
  workflow_version: number;
  trigger_source: 'ui' | 'scheduler' | 'webhook' | 'api';
  status: ExecutionStatus;
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  steps: StepExecution[];
  initiated_by: string;
  approvals_pending: string[];
  total_records_processed: number;
  total_records_failed: number;
  success_rate: number;
  incidents_created: string[];
}

export interface AgentAction {
  action_id: string;
  execution_id: string;
  step_id: string;
  agent_type: string;
  action_type: string;
  description: string;
  confidence: number;
  timestamp: Date;
  result: 'success' | 'warning' | 'error';
  details: Record<string, any>;
}

export interface Incident {
  incident_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  detected_at: Date;
  scenario_type: string;
  affected_systems: string[];
  root_cause?: string;
  is_resolved: boolean;
}

export interface DashboardMetrics {
  totalExecutions: number;
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  executionsByStatus: Record<ExecutionStatus, number>;
  executionsByWorkflow: Array<{
    workflow_id: string;
    workflow_name: string;
    count: number;
  }>;
  recentIncidents: Incident[];
  systemHealth: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

// ============= API Response Types =============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============= WebSocket Event Types =============

export interface WebSocketEvent<T = any> {
  event_type: string;
  timestamp: Date;
  data: T;
}

export interface ExecutionUpdate extends WebSocketEvent {
  execution_id: string;
  step_id?: string;
}

// ============= User & Auth Types =============

export interface User {
  user_id: string;
  email: string;
  name: string;
  roles: string[];
  last_login?: Date;
  created_at: Date;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}
