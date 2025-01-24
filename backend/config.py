from datetime import timedelta
from pathlib import Path
from typing import Literal
import os
from fastapi.templating import Jinja2Templates

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent / ".env"),
        # env_file=str(Path(__file__).parent.absolute() / "backend" / ".env"),
        env_prefix="TEST_" if os.getenv("MODE") == 'TEST' else "",
        case_sensitive=False,
        extra='ignore',
    )

    MODE: Literal["DEV", "TEST", "PROD"]

    # ------------ БД
    DB_HOST: str
    DB_PORT: int
    DB_USER: str
    DB_PASS: str
    DB_NAME: str

    def get_database_url(self, sync=False):
        url_begin = 'postgresql+asyncpg' if not sync else 'postgresql'
        return (
            f'{url_begin}://{self.DB_USER}:'
            f'{self.DB_PASS}@'
            f'{self.DB_HOST}:'
            f'{self.DB_PORT}/'
            f'{self.DB_NAME}'
        )

    POST_EMAIL: str
    POST_PSW: str

    DOMEN_ADDRESS: str = 'localhost'
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 5173
    PROJECT_NAME: str = 'Soundlingo'

    # App settings
    SESSION_DURATION: int = 3600  # Длительность сесси в секундах
    MP3_FOLDER: Path = Path(__file__).parent.parent.absolute() / "frontend" / "public" / "songs"
    MP3_FOLDER_FOR_FRONT: str = "public/songs"

    JINJA_TEMPLATES: Jinja2Templates = Jinja2Templates(directory=Path(__file__).parent / "templates")

    # Inside auth
    AUTH_TOKEN_TITLE: str
    AUTH_TOKEN_LIVE_TIME: timedelta = timedelta(minutes=60 * 24 * 7)  # 7 Days
    AUTH_TOKEN_SECRET_KEY: str
    AUTH_TOKEN_ALGORITHM: str

    # Google auth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    GOOGLE_TOKEN_URL: str
    GOOGLE_USERINFO_URL: str

    # Sound
    YM_TOKEN: str
    GENIUS_TOKEN: str
    SPOTIFY_CLIENT_ID: str
    SPOTIFY_CLIENT_SECRET: str

    # AWS
    CLOUDFRONT_DOMAIN: str
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_ENDPOINT_URL: str
    S3_BUCKET_NAME: str


settings = Settings()
