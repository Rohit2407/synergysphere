from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import users, projects, tasks, discussions
from .websocket_manager import manager
import json

# Create all tables in the database
models.Base.metadata.create_all(bind=engine)

try:
    from .migrate_project_roles import migrate_project_member_roles
    migrate_project_member_roles()
    print("Database role migration successful.")
except Exception as e:
    print(f"Role migration status: {e}")

try:
    from .migrate_messages import migrate_messages_table
    migrate_messages_table()
    print("Database message table migration successful.")
except Exception as e:
    print(f"Message migration status: {e}")

try:
    from .migrate_v2 import migrate_core_multi_tenancy
    migrate_core_multi_tenancy()
    print("Database multi-tenancy migration successful.")
except Exception as e:
    print(f"Multi-tenancy migration status: {e}")

app = FastAPI(title="SynergySphere API", redirect_slashes=False)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since you are deploying both React and React Native
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            if message.get("type") == "JOIN_PROJECT":
                project_id = str(message.get("projectId"))
                manager.join_project(websocket, project_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

app.include_router(users.router)
app.include_router(projects.router)
app.include_router(tasks.router)
app.include_router(discussions.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SynergySphere API"}
