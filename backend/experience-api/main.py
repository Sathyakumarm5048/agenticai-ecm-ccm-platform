from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import content, workflows, connectors, systems, policies, agents, autonomy, events
from graphql.schema import graphql_app  # ASGI app

app = FastAPI(title="Agentic AI ECM/CCM Experience API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(content.router, prefix="/content", tags=["content"])
app.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
app.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
app.include_router(systems.router, prefix="/systems", tags=["systems"])
app.include_router(policies.router, prefix="/policies", tags=["policies"])
app.include_router(agents.router, prefix="/agents", tags=["agents"])
app.include_router(autonomy.router, prefix="/autonomy", tags=["autonomy"])
app.include_router(events.router, prefix="/events", tags=["events"])

# GraphQL endpoint
app.mount("/graphql", graphql_app)