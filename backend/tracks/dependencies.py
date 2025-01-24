import asyncio
from contextlib import asynccontextmanager

from aiobotocore.session import get_session

from backend.config import settings


class S3Client:
    config = {
        "aws_access_key_id": settings.S3_ACCESS_KEY,
        "aws_secret_access_key": settings.S3_SECRET_KEY,
        "endpoint_url": settings.S3_ENDPOINT_URL,
    }
    bucket_name = settings.S3_BUCKET_NAME
    session = get_session()

    @classmethod
    @asynccontextmanager
    async def get_client(cls):
        async with cls.session.create_client("s3", **cls.config) as s3_client:
            yield s3_client

    @classmethod
    async def upload(cls, file_name, file_path):
        async with cls.get_client() as client:
            with open(file_path, "rb") as file:
                await client.put_object(
                    Bucket=cls.bucket_name,
                    Key=file_name,
                    Body=file
                )
