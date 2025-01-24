import asyncio
from datetime import datetime, UTC

import jwt
from jose import JWTError, jwt as jose_jwt
from passlib.context import CryptContext

from backend.sessions.models import Sessions
from backend.users.dao import UsersDAO
from backend.users.exceptions import (WrongAuthToken,
                                      DecodeAuthTokenError,
                                      ExpiredAuthToken,
                                      MissingUserOnAuthToken,
                                      MissingAuthToken,
                                      )
from backend.users.models import Users

from fastapi import Request, Depends

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from backend.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


async def get_password_hash(password):
    return pwd_context.hash(password)


async def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


async def auth_user(user_email: str, user_psw: str) -> None | Users:
    user: Users = await UsersDAO.find_one_or_none(Users.email == user_email)
    if user and await verify_password(user_psw, user.password):
        return user


async def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + settings.AUTH_TOKEN_LIVE_TIME
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.AUTH_TOKEN_SECRET_KEY, settings.AUTH_TOKEN_ALGORITHM
    )
    return encoded_jwt


async def get_jwt_token(request: Request):
    token = request.cookies.get(settings.AUTH_TOKEN_TITLE)
    if not token:
        raise MissingAuthToken
    return token


async def get_current_user(token: str = Depends(get_jwt_token)):
    """ Получение пользователя """

    try:
        payload = jose_jwt.decode(
            token, settings.AUTH_TOKEN_SECRET_KEY, settings.AUTH_TOKEN_ALGORITHM
        )
    except JWTError as e:
        raise DecodeAuthTokenError
    try:
        expire: str = payload.get('exp')
    except KeyError:
        raise WrongAuthToken
    if int(expire) < datetime.now(UTC).timestamp():
        raise ExpiredAuthToken
    try:
        user_id: str = payload.get('sub')
    except KeyError:
        raise WrongAuthToken
    user: Users = await UsersDAO.find_one_or_none(Users.id == int(user_id))
    if not user:
        raise MissingUserOnAuthToken
    return user


async def send_email(to_email, user_nickname, uuid_email_verifying):
    """ Отправление письма подтверждающего письма после регистрации  """

    # Настройки почты
    smtp_server = 'smtp.gmail.com'
    smtp_port = 587
    from_email = settings.POST_EMAIL
    password = settings.POST_PSW

    # Создание MIME-объекта
    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = f"Подтверждение регистрации на {settings.PROJECT_NAME}"

    confirmation_link = f'http://{settings.DOMEN_ADDRESS}:{settings.BACKEND_PORT}/verify_user/{uuid_email_verifying}'
    template = settings.JINJA_TEMPLATES.get_template('email_verify.html')
    body = template.render(username=user_nickname,
                           site_name=settings.PROJECT_NAME,
                           confirmation_link=confirmation_link)

    # Добавление текста сообщения
    msg.attach(MIMEText(body, 'html'))

    try:
        # Установление соединения с SMTP-сервером
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Безопасное соединение
        server.login(from_email, password)  # Вход в аккаунт
        server.send_message(msg)  # Отправка сообщения
        print("Email отправлен успешно!")
    except Exception as e:
        print(f"Ошибка при отправке email: {e}")
    finally:
        server.quit()  # Закрытие соединения


async def get_users_points():
    """ Считаем все очки всех пользователей и сортируем по уменьшению, формируя лидерборд

    Формула подсчета: valid_points * 1 + revealed_points * 0.9
    """
    all_users_sessions: [(Users, Sessions), ] = await UsersDAO.get_users_sessions()
    all_points_data = {}
    for user, session in all_users_sessions:
        all_points_data[user.nickname] = (all_points_data.setdefault(user.nickname, 0) +
                                          session.valid_points +
                                          session.revealed_points * 0.9)
    all_points_data = dict(sorted(list(all_points_data.items()), key=lambda x: x[1], reverse=True))
    return all_points_data

if __name__ == '__main__':
    # Пример использования функции
    # send_email('soholer374@evasud.com', 'Тема письма', 'Дурачек')

    async def as_try():
        print(await get_users_points())

    asyncio.run(as_try())