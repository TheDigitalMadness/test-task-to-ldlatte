from fastapi import APIRouter, Depends

from domain.response.users import UserResponse
from handler.dependencies import get_users_service, get_user
from service.users import UsersService
from models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=list[UserResponse])
async def get_all(user: User = Depends(get_user), service: UsersService = Depends(get_users_service)) -> list[UserResponse]:
    return await service.get_all()