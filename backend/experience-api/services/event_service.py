# backend/experience-api/services/event_service.py

from typing import Dict, Any
from datetime import datetime

from backend.common.models.canonical.events import Event
# from kafka import KafkaProducer  # when you wire Kafka


def handle_incoming_event(payload: Dict[str, Any]) -> None:
    """
    Normalize external webhook payload into canonical Event
    and push to Kafka or autonomy engine.
    """
    event = Event(
        eventId=payload.get("id", f"evt-{datetime.utcnow().timestamp()}"),
        eventType=payload.get("type", "Unknown"),
        timestamp=datetime.utcnow(),
        source=payload.get("source", "external-webhook"),
        payload=payload,
        relatedId=payload.get("relatedId"),
    )

    # TODO: send to Kafka topic, e.g. "external.events"
    # producer.send("external.events", event.json().encode("utf-8"))
    pass