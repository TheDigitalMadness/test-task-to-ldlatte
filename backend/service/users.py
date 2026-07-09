from domain.response.users import UserResponse
from repository.user import UserRepository


class UsersService:
    userRepo: UserRepository

    def __init__(self, userRepo: UserRepository):
        self.userRepo = userRepo

    async def get_all(self) -> list[UserResponse]:
        users = await self.userRepo.get_all()

        resp = [
            UserResponse(id=u.id, login=u.login, username=u.username, fullName=u.fullName)
            for u in users
        ]

        return resp