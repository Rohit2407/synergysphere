from typing import Dict, Set, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # project_id -> { (websocket, channel_id) }
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Keep track of which project each websocket is in
        self.websocket_to_project: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

    def disconnect(self, websocket: WebSocket):
        project_id = self.websocket_to_project.get(websocket)
        if project_id and project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        if websocket in self.websocket_to_project:
            del self.websocket_to_project[websocket]

    def join_project(self, websocket: WebSocket, project_id: str):
        # Remove from old project if any
        self.disconnect(websocket)
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        self.active_connections[project_id].add(websocket)
        self.websocket_to_project[websocket] = project_id

    async def broadcast_to_project(self, project_id: str, message: dict):
        if project_id in self.active_connections:
            # We filter by channel if needed inside the message data
            # For now, broadcast to all in project, frontend filters or re-fetches
            websockets = self.active_connections[project_id]
            for websocket in list(websockets):
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    # Connection might be closed
                    self.disconnect(websocket)

manager = ConnectionManager()
