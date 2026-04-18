# Autonomy Engine - Self-Healing & Autonomous Remediation

## Overview

The Autonomy Engine is a self-healing system that detects issues, diagnoses root causes, plans remediation, executes solutions, and learns from outcomes. It implements the complete **Detection → Diagnosis → Plan → Act → Learn** loop for autonomous platform management.

## The Self-Healing Loop

```
┌─────────────┐
│  Detection  │  Monitors systems, detects anomalies and SLA violations
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Diagnosis   │  Root cause analysis using agents and knowledge graph
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Planning   │  Generate remediation plans with confidence scores
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Acting     │  Execute actions with approval gates and guardrails
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Learning   │  Track outcomes, improve recommendations
└─────────────┘
```

## Architecture

### Core Components

#### 1. **Detection System**
- Monitors metrics and system health
- Identifies anomalies against baselines
- Detects SLA violations
- Triggers incidents for investigation

**Monitored Signals:**
- Workflow performance metrics (latency, throughput, error rate)
- Connector health (availability, error rates)
- Configuration drift
- Resource utilization
- Compliance violations

#### 2. **Diagnosis Engine**
- Queries knowledge graph for context
- Invokes specialized agents (Workflow, Integration, Compliance, Content, Config)
- Performs root cause analysis
- Identifies contributing factors

**Example Diagnosis:**
```
Issue: Invoice processing P99 latency = 75.5s (target: 60s)
Root Cause: SharePoint connector health degradation
Contributing Factors:
  - Connector error rate = 15.2% (target: 5%)
  - Network latency increased 40%
  - Database query performance degraded
```

#### 3. **Planning Engine**
- Generates multiple remediation strategies
- Assigns confidence scores (0.0-1.0) to each plan
- Identifies actions needed
- Determines approval requirements
- Checks compliance

**Example Plan:**
```
Title: Remediate SLA violation through connector optimization
Confidence: 0.85 (85%)
Requires Approval: Yes (production change)
Actions:
  1. Optimize workflow with parallelization
  2. Tune connector timeouts and retries
  3. Scale connector resource pool
Estimated Impact: High
```

#### 4. **Action Executor**
- Executes remediation actions in sequence
- Respects guardrails and approval gates
- Collects metrics before/after
- Handles failures gracefully
- Logs all actions

**Execution Model:**
```
For each action in plan:
  1. Check guardrails (scope, approvals, compliance)
  2. Collect pre-execution metrics
  3. Execute action through appropriate agent
  4. Collect post-execution metrics
  5. Log result to audit trail
  6. Continue if success; escalate if failure
```

#### 5. **Learning System**
- Evaluates remediation outcomes
- Calculates success rates
- Extracts lessons learned
- Improves future recommendations
- Records feedback for knowledge graph

**Learning Outcomes:**
```
Loop: sla_remediation_loop_001
Incident: SLA violation in invoice processing
Resolution: Successful (metrics returned to normal)
Success Rate: 100% (3/3 actions succeeded)
Lesson: Connector parallelization is effective for latency issues
Confidence Improvement: 0.85 → 0.88
```

## Self-Healing Scenarios

### 1. SLA Violation Scenario

**Trigger:** Metric exceeds SLA threshold

**Detection:**
```
Metric: workflow.p99_latency = 75.5s (target: 60s)
Severity: High (25.9% over threshold)
```

**Diagnosis:**
- Root cause: Connector health degradation + network issues
- Contributing: Database performance, resource exhaustion

**Remediation Actions:**
1. Enable workflow parallelization (batch_size=10, parallelism=3)
2. Tune connector configs (timeout=8s, retry=3, backoff=2.0)
3. Scale connector resources (workers: 2 → 5)

**Expected Outcome:**
- P99 latency: 75.5s → 58.2s ✓
- Throughput: 42 → 52 items/min ✓
- Error rate: 8% → 2% ✓

---

### 2. Connector Health Scenario

**Trigger:** Connector error rate or availability degrades

