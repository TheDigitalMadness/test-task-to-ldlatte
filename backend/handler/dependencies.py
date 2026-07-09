from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from domain.response.error import UnauthorizedErrorResponse
from repository.meet import MeetRepository
from repository.user import UserRepository
from service.auth import AuthService
from service.meets import MeetsService
from service.users import UsersService
from models.user import User
from pkg.jwt.jwt import decode_token

bearer_scheme = HTTPBearer()

async def get_user(
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
        session: AsyncSession = Depends(get_db, use_cache=False)
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=UnauthorizedErrorResponse(message="Authorization required").model_dump()
        )

    user = await UserRepository(session).get_by_id(payload["id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=UnauthorizedErrorResponse(message="User not found").model_dump()
        )

    return user


def get_auth_service(session: AsyncSession = Depends(get_db, use_cache=False)) -> AuthService:
    userRepo = UserRepository(session)
    return AuthService(userRepo)

def get_users_service(session: AsyncSession = Depends(get_db, use_cache=False)) -> UsersService:
    userRepo = UserRepository(session)
    return UsersService(userRepo)

def get_meets_service(session: AsyncSession = Depends(get_db, use_cache=False)) -> MeetsService:
    meetRepo = MeetRepository(session)
    return MeetsService(meetRepo)