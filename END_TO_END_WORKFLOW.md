# AgenticAI Platform: End-to-End Workflow Documentation

**Last Updated**: April 16, 2026  
**Platform Version**: 1.0.0  
**Architecture Pattern**: Microservices + Multi-Agent + Self-Healing

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Service Registry & Endpoints](#service-registry--endpoints)
3. [Core Workflows](#core-workflows)
4. [Request Flow Diagrams](#request-flow-diagrams)
5. [Agent Orchestration Flow](#agent-orchestration-flow)
6. [Self-Healing Loop (Autonomy Engine)](#self-healing-loop-autonomy-engine)
7. [Event Ingestion Pipeline](#event-ingestion-pipeline)
8. [Data Model & Class Hierarchy](#data-model--class-hierarchy)
9. [Integration Points](#integration-points)
10. [Error Handling & Recovery](#error-handling--recovery)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTICAI PLATFORM                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │            API GATEWAY (Port 8008)                           │   │
│  │  - Service Registry & Routing                               │   │
│  │  - Health Checks & Status Monitoring                        │   │
│  │  - Request Proxying                                         │   │
│  └──────────────┬───────────────────────────────────────────────┘   │
│                 │                                                    │
│    ┌────────────┼──────────────┬─────────────────┬──────────────┐   │
│    │            │              │                 │              │   │
│    ▼            ▼              ▼                 ▼              ▼   │
│  ┌─────┐   ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────┐  │
│  │EVENT│   │ORCHESTR- │  │AUTONOMY   │  │EXPERIENCE │  │KNOW. │  │
│  │INGE-│   │ATOR      │  │ENGINE     │  │API        │  │GRAPH │  │
│  │STION│   │(8000)    │  │(8006)     │  │(8080/UI)  │  │API   │  │
│  │(8010)   │          │  │           │  │           │  │(8080)│  │
│  └─────┘   │          │  │ ┌───────┐ │  └───────────┘  └──────┘  │
│            │ ┌──────┐ │  │ │HEALING│ │                           │
│            │ │AGENTS│ │  │ │LOOP   │ │                           │
│            │ └──────┘ │  │ └───────┘ │                           │
│            └──────────┘  └───────────┘                           │
│                                                                      │
│  Agent Services (Downstream):                                       │
│  ├─ Workflow Agent (8001)                                          │
│  ├─ Integration Agent (8002)                                       │
│  ├─ Compliance Agent (8003)                                        │
│  ├─ Content Agent (8004)                                           │
│  └─ Config Agent (8005)                                            │
│                                                                      │
│  External Systems:                                                 │
│  ├─ Knowledge Graph (Neo4j)                                        │
│  ├─ Event Bus (Kafka)                                              │
│  ├─ Metrics Store (Redis)                                          │
│  └─ Audit Trail (Postgres)                                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Service Registry & Endpoints

### API Gateway (Port 8008)

**Base URL**: `http://localhost:8008`

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/health` | GET | Service health check | `{status: "healthy", service: "api-gateway"}` |
| `/services` | GET | List all registered services | `{services: {...}}` |
| `/services/{name}` | GET | Get service details | `{service, url}` |
| `/services/register` | POST | Register new service | `{registered: true, service, url}` |
| `/status` | GET | Platform-wide health status | `{platform_status: {...}}` |
| `/route/{service}/{path}` | * | Proxy to service | Forwarded response |

**Service Registry**:
```python
{
    "orchestrator": "http://localhost:8000",
    "workflow": "http://localhost:8001",
    "integration": "http://localhost:8002",
    "compliance": "http://localhost:8003",
    "content": "http://localhost:8004",
    "config": "http://localhost:8005",
    "autonomy": "http://localhost:8006",
    "knowledge_graph": "http://localhost:8080/api/graph",
    "audit": "http://localhost:8080/api/audit",
    "event_ingestion": "http://localhost:8010"
}
```

---

### Event Ingestion Service (Port 8010)

**Base URL**: `http://localhost:8010`

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/health` | GET | Health check | - |
| `/events/raw` | POST | Ingest single event | `RawEvent` |
| `/events/batch` | POST | Ingest multiple events | `{events: [RawEvent...]}` |
| `/events` | GET | List canonical events | - |
| `/events/{event_id}` | GET | Get event details | - |
| `/events/correlate` | GET | Correlate related events | - |

**Data Models**:
```python
class RawEvent(BaseModel):
    source: str                           # e.g., "connector", "system", "user"
    eventType: str                        # e.g., "workflow.failed", "sla.violation"
    payload: Optional[Dict[str, Any]]     # Event-specific data
    relatedId: Optional[str]              # e.g., workflowId, contentId
    timestamp: Optional[datetime]         # Event timestamp

class Event(BaseModel):                   # Canonical form
    eventId: str                          # UUID
    eventType: str
    timestamp: datetime
    source: str
    payload: Dict[str, Any]
    relatedId: Optional[str]
```

---

### Orchestrator Agent Service (Port 8000)

**Base URL**: `http://localhost:8000`

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/health` | GET | Health check | - |
| `/orchestrate` | POST | Start goal orchestration | `{goal: str, context: Dict}` |
| `/task-graphs/{id}` | GET | Get task graph status | - |
| `/agents` | GET | List registered agents | - |
| `/agents/register` | POST | Register agent | `{agent_type, service_url}` |

**Data Models**:
```python
class Task(BaseModel):
    task_id: str
    agent_type: str                   # Assigned agent type
    goal: str                         # Task description
    status: TaskStatus                # PENDING, RUNNING, COMPLETED, FAILED
    dependencies: List[str]           # Task IDs this depends on
    result: Optional[Dict]            # Execution result
    error: Optional[str]              # Error message if failed

class TaskGraph(BaseModel):
    graph_id: str                     # Unique graph identifier
    goal: str                         # Original goal
    tasks: Dict[str, Task]            # All tasks in graph
    status: TaskStatus                # Graph-level status
```

---

### Autonomy Engine Service (Port 8006)

**Base URL**: `http://localhost:8006`

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/health` | GET | Health check | - |
| `/healing-loop` | POST | Trigger healing loop | `{scenario_type}` |
| `/incidents` | GET | List active incidents | - |
| `/incidents/{id}` | GET | Get incident details | - |
| `/metrics/update` | POST | Update SLA metric | `{sla_id, metric_name, value, unit}` |
| `/sla-violations` | GET | Get violation report | `{sla_id?, limit}` |

**Data Models**:
```python
class Incident(BaseModel):
    incident_id: str
    title: str
    description: str
    severity: IncidentSeverity        # LOW, MEDIUM, HIGH, CRITICAL
    detected_at: datetime
    scenario_type: str                # sla_violation, connector_health, etc.
    affected_systems: List[str]
    metrics: List[Metric]
    root_cause: Optional[str]
    is_resolved: bool

class RemediationPlan(BaseModel):
    plan_id: str
    incident_id: str
    title: str
    estimated_impact: str             # high, medium, low
    confidence: float                 # 0.0 to 1.0
    actions: List[Dict]               # Planned actions
    requires_approval: bool
    compliance_checked: bool
```

---

## Core Workflows

### Workflow 1: Request Routing Through Gateway

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT REQUEST                                                   │
│ POST http://localhost:8008/route/orchestrator/orchestrate           │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ 2. API GATEWAY (main.py: proxy_request)                            │
│                                                                     │
│ - Extract service_name: "orchestrator"                             │
│ - Extract path: "orchestrate"                                      │
│ - Look up SERVICE_REGISTRY["orchestrator"]                         │
│ - Construct target_url: "http://localhost:8000/orchestrate"        │
│ - Forward headers & body                                           │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ 3. ORCHESTRATOR AGENT SERVICE (main.py: orchestrate_goal)          │
│                                                                     │
│ - Receive GoalRequest: {goal, context}                            │
│ - Call orchestrator.decompose_goal(goal)                          │
│   └─► Creates TaskGraph with sub-tasks                            │
│ - Call orchestrator.execute_task_graph(graph)                     │
│   └─► Iterates through tasks, executing by agent type            │
│ - Return TaskGraphResponse                                        │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│ 4. RESPONSE CHAIN                                                   │
│                                                                     │
│ TaskGraphResponse ──┐                                              │
│                     └──► API Gateway ──┐                           │
│                                        └──► Client                │
│                                                                     │
│ HTTP 200 + {graph_id, status, results}                            │
└────────────────────────────────────────────────────────────────────┘
```

---

### Workflow 2: Event Ingestion & Normalization

```
┌──────────────────────────────────────────────────────────────────┐
│ EVENT SOURCE (Connector, API, System)                            │
│ Sends raw event: {source, eventType, payload, relatedId}         │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ POST /events/raw           │
        │ (Event Ingestion Service)  │
        └─────────────┬──────────────┘
                      │
                      ▼
    ┌─────────────────────────────────────────────┐
    │ ingest_event() Handler                      │
    │                                             │
    │ 1. Enqueue to RAW_EVENT_QUEUE               │
    │ 2. Return immediately                       │
    │    {queued: true, eventType}                │
    └─────────────┬───────────────────────────────┘
                  │
                  │ (Async Worker Loop: process_events())
                  ▼
    ┌─────────────────────────────────────────────┐
    │ Event Processing Pipeline                   │
    │                                             │
    │ 1. normalize_event(raw_event)               │
    │    - Validate against RawEvent model        │
    │    - Generate unique eventId (UUID)         │
    │    - Normalize timestamp                    │
    │    - Apply severity classification:         │
    │      * workflow.failed → HIGH               │
    │      * connector.error → MEDIUM             │
    │      * sla.violation → CRITICAL             │
    │                                             │
    │ 2. Append to CANONICAL_EVENTS list          │
    │                                             │
    │ 3. kg_client.write_entity("Event", norm)    │
    │    └─► Write to Knowledge Graph             │
    │                                             │
    │ 4. should_trigger_autonomy(norm)?           │
    │    └─► If severity in {HIGH, CRITICAL}     │
    │        or eventType == "sla.violation"      │
    │                                             │
    │ 5. trigger_autonomy(norm)                   │
    │    └─► POST to /incidents (Autonomy)        │
    │                                             │
    │ 6. audit_logger.log_event(...)              │
    │    └─► Record in audit trail                │
    │                                             │
    └─────────────────────────────────────────────┘
```

**Event Classification Logic**:
```python
if event.eventType.lower() == "workflow.failed":
    severity = "high"
elif event.eventType.lower() == "connector.error":
    severity = "medium"
elif event.eventType.lower() == "sla.violation":
    severity = "critical"
else:
    severity = "low"

# Trigger autonomy engine only for high/critical or SLA violations
should_trigger = severity in {"critical", "high"} or \
                 event.eventType.lower() == "sla.violation"
```

---

### Workflow 3: Goal Orchestration & Task Decomposition

```
┌────────────────────────────────────────────────────────────────────┐
│ CLIENT GOAL                                                         │
│ "Keep invoice processing SLA above 99%"                           │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   ▼
        ┌─────────────────────────────┐
        │ POST /orchestrate           │
        │ (Orchestrator Agent)        │
        └──────────────┬──────────────┘
                       │
                       ▼
    ┌─────────────────────────────────────────────────┐
    │ orchestrate_goal(GoalRequest)                  │
    │                                                 │
    │ 1. orchestrator.decompose_goal(goal)           │
    │                                                 │
    │    Triggers: decompose_goal()                  │
    │    ├─ Create TaskGraph with graph_id          │
    │    ├─ Parse goal keyword ("SLA")              │
    │    ├─ Create Tasks:                           │
    │    │  ├─ T1: workflow - "Analyze bottlenecks" │
    │    │  ├─ T2: integration - "Check health"     │
    │    │  │    └─ Depends on T1                   │
    │    │  ├─ T3: content - "Analyze patterns"     │
    │    │  │    └─ Depends on T1                   │
    │    │  ├─ T4: compliance - "Validate changes"  │
    │    │  │    └─ Depends on T1,T2,T3            │
    │    │  └─ T5: config - "Apply changes"         │
    │    │       └─ Depends on T4                   │
    │    │                                           │
    │    └─ Log audit event                         │
    │                                                 │
    │ 2. orchestrator.execute_task_graph(graph)     │
    │                                                 │
    │    Task Execution Loop:                        │
    │    while tasks_remain:                         │
    │      - Get runnable tasks (no pending deps)   │
    │      - For each task:                         │
    │        - Update status to RUNNING             │
    │        - Get agent_url from registry          │
    │        - HTTP POST to agent with task goal    │
    │        - Receive execution result             │
    │        - Mark task COMPLETED with result      │
    │      - Update dependent task dependencies     │
    │                                                 │
    │ 3. Compile results from all tasks             │
    │ 4. Return TaskGraphResponse                   │
    └─────────────────────────────────────────────────┘
```

**Dependency Graph Visualization**:
```
Task 1 (Workflow)
      │
      ├─→ Task 2 (Integration)
      │        │
      │        └─→ Task 4 (Compliance) ──→ Task 5 (Config)
      │
      └─→ Task 3 (Content)
               │
               └─→ Task 4 (Compliance)
```

---

## Request Flow Diagrams

### Complete Request Lifecycle

```
TIME →

Client                Gateway              Orchestrator          Agents
  │                     │                       │                  │
  │ POST /route/orch    │                       │                  │
  ├────────────────────>│                       │                  │
  │                     │ lookup service        │                  │
  │                     │ construct URL         │                  │
  │                     │ POST /orchestrate     │                  │
  │                     ├──────────────────────>│                  │
  │                     │                       │ decompose_goal   │
  │                     │                       │ create tasks     │
  │                     │                       │ execute_task_graph
  │                     │                       │                  │
  │                     │                       │ POST /invoke     │
  │                     │                       ├─────────────────>│
  │                     │                       │ (to workflow)    │
  │                     │                       │                  │
  │                     │                       │                  │ [processing]
  │                     │                       │                  │
  │                     │                       │ POST /invoke     │
  │                     │                       ├─────────────────>│
  │                     │                       │ (to integration) │
  │                     │                       │                  │
  │                     │                       │                  │ [parallel exec]
  │                     │                       │                  │
  │                     │                       │<───────────────┤ │
  │                     │                       │  [workflow]    │ │
  │                     │                       │                 │ │
  │                     │                       │<───────────────┤ │
  │                     │                       │  [integration]  │
  │                     │                       │                  │
  │                     │<──────────────────────┤                  │
  │                     │  TaskGraphResponse    │                  │
  │                     │  {graph_id, results}  │                  │
  │<────────────────────┤                       │                  │
  │ 200 OK + response   │                       │                  │
  │                     │                       │                  │
```

---

## Agent Orchestration Flow

### Class Hierarchy & Execution

```
┌──────────────────────────────────────────────────────────────┐
│ BaseAgent (common/agents/base_agent.py)                      │
│ ├─ agent_name: str                                           │
│ ├─ agent_type: str                                           │
│ ├─ guardrails: List[Guardrail]                              │
│ ├─ tools: List[Tool]                                        │
│ ├─ execute(goal: str)                                       │
│ └─ check_guardrails(action: Action) → bool                 │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─────────────────────────────────┐
               │                                 │
               ▼                                 ▼
    ┌──────────────────────┐        ┌──────────────────────┐
    │ OrchestratorAgent    │        │ SpecializedAgents    │
    │                      │        │ (Workflow, Config)   │
    │ - decompose_goal()   │        │                      │
    │ - execute_task_graph │        │ - execute(goal)      │
    │ - manage_tasks()     │        │ - validate_policy()  │
    │ - track_state()      │        │ - emit_events()      │
    └──────────────────────┘        └──────────────────────┘


Guardrail Structure:
┌────────────────────────────────────────┐
│ class Guardrail(BaseModel):            │
│  - name: str                           │
│  - scope: ActionScope                  │
│  - allowed_systems: List[str]          │
│  - allowed_actions: List[str]          │
│  - requires_compliance_check: bool     │
│  - requires_approval: bool             │
│                                        │
│ ActionScope enum:                      │
│  READ = read-only access              │
│  WRITE = can modify data               │
│  READ_WRITE = full access             │
│  RESTRICTED = limited to system       │
└────────────────────────────────────────┘
```

### Task Execution with Guardrails

```
Task (goal="Optimize workflow performance")
  │
  ├─ Agent: WorkflowAgent
  │  ├─ Check Guardrails:
  │  │  ├─ Scope: ActionScope.READ_WRITE ✓
  │  │  ├─ System: "workflow" in allowed_systems ✓
  │  │  ├─ Action: "optimize" in allowed_actions ✓
  │  │  └─ Compliance check required? YES
  │  │
  │  ├─ Execute Goal:
  │  │  ├─ Analyze current performance
  │  │  ├─ Identify bottlenecks
  │  │  ├─ Propose optimizations
  │  │  └─ Generate result object
  │  │
  │  ├─ Emit Events:
  │  │  ├─ workflow.optimized
  │  │  ├─ metrics.updated
  │  │  └─ audit.action_recorded
  │  │
  │  └─ Return: {status: "completed", result: {...}}
  │
  └─ Orchestrator marks task COMPLETED
     Updates dependent tasks
     Triggers next wave of execution
```

---

## Self-Healing Loop (Autonomy Engine)

### The DDPAL Loop (Detection → Diagnosis → Plan → Act → Learn)

```
┌────────────────────────────────────────────────────────────────────┐
│ INCIDENT DETECTED                                                   │
│ Source: Event from event_ingestion, metrics from SLA manager       │
└──────────────────┬─────────────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 1. DETECTION PHASE   │
        │                      │
        │ Handler:             │
        │ SLAViolationScenario │
        │ .detect()            │
        │                      │
        │ Checks:              │
        │ - Metric thresholds  │
        │ - System health      │
        │ - SLA baselines      │
        │                      │
        │ Output:              │
        │ Incident object      │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 2. DIAGNOSIS PHASE   │
        │                      │
        │ Handler:             │
        │ SLAViolationScenario │
        │ .diagnose()          │
        │                      │
        │ Analyzes:            │
        │ - Root cause         │
        │ - Related systems    │
        │ - Recent changes     │
        │ - Knowledge graph    │
        │                      │
        │ Output:              │
        │ Root cause analysis  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 3. PLANNING PHASE    │
        │                      │
        │ Handler:             │
        │ SLAViolationScenario │
        │ .plan()              │
        │                      │
        │ Generates:           │
        │ - Remediation plan   │
        │ - Risk assessment    │
        │ - Impact estimation  │
        │ - Compliance check   │
        │                      │
        │ Output:              │
        │ RemediationPlan      │
        └──────────┬───────────┘
                   │
        ┌──────────┴───────────┐
        │ Approval Gate?       │
        │                      │
        │ requires_approval:   │
        │ TRUE: wait for input │
        │ FALSE: proceed       │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 4. ACTING PHASE      │
        │                      │
        │ Action Handlers:     │
        │ - optimize_workflow  │
        │ - scale_resources    │
        │ - refresh_credentials│
        │ - tune_config        │
        │                      │
        │ For each action:     │
        │ 1. Execute action    │
        │ 2. Monitor metrics   │
        │ 3. Record execution  │
        │ 4. Verify result     │
        │                      │
        │ Output:              │
        │ ExecutionResult[]    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ 5. LEARNING PHASE    │
        │                      │
        │ Analyze outcomes:    │
        │ - Was issue resolved?│
        │ - What worked/failed?│
        │ - Metrics improvement│
        │                      │
        │ Update knowledge:    │
        │ - Success patterns   │
        │ - Failure patterns   │
        │ - Recommendations    │
        │ - Strategy fitness   │
        │                      │
        │ Output:              │
        │ Learning outcomes    │
        │ Store in KG          │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ LOOP COMPLETE        │
        │ HealingLoop marked   │
        │ COMPLETED            │
        │                      │
        │ Store:               │
        │ completed_loops[]    │
        │ incident_history[]   │
        └──────────────────────┘
```

### HealingLoop Data Structure

```python
@dataclass
class HealingLoop:
    loop_id: str                              # Unique identifier
    incident_id: str                          # Associated incident
    phase: LoopPhase                          # Current phase
    current_step: str                         # Step description
    
    # Timeline
    start_time: datetime                      # When loop started
    end_time: Optional[datetime]              # When loop completed
    
    # Phase outputs
    detection_results: Dict                   # Detection findings
    diagnosis_results: Dict                   # Root cause analysis
    remediation_plan: RemediationPlan         # Proposed actions
    execution_results: List[ExecutionResult]  # Action outcomes
    learning_outcomes: Dict                   # Learning summary
    
    # Status
    is_successful: bool                       # Did it resolve?
    error_message: Optional[str]              # If failed
```

### Scenario Handlers

```python
class SLAViolationScenario:
    @staticmethod
    def detect(engine, metrics) → Incident:
        """Detect SLA violations"""
        # Compare metrics against SLA thresholds
        # Return incident if violation detected

    @staticmethod
    def diagnose(engine, incident) → Dict:
        """Identify root causes"""
        # Query knowledge graph for related entities
        # Analyze recent changes
        # Identify bottlenecks

    @staticmethod
    def plan(engine, incident, diagnosis) → RemediationPlan:
        """Generate remediation actions"""
        # Propose: optimize_workflow, scale_resources, tune_config
        # Estimate impact and risk
        # Check compliance constraints

    @staticmethod
    def execute_action(engine, action, context) → ExecutionResult:
        """Execute proposed action"""
        # Apply configuration changes
        # Scale resources
        # Monitor for effects
```

---

## Event Ingestion Pipeline

### Full Pipeline Architecture

```
EVENT SOURCE (Multiple Channels)
    │
    ├─ Connector Event: {source: "salesforce", eventType: "object.updated"}
    ├─ API Event: {source: "api", eventType: "request.failed"}
    ├─ System Event: {source: "system", eventType: "task.completed"}
    └─ User Event: {source: "user", eventType: "action.triggered"}
    │
    ▼ HTTP POST /events/raw or /events/batch
    │
┌───────────────────────────────────────────────────────────┐
│ EVENT INGESTION SERVICE (Port 8010)                       │
│                                                           │
│ Endpoint: ingest_event(raw_event: RawEvent)             │
│ ├─ Validate input against RawEvent schema                │
│ ├─ Enqueue to RAW_EVENT_QUEUE                           │
│ └─ Return {queued: true} immediately                     │
│                                                           │
│ (Async Worker: process_events())                         │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼ (Dequeue from RAW_EVENT_QUEUE)
    ┌────────────────────────────────┐
    │ NORMALIZE PHASE                │
    │                                │
    │ normalize_event(raw_event):    │
    │ ├─ Generate UUID → eventId     │
    │ ├─ Parse/validate timestamp    │
    │ ├─ Classify severity:          │
    │ │  ├─ workflow.failed → HIGH   │
    │ │  ├─ connector.error → MED    │
    │ │  ├─ sla.violation → CRIT     │
    │ │  └─ default → LOW            │
    │ ├─ Flatten payload if needed   │
    │ └─ Create Event (canonical)    │
    │                                │
    │ Output: Event object           │
    └────────────┬───────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ┌─────────┐      ┌─────────────────┐
    │ PERSIST │      │ CONDITIONAL     │
    │         │      │ ROUTING         │
    │ Append  │      │                 │
    │ to      │      │ Check if:       │
    │ CANONI- │      │ - severity in   │
    │ CAL_    │      │   {HIGH,CRIT}   │
    │ EVENTS  │      │ - type ==       │
    │ list    │      │   sla.violation │
    │         │      │                 │
    │ (Memory │      │ If TRUE:        │
    │ storage)│      │ TRIGGER_AUTONOMY│
    └─────────┘      └────────┬────────┘
         │                    │
         ▼                    ▼
    ┌──────────────┐  ┌─────────────────┐
    │ KNOWLEDGE    │  │ AUTONOMY TRIGGER│
    │ GRAPH        │  │                 │
    │              │  │ POST /incidents │
    │ kg_client    │  │ (Autonomy Eng)  │
    │ .write_      │  │                 │
    │ entity(      │  │ Triggers        │
    │ "Event",     │  │ healing loop:   │
    │ norm)        │  │ - Detection     │
    │              │  │ - Diagnosis     │
    │              │  │ - Planning      │
    │              │  │ - Acting        │
    │              │  │ - Learning      │
    └──────────────┘  └─────────────────┘
         │                    │
         └────────┬───────────┘
                  │
                  ▼
    ┌──────────────────────────────┐
    │ AUDIT LOGGING                │
    │                              │
    │ audit_logger.log_event(      │
    │   agent_name="event-ing",    │
    │   action="ingest_event",     │
    │   target=eventId,            │
    │   status="processed",        │
    │   details={...}              │
    │ )                            │
    └──────────────────────────────┘
```

---

## Data Model & Class Hierarchy

### Core Data Models

```
Event (Canonical Model)
├─ eventId: str (UUID)
├─ eventType: str (e.g., "workflow.failed")
├─ timestamp: datetime
├─ source: str (origin system)
├─ payload: Dict[str, Any] (event-specific data)
├─ relatedId: Optional[str] (links to workflow, content, etc.)
└─ normalizedAt: datetime (when normalized)

Task (Orchestration)
├─ task_id: str (UUID)
├─ agent_type: str (workflow, integration, etc.)
├─ goal: str (task description)
├─ status: TaskStatus (PENDING, RUNNING, COMPLETED, FAILED)
├─ dependencies: List[str] (depends on task IDs)
├─ result: Optional[Dict] (execution result)
├─ error: Optional[str] (error message)
├─ created_at: datetime
└─ completed_at: Optional[datetime]

TaskGraph (Orchestration Structure)
├─ graph_id: str (UUID)
├─ goal: str (original goal)
├─ tasks: Dict[str, Task] (all tasks)
├─ status: TaskStatus (graph-level)
├─ created_at: datetime
└─ completed_at: Optional[datetime]

Incident (Autonomy)
├─ incident_id: str (UUID)
├─ title: str
├─ description: str
├─ severity: IncidentSeverity (LOW, MEDIUM, HIGH, CRITICAL)
├─ detected_at: datetime
├─ scenario_type: str (sla_violation, connector_health, etc.)
├─ affected_systems: List[str]
├─ metrics: List[Metric]
├─ root_cause: Optional[str]
└─ is_resolved: bool

RemediationPlan (Autonomy)
├─ plan_id: str (UUID)
├─ incident_id: str
├─ title: str
├─ estimated_impact: str (high, medium, low)
├─ confidence: float (0.0-1.0)
├─ actions: List[Dict] (proposed actions)
├─ requires_approval: bool
├─ compliance_checked: bool
└─ created_at: datetime

HealingLoop (Autonomy)
├─ loop_id: str (UUID)
├─ incident_id: str
├─ phase: LoopPhase (DETECTION, DIAGNOSIS, PLANNING, ACTING, LEARNING)
├─ current_step: str
├─ start_time: datetime
├─ end_time: Optional[datetime]
├─ detection_results: Optional[Dict]
├─ diagnosis_results: Optional[Dict]
├─ remediation_plan: Optional[RemediationPlan]
├─ execution_results: List[ExecutionResult]
├─ learning_outcomes: Optional[Dict]
├─ is_successful: bool
└─ error_message: Optional[str]
```

### Class Relationships

```
                    ┌─────────────────┐
                    │ BaseAgent       │
                    │                 │
                    │ + execute()     │
                    │ + check_guards()│
                    └────────┬────────┘
                             │
            ┌────────────────┼──────────────────┐
            │                │                  │
            ▼                ▼                  ▼
    ┌──────────────┐ ┌────────────┐ ┌──────────────┐
    │Orchestrator  │ │Workflow    │ │Integration  │
    │Agent         │ │Agent       │ │Agent         │
    │              │ │            │ │              │
    │+ decompose() │ │+ analyze() │ │+ integrate() │
    │+ execute()   │ │+ optimize()│ │+ validate()  │
    └──────────────┘ └────────────┘ └──────────────┘

                    ┌──────────────────┐
                    │ AutonomyEngine   │
                    │                  │
                    │+ detect()        │
                    │+ diagnose()      │
                    │+ plan()          │
                    │+ act()           │
                    │+ learn()         │
                    └────────┬─────────┘
                             │
            ┌────────────────┼──────────────────┐
            │                │                  │
            ▼                ▼                  ▼
    ┌──────────────────┐ ┌────────────┐ ┌──────────────┐
    │SLAViolationScen. │ │ConnectorH. │ │WorkflowBott. │
    │                  │ │Scenario    │ │Scenario      │
    │+ detect()        │ │            │ │              │
    │+ diagnose()      │ │+ detect()  │ │+ detect()    │
    │+ plan()          │ │+ plan()    │ │+ plan()      │
    │+ execute_action()│ │+ execute() │ │+ execute()   │
    └──────────────────┘ └────────────┘ └──────────────┘
```

---

## Experience API Layer

### Overview

The Experience API (Port 8080) is the **user-facing interactive platform** where users design workflows, configure connectors, and monitor system execution. It's the bridge between human workflow designers and the autonomous agent system.

```
┌────────────────────────────────────────────────────────────┐
│ EXPERIENCE API (Port 8080) - USER INTERACTION LAYER       │
│                                                             │
│ Frontend Applications:                                    │
│ ├─ Design Studio                                          │
│ │  └─ Workflow builder (drag & drop)                      │
│ ├─ Admin Console                                          │
│ │  └─ Connector management & configuration                │
│ ├─ Experience UI                                          │
│ │  └─ Execution dashboard & monitoring                    │
│ └─ Mobile App (Optional)                                  │
│    └─ Quick status checks & approvals                     │
│                                                             │
│ Backend Services (Port 8080/api):                         │
│ ├─ /api/workflows                                         │
│ │  └─ Create, read, update, list workflow definitions     │
│ ├─ /api/connectors                                        │
│ │  └─ Configure connections to external systems          │
│ ├─ /api/executions                                        │
│ │  └─ Track workflow executions in real-time              │
│ ├─ /api/graph                                             │
│ │  └─ Knowledge graph queries for insights                │
│ ├─ /api/audit                                             │
│ │  └─ Compliance & audit trail                            │
│ └─ /api/webhooks                                          │
│    └─ Real-time push notifications to dashboard           │
└────────────────────────────────────────────────────────────┘
```

### Workflow Designer Endpoints

**Base URL**: `http://localhost:8080/api/workflows`

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/workflows` | GET | List all workflows | - |
| `/workflows` | POST | Create new workflow | `WorkflowDefinition` |
| `/workflows/{id}` | GET | Get workflow details | - |
| `/workflows/{id}` | PUT | Update workflow | `WorkflowDefinition` |
| `/workflows/{id}` | DELETE | Delete workflow | - |
| `/workflows/{id}/versions` | GET | Get workflow versions | - |
| `/workflows/{id}/execute` | POST | Trigger workflow execution | `{parameters: {...}}` |
| `/workflows/{id}/test` | POST | Test workflow (dry-run) | `{parameters: {...}}` |
| `/workflows/templates` | GET | Get workflow templates | - |

**WorkflowDefinition Data Model**:
```python
class WorkflowStep(BaseModel):
    step_id: str                          # UUID
    step_number: int                      # Execution order
    step_type: str                        # "connector", "agent", "conditional", "loop"
    connector_type: Optional[str]         # e.g., "sharepoint", "salesforce", "sap"
    agent_type: Optional[str]             # e.g., "workflow", "compliance", "integration"
    name: str
    description: Optional[str]
    config: Dict[str, Any]                # Step-specific configuration
    input_mapping: Dict[str, str]         # Previous step output → input mapping
    output_mapping: Dict[str, str]        # Output field mappings
    error_handling: ErrorHandling          # Retry/fallback logic
    conditions: Optional[List[Condition]] # When to execute
    
class WorkflowDefinition(BaseModel):
    workflow_id: str                      # UUID
    name: str
    description: Optional[str]
    version: int
    steps: List[WorkflowStep]
    trigger_events: List[str]             # e.g., ["on_new_document", "on_schedule"]
    schedule: Optional[str]               # Cron expression for scheduled runs
    enabled: bool
    guardrails: List[Guardrail]          # Policy constraints
    requires_approval: bool
    approval_roles: List[str]
    tags: List[str]
    created_by: str                       # User ID
    created_at: datetime
    modified_at: datetime
    published: bool
```

### Connector Configuration Endpoints

**Base URL**: `http://localhost:8080/api/connectors`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/connectors` | GET | List available connectors |
| `/connectors/{type}` | GET | Get connector metadata & required fields |
| `/connectors/{type}/schema` | GET | Get connector data schema |
| `/connections` | GET | List configured connections |
| `/connections` | POST | Create new connection |
| `/connections/{id}` | PUT | Update connection |
| `/connections/{id}/test` | POST | Test connection |
| `/connections/{id}/discover` | POST | Discover available objects (tables, folders, etc.) |
| `/connections/{id}/fields/{object}` | GET | Get field mappings for object |

**Connection Data Model**:
```python
class ConnectorConnection(BaseModel):
    connection_id: str                    # UUID
    connector_type: str                   # "sharepoint", "salesforce", "sap", etc.
    connection_name: str                  # User-friendly name
    
    # Credentials (encrypted)
    credentials: EncryptedDict           # API keys, OAuth tokens, passwords
    host: Optional[str]                  # For on-premise systems
    port: Optional[int]
    
    # Configuration
    authentication_type: str              # "api_key", "oauth2", "basic", "certificate"
    is_active: bool
    last_tested: Optional[datetime]
    test_status: Optional[str]           # "success", "failed", "untested"
    
    # Capabilities
    available_operations: List[str]       # "read", "write", "delete", "search"
    rate_limit: Optional[int]            # API calls per minute
    
    created_at: datetime
    created_by: str
```

### Execution Tracking Endpoints

**Base URL**: `http://localhost:8080/api/executions`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/executions` | GET | List all executions (filterable) |
| `/executions/{id}` | GET | Get execution details & status |
| `/executions/{id}/steps` | GET | Get individual step statuses |
| `/executions/{id}/logs` | GET | Get execution logs & audit trail |
| `/executions/{id}/timeline` | GET | Get step-by-step timeline |
| `/executions/{id}/cancel` | POST | Cancel running execution |
| `/executions/{id}/retry` | POST | Retry failed execution |
| `/executions/{id}/approve` | POST | Approve pending step |
| `/executions/{id}/metrics` | GET | Get performance metrics |

**ExecutionContext Data Model**:
```python
class StepExecution(BaseModel):
    execution_id: str                     # Parent execution UUID
    step_id: str                          # From workflow definition
    step_number: int
    step_name: str
    status: ExecutionStatus               # PENDING, RUNNING, COMPLETED, FAILED, BLOCKED
    
    # Timing
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    
    # Execution Details
    input_data: Dict[str, Any]            # Data passed to step
    output_data: Optional[Dict[str, Any]] # Result from step
    error_message: Optional[str]
    
    # Agent Info (if agent step)
    agent_type: Optional[str]
    agent_decisions: Optional[List[str]]  # Actions taken by agent
    guardrail_violations: Optional[List[str]]
    
    # Connector Info (if connector step)
    connector_type: Optional[str]
    connector_request: Optional[Dict]     # API call details
    connector_response: Optional[Dict]
    records_affected: Optional[int]       # Rows inserted/updated/deleted
    
    retry_count: int
    can_retry: bool

class WorkflowExecution(BaseModel):
    execution_id: str                     # UUID
    workflow_id: str
    workflow_version: int
    trigger_source: str                   # "ui", "scheduler", "webhook", "api"
    
    # Overall Status
    status: ExecutionStatus
    started_at: datetime
    completed_at: Optional[datetime]
    duration_seconds: Optional[float]
    
    # Steps
    steps: List[StepExecution]
    
    # User Info
    initiated_by: str                     # User ID
    approvals_pending: List[str]          # Step IDs waiting approval
    
    # Metrics
    total_records_processed: int
    total_records_failed: int
    success_rate: float                   # 0.0-1.0
    
    # Linked Incidents
    incidents_created: List[str]          # Incident IDs from autonomy engine
```

### Real-Time Updates via WebSockets

**Connection**: `ws://localhost:8080/ws/executions/{execution_id}`

```python
class ExecutionUpdate(BaseModel):
    event_type: str                       # "step_started", "step_completed", "error", "metric"
    execution_id: str
    step_id: Optional[str]
    timestamp: datetime
    data: Dict[str, Any]                  # Event-specific data
    
# Example updates:
# 1. Step started
{
  "event_type": "step_started",
  "step_id": "step_2",
  "step_name": "Fetch SharePoint Documents",
  "timestamp": "2026-04-16T10:30:00Z"
}

# 2. Agent action taken
{
  "event_type": "agent_action",
  "step_id": "step_4",
  "agent_type": "compliance",
  "action": "policy_validated",
  "details": "All documents comply with retention policy",
  "timestamp": "2026-04-16T10:30:15Z"
}

# 3. Step completed
{
  "event_type": "step_completed",
  "step_id": "step_2",
  "records_processed": 45,
  "duration_ms": 2341,
  "status": "completed",
  "timestamp": "2026-04-16T10:30:30Z"
}

# 4. Metrics update
{
  "event_type": "metric_update",
  "metric": "sla_progress",
  "value": 87.5,
  "unit": "percent",
  "timestamp": "2026-04-16T10:30:45Z"
}
```

### UI State Management Architecture

```
┌──────────────────────────────────────────────────────┐
│ FRONTEND STATE MANAGEMENT (Redux/Zustand)            │
├──────────────────────────────────────────────────────┤
│                                                       │
│ 1. WORKFLOW STATE                                   │
│    ├─ workflows: List[Workflow]                     │
│    ├─ currentWorkflow: Workflow                     │
│    ├─ workflowDraft: Workflow                       │
│    ├─ isDirty: bool                                 │
│    └─ selectedStep: Step                            │
│                                                       │
│ 2. EXECUTION STATE                                  │
│    ├─ activeExecutions: Map<exec_id, Execution>    │
│    ├─ selectedExecution: Execution                 │
│    ├─ executionHistory: List[Execution]            │
│    └─ filters: {status, dateRange, connector}      │
│                                                       │
│ 3. CONNECTOR STATE                                  │
│    ├─ availableConnectors: List[ConnectorType>    │
│    ├─ connections: Map<conn_id, Connection>       │
│    ├─ selectedConnection: Connection               │
│    └─ discoveredObjects: List<Object>              │
│                                                       │
│ 4. UI STATE                                         │
│    ├─ sidebarOpen: bool                            │
│    ├─ modalOpen: bool (which modal)                │
│    ├─ notifications: List[Notification]            │
│    ├─ loading: Set<operation_id>                   │
│    └─ errors: Map<operation_id, error>             │
│                                                       │
│ 5. REAL-TIME STATE                                  │
│    ├─ wsConnected: bool                            │
│    ├─ liveMetrics: Map<metric_id, value>          │
│    ├─ agentActions: Queue<Action>                  │
│    └─ pendingApprovals: List<Approval>             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Dashboard Real-Time Updates Flow

```
TIME   COMPONENT            ACTION                   STATE UPDATE
─────────────────────────────────────────────────────────────────
T0     User                 POST /workflows/{id}/    execution_started
                            execute

T1     Backend              Create WorkflowExecution
       AuditLogger          Log execution initiated

T2     WebSocket Server     Send to UI              
       "execution_started"  activeExecutions[exec_id]
                            = {status: RUNNING}

T3     Step 1 Processing    Connector connects      
       (SharePoint)         

T4     WebSocket Server     Send to UI
       "step_started"       selectedExecution.steps
                            .find(step_1).status
                            = RUNNING

T5     SharePoint Connector Query returns 45 docs   
       
T6     WebSocket Server     Send to UI
       "step_completed"     Steps[0].output_data
       + metrics            = {document_count: 45}
                            selectedExecution
                            .total_records = 45

T7     Step 2 Processing    Workflow Agent          
       (Validation)         validates documents

T8     Workflow Agent       Decision: 3 invalid     
       
T9     WebSocket Server     Send to UI
       "agent_decision"     agentActions.push(
                            {step_2, decision...})
                            UI shows red highlights
                            on 3 invalid docs

T10    Step 3 Processing    Compliance Agent       
       (Check Policy)       
       
T11    Compliance Agent     Approve with policy     
       Guardrail Check      

T12    WebSocket Server     Send to UI
       "guardrail_check"    Steps[2].guardrail_
                            violations = []
                            UI shows green checkmark

T13    Step 4 Execution     Post to SAP             
       (Write to SAP)       
       
T14    WebSocket Server     Send to UI
       "records_affected"   recordsAffected = 42
                            UI updates counter

T15    Workflow Complete    All steps done          
       
T16    WebSocket Server     Send to UI
       "execution_complete" selectedExecution
                            .status = COMPLETED
       + final metrics      Duration: 125s
                            Success rate: 93.3%

T17    UI                   Close WebSocket
       Dashboard Updates    Store execution
                            in history
```

### Connector Configuration UI Flow

```
┌─────────────────────────────────────────────────────┐
│ USER: "Add new connector"                           │
└────────────────┬──────────────────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────────┐
    │ 1. CONNECTOR TYPE SELECTION             │
    │                                        │
    │ UI: Modal with connector icons        │
    │ ├─ SharePoint                         │
    │ ├─ Salesforce                         │
    │ ├─ SAP                                │
    │ ├─ ServiceNow                         │
    │ └─ [Browse More...]                   │
    │                                        │
    │ GET /api/connectors → List available  │
    │ GET /api/connectors/sharepoint/schema │
    │ → Get required fields                 │
    └────────────────┬───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │ 2. CREDENTIAL INPUT FORM               │
    │                                        │
    │ SharePoint Connector requires:         │
    │ ├─ Site URL: [_____________]          │
    │ ├─ Client ID: [_____________]         │
    │ ├─ Client Secret: [_______]           │
    │ ├─ Auth Type: [OAuth2 ▼]              │
    │ └─ [Test Connection] [Cancel] [Next]  │
    │                                        │
    │ POST /api/connectors/test              │
    │ {connector_type, credentials}          │
    │ → Returns: {status: "success"}         │
    └────────────────┬───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │ 3. OBJECT DISCOVERY                    │
    │                                        │
    │ POST /api/connections/{id}/discover    │
    │ → Lists available objects:             │
    │ ├─ Documents                           │
    │ ├─ Document Libraries                  │
    │ ├─ Lists                               │
    │ └─ Workflows                           │
    │                                        │
    │ UI shows: [Select objects to access]  │
    │ Checkboxes for each object             │
    │                                        │
    │ [Grant Access] [Cancel]                │
    └────────────────┬───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │ 4. FIELD MAPPING (Optional)            │
    │                                        │
    │ For each selected object:              │
    │ GET /api/connections/{id}/fields/obj  │
    │ → Returns: {field1, field2, ...}      │
    │                                        │
    │ UI shows: [Column mapping UI]          │
    │ Users map external fields to           │
    │ canonical data model fields            │
    │                                        │
    │ [Save Mappings]                        │
    └────────────────┬───────────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────────┐
    │ 5. CONNECTION CREATED                  │
    │                                        │
    │ POST /api/connections                  │
    │ {type, name, credentials, mappings}    │
    │                                        │
    │ Response:                              │
    │ {connection_id, status: "active"}      │
    │                                        │
    │ UI:                                    │
    │ ✓ Connection "SharePoint-Sales"       │
    │   Ready to use in workflows            │
    │                                        │
    └────────────────────────────────────────┘
```

---

## Integration Points

### Service-to-Service Communication

```
┌─────────────────────────────────────────────────────────────┐
│ API GATEWAY (Central Proxy)                                 │
│                                                              │
│ All external traffic routes through gateway                │
│ Internal service communication uses direct URLs             │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────────┬────────────┐
    │              │                  │            │
    ▼              ▼                  ▼            ▼
┌─────────┐   ┌──────────┐   ┌────────────┐ ┌──────────┐
│Orchestr │   │Event     │   │Autonomy    │ │Knowledge │
│ator     │   │Ingestion │   │Engine      │ │Graph API │
│(8000)   │   │(8010)    │   │(8006)      │ │(8080)    │
└────┬────┘   └────┬─────┘   └────┬───────┘ └────┬─────┘
     │             │              │              │
     │ (internal)  │              │              │
     │    ┌────────┼──────────┐   │              │
     │    │        │          │   │              │
     ▼    ▼        ▼          ▼   ▼              ▼
     ●──────●      ●──────────●───●──────────────●
       Direct HTTP calls (localhost:PORT)

Direct Calls:
├─ Orchestrator → Workflow Agent (8001): invoke_task()
├─ Orchestrator → Integration Agent (8002): invoke_task()
├─ Orchestrator → Compliance Agent (8003): validate()
├─ Orchestrator → Config Agent (8005): apply_config()
│
├─ Event Ingestion → Knowledge Graph (8080): write_entity()
├─ Event Ingestion → Autonomy Engine (8006): POST /incidents
├─ Event Ingestion → Audit (8080): log_event()
│
├─ Autonomy Engine → Orchestrator (8000): orchestrate()
├─ Autonomy Engine → Knowledge Graph (8080): query()
└─ Autonomy Engine → Agents: execute_action()
```

### Clients & External Access

```
┌────────────────────────────────────────────────────┐
│ EXTERNAL CLIENT                                    │
│ (Web UI, Mobile, Third-party)                     │
│                                                    │
│ All requests MUST go through API Gateway           │
└──────────────────┬─────────────────────────────────┘
                   │
                   │ HTTP/REST
                   │
    ┌──────────────▼────────────────┐
    │ API GATEWAY (8008)             │
    │                                │
    │ Routes:                        │
    │ /route/{service}/{path}        │
    │ /health, /services, /status    │
    └────────────┬───────────────────┘
                 │
        ┌────────┴────────┬────────────┐
        │                 │            │
        ▼                 ▼            ▼
    Orchestrator     Autonomy      Event Ingestion
       Service         Engine           Service

Example Client Flows:
1. Get platform status:
   GET http://localhost:8008/status
   → Checks all service health
   → Returns {platform_status: {...}}

2. Start orchestration:
   POST http://localhost:8008/route/orchestrator/orchestrate
   Body: {goal: "...", context: {...}}
   → Gateway proxies to orchestrator
   → Returns {graph_id, status, results}

3. Ingest event:
   POST http://localhost:8008/route/event_ingestion/events/raw
   Body: {source, eventType, payload, ...}
   → Gateway proxies to event ingestion
   → Returns {queued: true}
```

---

## Error Handling & Recovery

### Error Propagation

```
Error in Agent Task
        │
        ▼
    ┌──────────────────────────┐
    │ Mark task FAILED         │
    │ - task.status = FAILED   │
    │ - task.error = msg       │
    │ - completed_at = now     │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Check dependent tasks    │
    │ - Mark as BLOCKED        │
    │ - Cannot proceed         │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Decide: Retry or Fail?   │
    │                          │
    │ If retryable (network):  │
    │ - Exponential backoff    │
    │ - Max 3 retries          │
    │                          │
    │ If fatal (validation):   │
    │ - Mark graph FAILED      │
    │ - Return error to client │
    └──────────────────────────┘
```

### Recovery Mechanisms

```
SCENARIO 1: Task Timeout
Task execution exceeds 30s timeout
    │
    ├─ Mark task FAILED (timeout)
    ├─ Log error to audit trail
    ├─ Attempt retry with longer timeout
    └─ If still fails, fail dependent tasks

SCENARIO 2: Service Unavailable
Target agent service unreachable
    │
    ├─ Retry with exponential backoff (1s, 2s, 4s)
    ├─ If all retries fail
    │  ├─ Create incident in Autonomy Engine
    │  ├─ Trigger healing loop for "service_unavailable"
    │  └─ Alert operational team
    └─ Mark task BLOCKED pending service recovery

SCENARIO 3: Policy Violation
Guardrail check fails
    │
    ├─ Log security event to audit trail
    ├─ Notify compliance team
    ├─ Mark task FAILED with policy_violation error
    └─ Do NOT retry (requires policy update)

SCENARIO 4: Autonomy Engine Failure
Healing loop execution fails
    │
    ├─ Escalate incident severity
    ├─ Switch to manual remediation mode
    ├─ Notify on-call engineer
    └─ Record learning: "Strategy failed - manual required"
```

### Audit Trail

```
All events logged:
├─ API Gateway
│  ├─ Request routing
│  ├─ Service registration
│  └─ Health check results
│
├─ Orchestrator
│  ├─ Goal decomposition
│  ├─ Task creation/status
│  ├─ Agent invocation
│  └─ Graph completion
│
├─ Event Ingestion
│  ├─ Event received
│  ├─ Event normalized
│  ├─ Event persisted
│  ├─ Knowledge graph write
│  └─ Autonomy trigger
│
├─ Autonomy Engine
│  ├─ Incident detected
│  ├─ Diagnosis completed
│  ├─ Plan approved/rejected
│  ├─ Action executed
│  └─ Loop completed
│
└─ Agents
   ├─ Task received
   ├─ Guardrail check
   ├─ Goal executed
   └─ Result returned

Log Format:
{
  timestamp: ISO8601,
  service: "service_name",
  event_type: "action",
  entity_id: "UUID",
  status: "success|failure",
  details: {...},
  user_id: optional,
  ip_address: optional
}
```

---

## Visual Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AGENTICAI ECOSYSTEM                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─ EXTERNAL CLIENTS ─────────────────────────────────────────────┐ │
│  │ Web UI | Mobile | API Consumers | Third-party Integrations    │ │
│  └──────────────────────────────┬──────────────────────────────────┘ │
│                                  │                                    │
│                                  │ All traffic via                    │
│                                  ▼ API Gateway                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ API GATEWAY (8008) - Central routing & service discovery      │ │
│  │ - Service registry                                             │ │
│  │ - Health monitoring                                            │ │
│  │ - Request proxying                                             │ │
│  └──────────────────────────────────────────────────────────────┘ │
│       │               │                    │            │           │
│       │               │                    │            │           │
│       ▼               ▼                    ▼            ▼           │
│   ┌────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐   │
│   │EVENT       │  │ORCHESTRATOR  │  │AUTONOMY  │  │EXPERIENCE│   │
│   │INGESTION   │  │AGENT (8000)  │  │ENGINE    │  │API       │   │
│   │(8010)      │  │              │  │(8006)    │  │(8080/UI) │   │
│   │            │  │ ┌──────────┐ │  │          │  │          │   │
│   │- normalize │  │ │TASK      │ │  │ ┌──────┐ │  │          │   │
│   │- correlate │  │ │GRAPH     │ │  │ │DDPAL │ │  │ - views  │   │
│   │- persist   │  │ │EXECUTION │ │  │ │LOOP  │ │  │ - dashboards
│   │- trigger   │  │ └──────────┘ │  │ └──────┘ │  │ - reports │   │
│   │            │  │              │  │          │  │          │   │
│   └────────────┘  └──────────────┘  └──────────┘  └──────────┘   │
│        │               │                 │                         │
│        │ (async)       │ (invokes)       │ (triggers)              │
│        │               │ specialized    │                         │
│        │               │ agents         │                         │
│        │               │                │                         │
│        │    ┌──────────┴────────────────┴──────────┐               │
│        │    │                                      │               │
│        │    ▼                                      ▼               │
│        │  ┌────────────────────────────────┐  ┌────────────────┐  │
│        │  │ SPECIALIZED AGENTS             │  │ KNOWLEDGE      │  │
│        │  │ ├─ Workflow (8001)             │  │ GRAPH API      │  │
│        │  │ ├─ Integration (8002)          │  │ (8080)         │  │
│        │  │ ├─ Compliance (8003)           │  │                │  │
│        │  │ ├─ Content (8004)              │  │ - stores       │  │
│        │  │ └─ Config (8005)               │  │   entities     │  │
│        │  │                                │  │ - relationships│  │
│        │  │ Each has:                      │  │ - learning     │  │
│        │  │ - guardrails                   │  │ - recommendations
│        │  │ - tools                        │  │                │  │
│        │  │ - execution logic              │  │                │  │
│        │  └────────────────────────────────┘  └────────────────┘  │
│        │                                                           │
│        └───────────────────────┬──────────────────────────────────┘
│                                │                                    │
│                                ▼                                    │
│                   ┌──────────────────────────┐                      │
│                   │ DATA LAYER               │                      │
│                   │ ├─ Neo4j (Knowledge KG) │                      │
│                   │ ├─ PostgreSQL (Audit)   │                      │
│                   │ ├─ Redis (Metrics/SLA)  │                      │
│                   │ ├─ Kafka (Event Bus)    │                      │
│                   │ └─ MinIO (Storage)      │                      │
│                   └──────────────────────────┘                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Execution Traces

### Example Trace 1: Simple Event Processing

```
TIME   COMPONENT              ACTION                          STATE
────────────────────────────────────────────────────────────────────────
T0     CLIENT                 POST /events/raw               queue_empty
       EventIngestion         receive event                  processing
T1     EventIngestion         validate schema                ✓
T2     EventIngestion         enqueue → RAW_EVENT_QUEUE      queued
       RETURN {queued:true}   
T3     Worker (async)         dequeue from queue            processing
T4     Worker                 normalize_event()              generating
T5     Worker                 append to CANONICAL_EVENTS    persisted
T6     Worker                 kg_client.write_entity()      kg_writing
T7     KnowledgeGraph         record event                  ✓
T8     Worker                 should_trigger_autonomy()     checking
T9     Worker                 severity=HIGH                 ✓ trigger
T10    Worker                 autonomy_client.post()        autonomy_call
T11    AutonomyEngine         POST /incidents received       incident_created
T12    Worker                 audit_logger.log_event()      audited
T13    END                    process complete              ✓ success
```

### Example Trace 2: Goal Orchestration

```
TIME   COMPONENT              ACTION                          STATE
────────────────────────────────────────────────────────────────────────
T0     CLIENT                 POST /route/orch/orchestrate   routing
T1     Gateway                lookup service_registry        found
T2     Gateway                POST to orchestrator           forwarding
T3     Orchestrator           receive GoalRequest            received
T4     Orchestrator           decompose_goal()               analyzing
T5     Orchestrator           create_task_graph()            graph_created
       - Task1: workflow      "analyze bottlenecks"          pending
       - Task2: integration   "check health"                 pending
       - Task3: compliance    "validate changes"             pending
T6     Orchestrator           execute_task_graph()           executing
T7     Orchestrator           get_next_runnable_tasks()      Task1 runnable
T8     Task1 → WorkflowAgent  POST /invoke (8001)            invoking
T9     WorkflowAgent          execute goal                   processing
T10    WorkflowAgent          return results                 ✓ completed
T11    Orchestrator           mark_task_completed(Task1)     T1_done
T12    Orchestrator           get_next_runnable_tasks()      Task2 runnable
T13    Task2 → IntegrationAgn POST /invoke (8002)            invoking
T14    IntegrationAgent       execute goal                   processing
T15    IntegrationAgent       return results                 ✓ completed
T16    Orchestrator           mark_task_completed(Task2)     T2_done
T17    Orchestrator           get_next_runnable_tasks()      Task3 runnable
T18    Task3 → ComplianceAgn  POST /invoke (8003)            invoking
T19    ComplianceAgent        validate                       checking
T20    ComplianceAgent        return validation              ✓ valid
T21    Orchestrator           mark_task_completed(Task3)     T3_done
T22    Orchestrator           compile results                aggregating
T23    Gateway                return TaskGraphResponse       returning
       {graph_id, status:completed, results}
T24    CLIENT                 receive 200 OK                 ✓ success
```

---

## Performance Considerations

```
Request Latency:
├─ API Gateway routing: ~10-20ms
├─ Task execution (per task): 100ms - 5s (depends on task)
├─ Agent invocation: 50-200ms (network)
├─ Knowledge graph operations: 50-500ms (query complexity)
└─ Total E2E (3-task graph): 300ms - 20s

Concurrency:
├─ Parallel task execution: Tasks with no dependencies run in parallel
├─ Worker threads: Default 4 (configurable)
├─ Event processing: Async queue allows non-blocking ingestion
├─ Timeout: 30s per service call, 10s per health check

Throughput:
├─ Events/second: Limited by worker threads
├─ Concurrent orchestrations: Limited by agent availability
├─ Knowledge graph capacity: Scales with Neo4j instance

Scalability:
├─ Horizontal: Add more agent instances, load balance via gateway
├─ Vertical: Increase worker threads, optimize queries
├─ Storage: Archive old events, compress learning outcomes
└─ Network: Use service mesh (Istio) for better routing
```

---

## Configuration & Environment Variables

```bash
# API Gateway
ORCHESTRATOR_AGENT_URL=http://localhost:8000
WORKFLOW_AGENT_URL=http://localhost:8001
INTEGRATION_AGENT_URL=http://localhost:8002
COMPLIANCE_AGENT_URL=http://localhost:8003
CONTENT_AGENT_URL=http://localhost:8004
CONFIG_AGENT_URL=http://localhost:8005
AUTONOMY_ENGINE_URL=http://localhost:8006
KG_API_URL=http://localhost:8080/api/graph
AUDIT_API_URL=http://localhost:8080/api/audit
EVENT_INGESTION_URL=http://localhost:8010

# Service Ports
PORT_GATEWAY=8008
PORT_ORCHESTRATOR=8000
PORT_AGENTS_START=8001
PORT_AUTONOMY=8006
PORT_EVENTS=8010
PORT_EXPERIENCE=8080

# Database
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=audit
POSTGRES_USER=user
POSTGRES_PASSWORD=password

REDIS_HOST=localhost
REDIS_PORT=6379

KAFKA_BROKERS=localhost:9092

# Execution
MAX_TASK_RETRIES=3
TASK_TIMEOUT_SECONDS=30
WORKER_THREADS=4
ENABLE_COMPLIANCE_CHECKS=true
ENABLE_APPROVAL_GATES=false
```

---

## Summary

**AgenticAI Platform** is a comprehensive multi-agent orchestration system with self-healing capabilities:

1. **API Gateway** serves as the single entry point for all external traffic
2. **Event Ingestion** pipeline normalizes and correlates events from multiple sources
3. **Orchestrator** decomposes complex goals into task graphs and executes them via specialized agents
4. **Autonomy Engine** implements the DDPAL loop to detect issues and autonomously remediate them
5. **Specialized Agents** handle domain-specific tasks (workflow, integration, compliance, content, config)
6. **Knowledge Graph** stores relationships and learning for continuous improvement

The architecture supports **scalability**, **reliability**, and **autonomous operation** while maintaining **compliance** and **auditability**.

