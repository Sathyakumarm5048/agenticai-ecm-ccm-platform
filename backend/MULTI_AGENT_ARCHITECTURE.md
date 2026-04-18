# Multi-Agent Architecture Documentation

## Overview

This platform implements a **hub-and-spoke** multi-agent architecture where specialized agents collaborate through a central Orchestrator to accomplish complex goals in ECM/CCM systems.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Orchestrator Agent                       │
│  (Receives goals, decomposes tasks, coordinates agents)    │
└────────┬──────────┬──────────┬──────────┬──────────────────┘
         │          │          │          │
         ▼          ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Workflow│ │Integr. │ │Compli. │ │Content │ ┌────────┐
    │ Agent  │ │ Agent  │ │ Agent  │ │ Agent  │ │ Config │
    └────────┘ └────────┘ └────────┘ └────────┘ │ Agent  │
         │          │          │          │       └────────┘
         └──────────┴──────────┴──────────┴─────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    Knowledge Graph  Microservices  Audit Logging
```

## Agents

### 1. Orchestrator Agent (Port 8000)

**Role:** Central "brain" that coordinates all activities.

**Responsibilities:**
- Break down goals into sub-tasks (task graph)
- Route tasks to appropriate specialized agents
- Manage task dependencies and execution order
- Aggregate results and decide next actions
- Escalate to humans when needed

**Key Components:**
- `orchestrator_agent.py` - Core orchestrator logic
- `TaskGraph` - Represents task dependencies and execution
- Tool registry for agent communication

**System Prompt Focus:**
- Goal decomposition
- Task coordination
- Result aggregation
- Compliance checking before major changes

---

### 2. Workflow Agent (Port 8001)

**Role:** Owns workflow design, analysis, and optimization.

**Responsibilities:**
- Design new workflows from natural language requirements
- Analyze running workflows for SLAs and bottlenecks
- Suggest optimizations: parallelization, retries, routing
- Generate canonical `WorkflowDefinition` models
- Simulate workflows before deployment

**Key Tools:**
- `get_workflow_definitions()` - Retrieve all workflow templates
- `get_workflow_instances()` - Get running workflow executions
- `update_workflow_definition()` - Save workflow changes
- `simulate_workflow()` - Test workflow with sample data
- `analyze_bottlenecks()` - Identify performance issues

**Guardrails:**
- Can only modify workflows (not connectors or policies)
- All changes require compliance check
- Read/write access to workflow system only

---

### 3. Integration Agent (Port 8002)

**Role:** Manages connectors and integration health.

**Responsibilities:**
- Monitor connector health and uptime
- Diagnose integration failures
- Propose fallback routes for data flows
- Suggest connector configuration improvements
- Disable unhealthy connectors (with approval)

**Key Tools:**
- `get_connectors()` - List all connectors
- `get_integration_links()` - View data flow connections
- `get_recent_integration_events()` - Check event logs
- `update_integration_link()` - Modify connections
- `disable_connector()` - Disable failing connector
- `check_connector_health()` - Health status check

**Guardrails:**
- Cannot disable connectors without human approval
- All changes require compliance check
- Read/write access to integration system only

---

### 4. Compliance Agent (Port 8003)

**Role:** Enforces policies and prevents violations.

**Responsibilities:**
- Evaluate actions against organizational policies
- Flag potential policy violations
- Suggest compliant alternatives (not just rejections)
- Approve/deny plans based on policy
- Maintain compliance audit trail

**Key Tools:**
- `get_policies()` - Retrieve active policies
- `evaluate_policy()` - Check compliance of an action
- `log_policy_violation()` - Record a violation
- `get_violation_history()` - View past violations
- `suggest_compliant_alternative()` - Find compliant options

**Guardrails:**
- **Read-only** - Cannot modify anything
- Never approves non-compliant actions
- Always provides alternatives
- Logs all evaluations

---

### 5. Content Agent (Port 8004)

**Role:** Understands and classifies content.

**Responsibilities:**
- Classify content by type (Invoice, Contract, Policy, etc.)
- Determine sensitivity levels (Public, Internal, Confidential, Restricted)
- Extract structured metadata (amounts, dates, parties)
- Detect PII and sensitive data
- Suggest taxonomy tags and categorization

**Key Tools:**
- `get_content_item()` - Retrieve content details
- `classify_content()` - Determine type/sensitivity
- `extract_metadata()` - Pull structured data
- `detect_pii()` - Scan for sensitive information
- `update_content_metadata()` - Modify metadata
- `suggest_taxonomy()` - Generate classification tags

**Guardrails:**
- Can only read/classify content
- Cannot modify workflows or policies
- Compliance check required for metadata updates

---

### 6. Configuration Agent (Port 8005)

**Role:** Manages configuration and optimization.

**Responsibilities:**
- Detect risky or inconsistent configurations
- Propose safer defaults and optimizations
- Manage configuration changes and rollbacks
- Tune timeouts, retries, batch sizes, limits
- Monitor configuration drift from baseline

**Key Tools:**
- `get_configuration_items()` - View configurations
- `update_configuration_item()` - Make changes
- `get_change_history()` - View past changes
- `detect_drift()` - Find unexpected deviations
- `propose_optimization()` - Generate improvements
- `rollback_change()` - Undo a change

**Guardrails:**
- All changes require human approval
- Compliance check required
- Cannot modify workflows or policies
- Always detect and report drift

---

## Guardrails System

### Types of Guardrails

#### 1. Scope Guardrails
Define which systems/tenants an agent can access.

```python
Guardrail(
    name="workflow_scope",
    scope=ActionScope.READ_WRITE,
    allowed_systems=["workflow"],
    allowed_actions=["read", "create", "update", "simulate"]
)
```

#### 2. Action Guardrails
Define what operations are allowed.

```python
allowed_actions = ["read", "update", "simulate"]  # Not "delete"
```

#### 3. Policy Guardrails
All actions must pass through Compliance Agent evaluation.

```python
requires_compliance_check=True
```

#### 4. Approval Guardrails
Some actions require human approval.

```python
requires_approval=True  # for "disable_connector"
```

### Example Guardrail Logic

**Workflow Agent updating a definition:**
```
1. Check guardrail: is "workflow" in allowed_systems? ✓
2. Check action: is "update" in allowed_actions? ✓
3. Call Compliance Agent to evaluate plan
4. If compliant, proceed; otherwise reject
5. Log all changes to audit trail
```

**Integration Agent disabling a connector:**
```
1. Check guardrail: is "integration" in allowed_systems? ✓
2. Check action: is "disable" in allowed_actions? ✓
3. Check approval requirement: requires_approval=True
4. Return: {"requires_approval": true}
5. Wait for human approval before proceeding
```

---

## Task Graph Pattern

The Orchestrator builds task graphs for complex goals.

### Example: "Keep invoice processing SLA above 99%"

```
1. Workflow Agent
   ├─ Analyze current workflows
   └─ Find bottlenecks
         │
         ▼
