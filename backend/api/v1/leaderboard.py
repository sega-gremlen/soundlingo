from fastapi import APIRouter

from backend.users.dependencies import get_users_points

leaderboard_router = APIRouter()


@leaderboard_router.get('/leaderboard')
async def get_leaderboard():
    return await get_users_points()