**Detection:**
```
Metrics:
  - connector.error_rate = 15.2% (target: 5%)
  - connector.availability = 0.82 (target: 0.95)
```

**Diagnosis:**
- Root cause: OAuth token expiration + network connectivity
- Contributing: Resource exhaustion on connector service

**Remediation Actions:**
1. Refresh OAuth credentials
2. Restart connector service gracefully
3. Scale connector instances (1 → 3)

**Expected Outcome:**
- Error rate: 15.2% → 1.2% ✓
- Availability: 82% → 98% ✓
- Auth failures: 12 → 0 ✓

---

### 3. Workflow Bottleneck Scenario

**Trigger:** Workflow queue depth grows or step duration exceeds threshold

**Detection:**
```
Metrics:
  - queue_depth = 450 items (target: 100)
  - step_duration = 45.0s (target: 10.0s)
```

**Diagnosis:**
- Root cause: Manual verification step is synchronous bottleneck
- Contributing: No parallel processing, queue backlog

**Remediation Actions:**
1. Enable parallel batch processing (batch=5, parallelism=3)
2. Add timeout policy with auto-approval fallback (30s timeout)

**Expected Outcome:**
- Queue depth: 450 → 80 ✓
- Step duration: 45.0s → 12.0s ✓
- Processing backlog: eliminated ✓

---

### 4. Configuration Drift Scenario

**Trigger:** Configuration deviates from baseline

**Detection:**
```
Metrics:
  - config.drift_score = 0.35 (target: ≤0.15)
Deviated Settings:
  - connector.timeout: 10s → 15s (not approved)
  - connector.retry_count: 3 → 5 (not approved)
```

**Diagnosis:**
- Root cause: Manual configuration changes without documentation
- Contributing: No change tracking enabled

**Remediation Actions:**
1. Restore configuration to approved baseline (v1.2.0)

**Expected Outcome:**
- Drift score: 0.35 → 0.02 ✓
- Timeout: 15s → 10s ✓
- Retry count: 5 → 3 ✓

---

## SLA Management

### SLA Definition

```python
SLA(
    sla_id="sla_invoice_processing",
    name="Invoice Processing SLA",
    service_name="invoice-processing",
    targets=[
        SLATarget(
            metric_name="workflow.p99_latency",
            threshold=60.0,  # seconds
            unit="seconds",
            measurement_window="1h",
            penalty_percentage=5.0,
            escalation_threshold=0.8  # Warn at 80% of threshold
        ),
        SLATarget(
            metric_name="workflow.throughput",
            threshold=50.0,  # items/min
            unit="items/min",
            measurement_window="1h"
        ),
        SLATarget(
            metric_name="workflow.error_rate",
            threshold=1.0,  # 1%
            unit="percent",
            measurement_window="1h"
        )
    ]
)
```

### Pre-Defined SLAs

#### Invoice Processing SLA
- **P99 Latency:** ≤60 seconds (measurement: 1h)
- **Throughput:** ≥50 items/min (measurement: 1h)
- **Error Rate:** ≤1% (measurement: 1h)
- **Violation Penalty:** 5% service credit

#### Document Classification SLA
- **Classification Accuracy:** ≥95% (measurement: 24h)
- **Processing Time:** ≤5 seconds/item (measurement: 1h)
- **Connector Availability:** ≥99.5% (measurement: 24h)

#### Connector Integration SLA
- **Availability:** ≥99.9% (measurement: 24h, penalty: 10%)
- **Error Rate:** ≤0.1% (measurement: 1h, penalty: 5%)

### SLA Compliance Tracking

**SLA Status Levels:**
- 🟢 **HEALTHY** (≥95% compliance)
- 🟡 **WARNING** (80-95% compliance)
- 🔴 **VIOLATION** (<80% compliance)

**Escalation Triggers:**
- Critical violations (exceeded by >20%)
- Recurrent violations (>3 violations in a period)
- Multiple SLA targets breached simultaneously

### SLA Reporting

