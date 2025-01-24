import uuid
from datetime import datetime, UTC
import re

import aiohttp


from fastapi import APIRouter, Response, Depends, BackgroundTasks

from fastapi.responses import RedirectResponse

from backend.sessions.dao import SessionsDAO

from backend.users.dao import UsersDAO, Users
from backend.users.exceptions import (PasswordIncorrect,
                                      UserAlreadyExists,
                                      LoginError,
                                      UserIsNotverified,
                                      )

from backend.users.schemas import SUserSignup, SUserLogin
from backend.config import settings
from backend.users.dependencies import (get_password_hash,
                                        auth_user,
                                        create_access_token,
                                        get_current_user,
                                        send_email)

auth_router = APIRouter()


@auth_router.get('/my_profile')
async def my_profile(user: Users = Depends(get_current_user)):
    response_data = {
        'user_id': user.id,
        'sessions': []
    }

    user_session_tracks = await SessionsDAO.find_all_session_and_tracks_by_user_id(user.id)

    for session, track in user_session_tracks:
        response_data['sessions'].append({
            'id': session.id,
            'created_date': session.created_date.strftime("%d.%m.%Y %H:%M"),
            'artist_name': track.artist_name,
            'title': track.title,
        })

    return response_data


@auth_router.get('/check_user_verification')
async def check_user(user: Users = Depends(get_current_user)):
    if user.is_verified:
        return {}
    raise UserIsNotverified


@auth_router.get('/verify_user/{uuid_email_verifying}')
async def verify_user(uuid_email_verifying):
    user: Users = await UsersDAO.find_one_or_none(Users.uuid_email_verifying == uuid_email_verifying)
    redirect = f'http://{settings.DOMEN_ADDRESS}:{settings.FRONTEND_PORT}/profile?'

    if not user:
        # Если пользователь не найден, возвращаем JSON с email_verified: false
        return RedirectResponse(redirect + 'email_verified=false', status_code=404)

    await UsersDAO.patch(user, is_verified=True)

    # Если пользователь найден и успешно подтверждён, возвращаем JSON с email_verified: true и URL для перенаправления
    return RedirectResponse(redirect + 'email_verified=true', status_code=307)


# user1@example.com
# stringstwwWww123
@auth_router.post("/login")
async def login(response: Response, user: SUserLogin):
    user = await auth_user(user.email, user.password)
    if not user:
        raise LoginError

    jwt_token = await create_access_token({"sub": str(user.id)})
    response.set_cookie(settings.AUTH_TOKEN_TITLE,
                        jwt_token,
                        httponly=True,
                        expires=datetime.now(UTC) + settings.AUTH_TOKEN_LIVE_TIME)


@auth_router.get("/logout")
async def logout(response: Response):
    response.delete_cookie(settings.AUTH_TOKEN_TITLE)


@auth_router.post("/signup")
async def signup(response: Response, user: SUserSignup, background_tasks: BackgroundTasks):
    print('123')
    if not await UsersDAO.find_one_or_none(Users.email == user.email):
        print('123123')
        if not re.match(r"^(?=.*[A-Z])(?=.*\d)[A-Za-z\d\W_]{8,}$", user.password):
            print('1233344')
            raise PasswordIncorrect

        hashed_password = await get_password_hash(user.password)
        uuid_email_verifying = str(uuid.uuid4())

        print('123')

        new_user = await UsersDAO.create(
            email=user.email,
            password=hashed_password,
            created_date=datetime.now(UTC),
            nickname=user.nickname,
            is_verified=False,
            uuid_email_verifying=uuid_email_verifying
        )

        background_tasks.add_task(send_email, user.email, user.nickname, uuid_email_verifying)

        jwt_token = await create_access_token({"sub": str(new_user.id)})
        response.set_cookie(settings.AUTH_TOKEN_TITLE,
                            jwt_token,
                            httponly=True,
                            expires=datetime.now(UTC) + settings.AUTH_TOKEN_LIVE_TIME)
    else:
        raise UserAlreadyExists


@auth_router.get("/auth/google/callback")
async def google_callback(response: Response, code: str, background_tasks: BackgroundTasks):
    async with aiohttp.ClientSession() as session:
        data = {
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': settings.GOOGLE_REDIRECT_URI,
            'code': code,
            'grant_type': 'authorization_code',
        }
        async with session.post(settings.GOOGLE_TOKEN_URL, data=data) as token_response:
            token_data = await token_response.json()

            try:
                access_token = token_data["access_token"]
            except KeyError:
                return RedirectResponse(f'http://{settings.DOMEN_ADDRESS}:{settings.FRONTEND_PORT}/profile')

            headers = {
                'Authorization': f'Bearer {access_token}',
            }

        async with session.get(settings.GOOGLE_USERINFO_URL, headers=headers) as user_info_response:
            user_info = await user_info_response.json()

    # Обрабатываем данные
    new_user: Users = await UsersDAO.find_one_or_none(Users.email == user_info['email'])

    if not new_user:
        if user_info['verified_email']:
            is_verified = True
            uuid_email_verifying = None
        else:
            is_verified = False
            uuid_email_verifying = str(uuid.uuid4())
            background_tasks.add_task(send_email, user_info['email'], None, uuid_email_verifying)

        new_user: Users = await UsersDAO.create(
            email=user_info['email'],
            created_date=datetime.now(UTC),
            is_verified=is_verified,
            uuid_email_verifying=uuid_email_verifying
        )

    jwt_token = await create_access_token({"sub": str(new_user.id)})
    response = RedirectResponse(f'http://{settings.DOMEN_ADDRESS}:{settings.FRONTEND_PORT}/profile')
    response.set_cookie(settings.AUTH_TOKEN_TITLE,
                        jwt_token,
                        httponly=True,
                        expires=datetime.now(UTC) + settings.AUTH_TOKEN_LIVE_TIME)
    return response
