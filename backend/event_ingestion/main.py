"""
Event Ingestion Service - ingests raw events, normalizes them, and forwards critical alerts.
"""
import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel

from common.models.canonical.events import Event
from common.tools.base_tools import APIClient, AuditLogger, KnowledgeGraphClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Event Ingestion Service",
    description="Ingests raw events and normalizes them into the platform canonical model.",
    version="1.0.0"
)

RAW_EVENT_QUEUE: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
CANONICAL_EVENTS: List[Dict[str, Any]] = []

kg_client = KnowledgeGraphClient(os.getenv("KG_API_URL", "http://localhost:8080/api/graph"))
autonomy_client = APIClient(os.getenv("AUTONOMY_ENGINE_URL", "http://localhost:8006"))
audit_logger = AuditLogger(os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit"))


class RawEvent(BaseModel):
    source: str
    eventType: str
    payload: Optional[Dict[str, Any]] = None
    relatedId: Optional[str] = None
    timestamp: Optional[datetime] = None


class EventBatch(BaseModel):
    events: List[RawEvent]


async def process_events() -> None:
    """Worker loop that normalizes and persists raw events."""
    while True:
        raw = await RAW_EVENT_QUEUE.get()
        try:
            normalized = normalize_event(raw)
            CANONICAL_EVENTS.append(normalized)
            logger.info(f"Normalized event {normalized['eventId']} from {normalized['source']}")

            try:
                kg_client.write_entity("Event", normalized)
            except Exception as exc:
                logger.warning(f"Knowledge graph write failed: {exc}")

            if should_trigger_autonomy(normalized):
                try:
                    trigger_autonomy(normalized)
                except Exception as exc:
                    logger.error(f"Autonomy trigger failed: {exc}")

            audit_logger.log_event(
                agent_name="event-ingestion",
                action="ingest_event",
                target=normalized["eventId"],
                status="processed",
                details={"event_type": normalized["eventType"]}
            )
        except Exception as exc:
            logger.error(f"Failed to process event: {exc}")
        finally:
            RAW_EVENT_QUEUE.task_done()


def normalize_event(raw_event: Dict[str, Any]) -> Dict[str, Any]:
    event = RawEvent(**raw_event)
    event_id = str(uuid.uuid4())
    timestamp = event.timestamp or datetime.utcnow()
    canonical = {
        "eventId": event_id,
        "eventType": event.eventType,
        "timestamp": timestamp.isoformat(),
        "source": event.source,
        "payload": event.payload or {},
        "relatedId": event.relatedId,
        "normalizedAt": datetime.utcnow().isoformat()
    }
    if event.eventType.lower() == "workflow.failed":
        canonical["severity"] = "high"
    elif event.eventType.lower() == "connector.error":
        canonical["severity"] = "medium"
    elif event.eventType.lower() == "sla.violation":
        canonical["severity"] = "critical"
    else:
        canonical["severity"] = "low"
    return Event(**canonical).dict()


def should_trigger_autonomy(event: Dict[str, Any]) -> bool:
    return event.get("severity") in {"critical", "high"} or event.get("eventType", "").lower() == "sla.violation"


def trigger_autonomy(event: Dict[str, Any]) -> None:
    if event.get("eventType", "").lower() == "sla.violation":
        autonomy_client.post("/metrics/update", {
            "sla_id": event.get("relatedId", "sla_unknown"),
            "metric_name": "event.sla_violation",
            "current_value": event["payload"].get("value", 1),
            "unit": event["payload"].get("unit", "count"),
            "additional_info": event["payload"]
        })
        autonomy_client.post("/healing-loop", {"scenario_type": "sla_violation"})
    else:
        autonomy_client.post("/incidents", {
            "event_id": event["eventId"],
            "event_type": event["eventType"],
            "payload": event["payload"],
            "severity": event.get("severity")
        })


@app.on_event("startup")
async def startup_event():
    logger.info("Event Ingestion Service is starting")
    asyncio.create_task(process_events())


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "event-ingestion"}


@app.post("/events/raw")
async def ingest_event(raw_event: RawEvent, background_tasks: BackgroundTasks):
    await RAW_EVENT_QUEUE.put(raw_event.dict())
    logger.info(f"Received raw event: {raw_event.eventType}")
    return {"queued": True, "eventType": raw_event.eventType}


@app.post("/events/batch")
async def ingest_batch(batch: EventBatch):
    for event in batch.events:
        await RAW_EVENT_QUEUE.put(event.dict())
    return {"queued": len(batch.events)}


@app.get("/events")
async def list_canonical_events():
    return {"events": CANONICAL_EVENTS}


@app.get("/events/{event_id}")
async def get_event(event_id: str):
    for event in CANONICAL_EVENTS:
        if event["eventId"] == event_id:
            return event
    raise HTTPException(status_code=404, detail="Event not found")


@app.get("/events/correlate")
async def correlate_events():
    related = {}
    for event in CANONICAL_EVENTS:
        key = event.get("relatedId") or event.get("source")
        if key not in related:
            related[key] = []
        related[key].append(event["eventId"])
    return {"correlations": related}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8010))
    uvicorn.run(app, host="0.0.0.0", port=port)
