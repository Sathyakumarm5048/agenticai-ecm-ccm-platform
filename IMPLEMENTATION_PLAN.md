# Implementation Plan for Full Platform Architecture

## Current Project Coverage

The repository currently implements a strong backend prototype with the following working layers:

- **Agentic Intelligence Layer**
  - `backend/agent_orchestrator/` → orchestrator service with task graph, agent registration, and orchestration endpoints
  - `backend/agents/` → five specialized agents: workflow, integration, compliance, content, config
  - `backend/knowledge-graph-api/` → knowledge graph API service layer
  - `backend/common/` → shared tools, models, audit, and knowledge graph clients

- **Autonomy & Orchestration Layer**
  - `backend/autonomy_engine/` → DDPAL self-healing engine, SLA manager, healing loop API
  - `backend/agents/compliance_agent/` → policy evaluation and audit enforcement

- **Integration & Abstraction Layer**
  - `docs/canonical-model/` → canonical model documents
  - `connectors/sharepoint-connector/` → one connector adapter implementation

- **Platform & Infrastructure Layer**
  - `infrastructure/docker/` → Docker Compose for Neo4j, PostgreSQL, Redis, Kafka, MinIO
  - Audit logging support in `backend/common/tools/base_tools.py`
  - Metrics/SLA tracking in autonomy-engine

## Missing and Partial Components

The following planned architecture elements are not yet fully implemented or are only placeholder-level:

- **Experience Layer**
  - No UI applications remain in the repo (`frontend/` folder removed)
  - No dedicated external public API gateway, GraphQL layer, or webhook/SDK support

- **LLM Gateway**
  - Present only as implementation comments/stubs in orchestrator and base agent classes
  - No real LLM integration service or model pipeline

- **Event Ingestion / Normalization**
  - No active `backend/event-ingestion/` or `backend/event-normalizer/` service code

- **Event Correlation / Rules Engine**
  - No explicit rules engine or correlation service implementation currently present

- **Workflow Orchestrator**
  - No separate workflow orchestrator service beyond agent orchestration logic

- **Connector Manager / Connector Runtimes**
  - Only SharePoint connector adapter exists
  - Other runtime connector adapters are not implemented

- **Security & Tenancy Abstraction**
  - No explicit identity provider, tenant management, or RBAC service layer

- **API Gateway / Ingress**
  - No dedicated API gateway or ingress orchestration service

## Prioritized Implementation Roadmap

### Phase 1: Stabilize Core Backend and Integration

1. **Wire existing FastAPI services into a single platform API gateway**
   - Build a lightweight gateway service that routes requests to:
     - `backend/agent_orchestrator/main.py`
     - `backend/autonomy_engine/main.py`
     - agent services
     - `backend/knowledge-graph-api`
   - Add a unified `/health` endpoint, `/status`, and service discovery metadata.

2. **Integrate the autonomy engine with the orchestrator and agents**
   - Ensure the autonomy engine can call orchestrator endpoints when diagnosing and executing remediation.
   - Confirm agent registration and tool invocation flows are end-to-end.

3. **Complete Knowledge Graph API integration**
   - Add explicit KG API endpoints for `query`, `write`, and `relationship` operations if still missing.
   - Connect agents and autonomy engine to the KG API client.

### Phase 2: Implement Event Ingestion, Normalization, and Correlation

4. **Create `event-ingestion` service**
   - Ingest events from connectors, workflow systems, and external sources.
   - Normalize events to canonical event schema models under `backend/common/models/canonical/events.py`.
   - Output normalized events to Kafka or an internal event queue.

5. **Create `event-normalizer` / correlation service**
   - Consume normalized events.
   - Correlate event patterns, enriched context, and incident triggers.
   - Emit events into the autonomy engine or agent orchestration pipeline.

6. **Add a simple rules engine**
   - Define rule sets for event-to-incident mapping, SLA thresholds, and auto-remediation triggers.
   - Implement as a standalone service or library used by the ingestion/correlation pipeline.

### Phase 3: Add Experience Layer and Public APIs

7. **Create experience layer skeleton**
   - Re-add UI apps for `Ops Console`, `Design Studio`, and a simple `Copilot` interface.
   - Use minimal React/Vite scaffolding and connect to the platform gateway APIs.

8. **Build public API surface**
   - Expose REST/GraphQL endpoints for user-facing operations and agent interactions.
   - Add webhook endpoints for external event sources.
   - Provide SDK stubs or API clients for Python/JS if needed.

### Phase 4: Enable LLM Gateway and Agent Runtime Intelligence

9. **Implement LLM gateway service**
   - Build a service that accepts agent prompts and optionally routes to OpenAI / Azure / local model API.
   - Add prompt templates and system prompt management.

10. **Enhance agent runtime with LLM-backed reasoning**
    - Replace the orchestrator stub comments with actual LLM call integration.
    - Add tool invocation and response handling in each agent runtime.

### Phase 5: Expand Connector Manager and Security

11. **Build connector manager**
    - Add a `backend/connector-manager/` service that registers connectors and monitors runtime health.
    - Implement support for connector lifecycle (deploy, update, disable).

12. **Add more connector runtime adapters**
    - Recreate templates for `exstream`, `file-net`, and any other ECM/CCM adapters.
    - Ensure `sharepoint-connector` is production-ready and can be extended.

13. **Add identity, access, and tenancy**
    - Add authentication/authorization to gateway and service endpoints.
    - Implement tenant scoping in agents, policy evaluation, and KG access.

### Phase 6: Platform Harden and Observe

14. **Add logging, metrics, tracing, and audit**
    - Standardize logging across FastAPI services.
    - Emit metrics for health, agent actions, SLA violations, and autonomy loop success.
    - Add audit event persistence for actions and policy decisions.

15. **Add scheduler/event bus support**
    - Use Kafka for event bus and message-driven service integration.
    - Add scheduler support for periodic drift checks, SLA polling, and learning loops.

16. **Add container orchestration and ingress support**
    - Extend `infrastructure/docker` to support the new services.
    - Add Helm/Kubernetes definitions under `infrastructure/k8s` once ready.

## Recommended First Deliverables

1. `backend/platform-gateway/` or `backend/api-gateway/`
   - Route and aggregate existing backend services.
   - Expose unified API surface and health.

2. `backend/event-ingestion/`
   - Ingest and normalize external events into canonical models.

3. `backend/event-normalizer/` or `backend/event-correlation/`
   - Correlate events and trigger autonomy incidents.

4. `backend/llm-gateway/`
   - Provide real model integration for the orchestrator and agents.

5. `frontend/ops-console/` and `frontend/design-studio/`
   - Basic UI to interact with the platform and autonomy loops.

## Action Plan for Next Step

I will now create a concise `IMPLEMENTATION_PLAN.md` file in the repository with this roadmap so it is visible and actionable.

If you want, I can also generate the first scaffold for `backend/api-gateway/` and `backend/event-ingestion/` in the next step.