```json
{
  "report_id": "sla_report_20260414",
  "period": "2026-04-01 to 2026-04-30",
  "slas_evaluated": 3,
  "metrics_healthy": 8,
  "metrics_warning": 2,
  "metrics_violation": 1,
  "overall_compliance": "96.2%",
  "violations": [
    {
      "sla": "invoice_processing",
      "metric": "p99_latency",
      "exceeded_by": "18.3%",
      "frequency": 3,
      "auto_remediation_triggered": true
    }
  ],
  "escalations": [
    "Recurrent latency issues in invoice processing"
  ]
}
```

---

## Integration with Agent Architecture

### Detection → Diagnosis Flow

```
Autonomy Engine (Detection)
    │
    ├─ Detects SLA violation
    │
    ▼
Orchestrator Agent
    │
    ├─ Creates task graph
    │
    ├─ Invokes Workflow Agent → Analyze bottlenecks
    ├─ Invokes Integration Agent → Check connector health
    ├─ Invokes Content Agent → Analyze content patterns
    ├─ Invokes Compliance Agent → Validate changes
    └─ Invokes Config Agent → Propose optimizations
    │
    ▼
Autonomy Engine (Diagnosis)
    │
    ├─ Collects results
    ├─ Determines root cause
    └─ Generates remediation plan
```

### Action Execution Flow

```
Autonomy Engine (Acting)
    │
    ├─ Gets approval (if needed)
    │
    ├─ Executes action 1: optimize_workflow
    │   └─ Invokes Workflow Agent
    │
    ├─ Executes action 2: tune_config
    │   └─ Invokes Config Agent
    │
    ├─ Executes action 3: scale_resources
    │   └─ Invokes Integration Agent
    │
    └─ Collects execution results
         │
         ▼
    Autonomy Engine (Learning)
         │
         ├─ Evaluates success
         ├─ Records metrics
         └─ Improves future recommendations
```

---

## API Endpoints

### Healing Loop Management

**Start a healing loop:**
```bash
POST /healing-loop
{
  "scenario_type": "sla_violation"
}

Response:
{
  "loop_id": "loop_550e8400...",
  "incident_id": "incident_abc123...",
  "status": "initiated",
  "phase": "detection"
}
```

**Get healing loop status:**
```bash
GET /healing-loop/{loop_id}

Response:
{
  "loop_id": "loop_550e8400...",
  "phase": "acting",
  "current_step": "Executing remediation",
  "is_successful": true,
  "start_time": "2026-04-14T10:30:00Z",
  "end_time": "2026-04-14T10:32:45Z"
}
```

### Incident Management

**List incidents:**
```bash
GET /incidents?scenario_type=sla_violation

Response:
{
  "total": 5,
  "incidents": [
    {
      "incident_id": "inc_...",
      "title": "Workflow SLA violation",
      "severity": "high",
      "detected_at": "2026-04-14T10:30:00Z",
      "is_resolved": true
    }
  ]
}
```

### SLA Management

**Update metric and check compliance:**
```bash
POST /metrics/update
{
  "sla_id": "sla_invoice_processing",
  "metric_name": "workflow.p99_latency",
  "current_value": 75.5,
  "unit": "seconds"
}

Response:
{
  "metric_name": "workflow.p99_latency",
  "current_value": 75.5,
  "target_value": 60.0,
  "compliance": 79.2,
  "status": "violation",
  "violation_detected": true,
  "violation": {
    "violation_id": "viol_...",
    "severity": "critical",
    "exceeded_by": "25.9%"
  }
}
```

**Get SLA compliance status:**
```bash
GET /sla/sla_invoice_processing/status

Response:
{
  "sla_id": "sla_invoice_processing",
  "sla_name": "Invoice Processing SLA",
  "overall_compliance": 94.3,
  "status": "healthy",
  "metrics": [
    {
      "name": "workflow.p99_latency",
      "current_value": 58.2,
      "target_value": 60.0,
      "compliance": 100.0,
      "metric_status": "healthy"
    }
  ]
}
```

