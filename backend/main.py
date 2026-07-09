import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

from handler.auth import router as auth_router
from handler.users import router as users_router
from handler.meets import router as meets_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("app")

@asynccontextmanager
async def lifespan(app_: FastAPI):
    logger.info("Starts serving")
    yield
    logger.info("Ends serving")

app = FastAPI(
    title="Meetings API",
    servers=[{ "url": "/api"}],
    docs_url="/swagger",
    lifespan=lifespan
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(meets_router)