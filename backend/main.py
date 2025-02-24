from fastapi import FastAPI, WebSocket, WebSocketDisconnect

import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v1.profile import auth_router
from backend.api.v1.listening import practice_router
from backend.api.v1.leaderboard import leaderboard_router
from backend.config import settings
from typing import List
from fastapi.templating import Jinja2Templates

app = FastAPI()


# app.mount('/static',
#           StaticFiles(directory=settings.STATIC_PATH),
#           name='static')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Или укажите конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(practice_router)
app.include_router(leaderboard_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
