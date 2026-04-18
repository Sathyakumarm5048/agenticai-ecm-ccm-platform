"""
API Gateway Service - routes incoming requests to platform backend services.
"""
import json
import logging
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, Any, Optional

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Platform API Gateway",
    description="Gateway and service routing layer for the AgenticAI platform.",
    version="1.0.0"
)

SERVICE_REGISTRY: Dict[str, str] = {
    "orchestrator": os.getenv("ORCHESTRATOR_AGENT_URL", "http://localhost:8000"),
    "workflow": os.getenv("WORKFLOW_AGENT_URL", "http://localhost:8001"),
    "integration": os.getenv("INTEGRATION_AGENT_URL", "http://localhost:8002"),
    "compliance": os.getenv("COMPLIANCE_AGENT_URL", "http://localhost:8003"),
    "content": os.getenv("CONTENT_AGENT_URL", "http://localhost:8004"),
    "config": os.getenv("CONFIG_AGENT_URL", "http://localhost:8005"),
    "autonomy": os.getenv("AUTONOMY_ENGINE_URL", "http://localhost:8006"),
    "knowledge_graph": os.getenv("KG_API_URL", "http://localhost:8080/api/graph"),
    "audit": os.getenv("AUDIT_API_URL", "http://localhost:8080/api/audit"),
    "event_ingestion": os.getenv("EVENT_INGESTION_URL", "http://localhost:8010")
}

class ServiceRegistrationRequest(BaseModel):
    name: str
    url: str


class ProxyResponse(BaseModel):
    status_code: int
    content: Any
    headers: Dict[str, str]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "api-gateway"}


@app.get("/services")
async def list_services():
    return {"services": SERVICE_REGISTRY}


@app.get("/services/{service_name}")
async def get_service(service_name: str):
    if service_name not in SERVICE_REGISTRY:
        raise HTTPException(status_code=404, detail="Service not registered")
    return {"service": service_name, "url": SERVICE_REGISTRY[service_name]}


@app.post("/services/register")
async def register_service(request: ServiceRegistrationRequest):
    SERVICE_REGISTRY[request.name] = request.url
    logger.info(f"Registered service {request.name} -> {request.url}")
    return {"registered": True, "service": request.name, "url": request.url}


@app.get("/status")
def platform_status():
    status: Dict[str, Any] = {}
    for name, url in SERVICE_REGISTRY.items():
        health_url = f"{url.rstrip('/')}/health"
        try:
            request_obj = urllib.request.Request(health_url, method="GET")
            with urllib.request.urlopen(request_obj, timeout=10) as response:
                content_bytes = response.read()
                content_type = response.headers.get("content-type", "")
                payload = json.loads(content_bytes.decode("utf-8")) if "application/json" in content_type else content_bytes.decode("utf-8")
                status[name] = {
                    "status": payload,
                    "reachable": response.status == 200,
                    "url": url
                }
        except Exception as exc:
            status[name] = {"status": str(exc), "reachable": False, "url": url}
    return {"platform_status": status}


@app.api_route("/route/{service_name}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_request(service_name: str, path: str, request: Request):
    if service_name not in SERVICE_REGISTRY:
        raise HTTPException(status_code=404, detail="Service not registered")

    target_url = f"{SERVICE_REGISTRY[service_name].rstrip('/')}/{path}"
    query_string = request.url.query
    if query_string:
        target_url = f"{target_url}?{query_string}"

    body = await request.body()
    headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}

    try:
        req = urllib.request.Request(target_url, data=body if body else None, headers=headers, method=request.method)
        with urllib.request.urlopen(req, timeout=30) as response:
            content = response.read()
            response_headers = {k: v for k, v in response.headers.items() if k.lower() not in ["content-encoding", "transfer-encoding", "connection"]}
            return Response(content=content, status_code=response.status, headers=response_headers)
    except urllib.error.HTTPError as exc:
        logger.error(f"Proxy request failed for {service_name}: {exc}")
        content = exc.read()
        return Response(content=content, status_code=exc.code)
    except Exception as exc:
        logger.error(f"Proxy request failed for {service_name}: {exc}")
        raise HTTPException(status_code=502, detail=str(exc))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8008))
    uvicorn.run(app, host="0.0.0.0", port=port)