2. Integration Agent (depends on #1)
   ├─ Check connector health
   └─ Identify failing connectors
         │
         ▼
3. Content Agent (parallel)
   ├─ Analyze content distribution
   └─ Identify content patterns
         │
         ▼
4. Compliance Agent (depends on #1,#2,#3)
   ├─ Validate proposed changes
   └─ Flag policy issues
         │
         ▼
5. Configuration Agent (depends on #4)
   ├─ Apply safe config changes
   └─ Tune timeouts/retries
```

---

## Tools Layer

All agents use thin wrappers around microservices.

### Common Tools (in `backend/common/tools/base_tools.py`)

```python
# Knowledge Graph Client
kg_client.query(cypher_query)
kg_client.write_entity(entity_type, data)
kg_client.get_relationships(entity_id)

# API Client
api.get(endpoint, params)
api.post(endpoint, data)
api.put(endpoint, data)
api.delete(endpoint)

# Audit Logger
audit_logger.log_event(agent, action, target, status, details)
audit_logger.log_policy_violation(agent, policy_id, target_id, reason)
```

### Agent-Specific Tools

Each agent implements domain-specific tools:
- **Workflow:** workflow definitions, instances, simulation
- **Integration:** connectors, links, health checks
- **Compliance:** policies, evaluations, violations
- **Content:** classification, metadata, PII detection
- **Configuration:** drift detection, optimizations

---

## Directory Structure

```
backend/
├── agent-orchestrator/
│   ├── __init__.py
│   ├── main.py                    # FastAPI service
│   └── orchestrator_agent.py      # Core logic
│
├── agents/
│   ├── __init__.py
│   ├── workflow-agent/
│   │   ├── __init__.py
│   │   ├── main.py                # FastAPI service
│   │   ├── agent.py               # WorkflowAgent class
│   │   └── tools/                 # Workflow-specific tools
│   ├── integration-agent/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agent.py
│   │   └── tools/
│   ├── compliance-agent/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agent.py
│   │   └── tools/
│   ├── content-agent/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── agent.py
│   │   └── tools/
│   └── config-agent/
│       ├── __init__.py
│       ├── main.py
│       ├── agent.py
│       └── tools/
│
└── common/
    ├── agents/
    │   ├── __init__.py
    │   └── base_agent.py          # BaseAgent class + Guardrails
    └── tools/
        ├── __init__.py
        └── base_tools.py          # KG, API, Audit wrappers
```

---

## Service URLs

| Agent | Port | URL | Health Check |
|-------|------|-----|--------------|
| Orchestrator | 8000 | `http://localhost:8000` | `/health` |
| Workflow | 8001 | `http://localhost:8001` | `/health` |
| Integration | 8002 | `http://localhost:8002` | `/health` |
| Compliance | 8003 | `http://localhost:8003` | `/health` |
| Content | 8004 | `http://localhost:8004` | `/health` |
| Configuration | 8005 | `http://localhost:8005` | `/health` |

---

## Running the Agents

### Start Individual Services

```bash
# Orchestrator Agent
python backend/agent_orchestrator/main.py

# Workflow Agent
python backend/agents/workflow_agent/main.py

# Integration Agent
python backend/agents/integration_agent/main.py

# Compliance Agent
python backend/agents/compliance_agent/main.py

# Content Agent
python backend/agents/content_agent/main.py

# Configuration Agent
python backend/agents/config_agent/main.py
```

### Environment Variables

```bash
# Common
KG_API_URL=http://localhost:8080/api/graph
AUDIT_API_URL=http://localhost:8080/api/audit

# Service URLs (for Orchestrator to discover agents)
WORKFLOW_AGENT_URL=http://localhost:8001
INTEGRATION_AGENT_URL=http://localhost:8002
COMPLIANCE_AGENT_URL=http://localhost:8003
CONTENT_AGENT_URL=http://localhost:8004
CONFIG_AGENT_URL=http://localhost:8005

# Agent-specific
WORKFLOW_API_URL=http://localhost:8001
INTEGRATION_API_URL=http://localhost:8002
POLICY_API_URL=http://localhost:8003
CONTENT_API_URL=http://localhost:8004
CONFIG_API_URL=http://localhost:8005
```

---

## API Examples

### Orchestrator: Process a Goal

```bash
curl -X POST http://localhost:8000/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Keep invoice processing SLA above 99%",
    "context": {}
  }'
```

Response:
```json
{
  "graph_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "results": {
    "task_1": {...},
    "task_2": {...}
  }
}
```

### Workflow Agent: Analyze Workflows

```bash
curl -X POST http://localhost:8001/analyze \
  -H "Content-Type: application/json" \
  -d '{"goal": "Reduce invoice processing time"}'
```

### Compliance Agent: Evaluate Plan

```bash
curl -X POST http://localhost:8003/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Disable old connector",
    "details": {"connector_id": "old_erp"}
  }'
```

---

## Next Steps: Autonomy Engine Flows

After the multi-agent architecture is implemented, the next phase is the **Autonomy Engine** which plugs these agents into **self-healing scenarios**:

- **Detection** → Monitoring discovers issues
- **Diagnosis** → Agents analyze root cause
- **Plan** → Agents propose solutions
- **Act** → Agents execute (with approvals)
- **Learn** → System records outcomes

See `AUTONOMY_ENGINE.md` for details on self-healing flows.