**Get SLA violations:**
```bash
GET /sla/violations?sla_id=sla_invoice_processing&limit=10

Response:
{
  "total": 3,
  "violations": [
    {
      "violation_id": "viol_...",
      "metric_name": "workflow.p99_latency",
      "severity": "critical",
      "exceeded_by": "25.9%",
      "violation_time": "2026-04-14T10:30:00Z"
    }
  ]
}
```

### Reporting

**Generate SLA report:**
```bash
GET /reports

Response:
{
  "total": 1,
  "reports": [
    {
      "report_id": "sla_report_...",
      "period_start": "2026-04-01T00:00:00Z",
      "period_end": "2026-04-30T23:59:59Z",
      "overall_compliance": "96.2%",
      "violations": 3,
      "escalations": 1
    }
  ]
}
```

---

## Service Configuration

### Environment Variables

```bash
# Core
PORT=8006
ORCHESTRATOR_URL=http://localhost:8000
KG_API_URL=http://localhost:8080/api/graph

# Optional: Agent Service URLs
WORKFLOW_AGENT_URL=http://localhost:8001
INTEGRATION_AGENT_URL=http://localhost:8002
COMPLIANCE_AGENT_URL=http://localhost:8003
CONTENT_AGENT_URL=http://localhost:8004
CONFIG_AGENT_URL=http://localhost:8005
```

### Running the Service

```bash
python backend/autonomy_engine/main.py
```

The service runs on port 8006 by default.

---

## Learning & Continuous Improvement

### Learning Feedback Loop

```
1. Execute healing loop
   ├─ Record initial metrics
   ├─ Execute remediation
   └─ Record final metrics

2. Analyze outcomes
   ├─ Calculate success rate
   ├─ Measure metric improvement
   ├─ Evaluate resolution time

3. Extract lessons
   ├─ Identify effective actions
   ├─ Flag ineffective strategies
   ├─ Update confidence scores

4. Improve recommendations
   ├─ Increase confidence for successful patterns
   ├─ Decrease confidence for failed patterns
   ├─ Update knowledge graph
```

### Metrics for Improvement

- **Success Rate**: % of executed actions that succeeded
- **Resolution Time**: Time from detection to complete resolution
- **SLA Recovery**: Did metric return within SLA threshold?
- **Confidence Calibration**: Does confidence score match actual success?
- **Root Cause Accuracy**: Was diagnosed root cause correct?

---

## Monitoring & Alerting

### Health Checks

- Is autonomy engine responsive?
- Are scenario handlers registered?
- Can engine connect to knowledge graph?
- Are SLAs properly configured?

### Metrics to Monitor

- Number of active healing loops
- Detection accuracy (false positives/negatives)
- Average diagnosis time
- Average remediation time
- Success rate per scenario
- SLA compliance trends

### Alerts

- Critical incident detected
- High severity violation
- Repeated failed remediation attempts
- Unknown scenario type
- Knowledge graph connectivity loss

---

## Best Practices

1. **Define Clear SLAs**
   - Set realistic thresholds
   - Use appropriate measurement windows
   - Include escalation triggers

2. **Register Comprehensive Scenarios**
   - Cover common failure modes
   - Include pre/post validation checks
   - Handle edge cases

3. **Monitor Learning Outcomes**
   - Track success rates per scenario
   - Adjust confidence scores regularly
   - Review escalations

4. **Maintain Guardrails**
   - Set approval requirements for critical actions
   - Ensure compliance checks
   - Log all actions for audit

5. **Continuous Improvement**
   - Review completed loops regularly
   - Update remediation strategies based on outcomes
   - Expand scenario coverage

---

## Future Enhancements

- Multi-loop coordination (handling cascading issues)
- Predictive remediation (fix before SLA violation)
- Anomaly detection ML models
- Custom scenario builder UI
- Simulation and testing framework
- Integration with external monitoring systems
- Human-in-the-loop approval workflows
- Cost-aware remediation planning
