from typing import AsyncGenerator
import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from core.config import Settings, settings

logger = logging.getLogger("app")


def build_db_url(setting: Settings) -> str:
    return (
        "postgres+asyncpg"
        "://"
        f"{setting.DB_USER}:{setting.DB_PASSWORD}"
        "@"
        f"{setting.DB_HOST}:{setting.DB_PORT}"
        "/"
        f"{setting.DB_NAME}"
    )

engine = create_async_engine(build_db_url(settings), echo=False)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
        except Exception as e:
            logger.error("Error in DB session: %s", e, exc_info=True)
            await session.rollback()
            raise



class Base(DeclarativeBase):
    pass
