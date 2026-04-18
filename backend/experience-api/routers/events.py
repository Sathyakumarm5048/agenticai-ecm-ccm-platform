from fastapi import APIRouter, Request, status
from services.event_service import handle_incoming_event

router = APIRouter()

@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def webhook(request: Request):
    payload = await request.json()
    handle_incoming_event(payload)
    return {"status": "accepted"}