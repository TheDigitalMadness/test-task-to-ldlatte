from domain.response.auth import SigninResponse, SignupResponse
from pkg.jwt.jwt import create_token
from pkg.crypto.password import verify_password, hash_password
from repository.user import UserRepository


class AuthService:
    userRepo: UserRepository

    def __init__(self, userRepo: UserRepository):
        self.userRepo = userRepo

    async def signin(self, login: str, password: str) -> SigninResponse:
        user = await self.userRepo.get_user_by_login(login)
        if user is None or not verify_password(password, user.hash):
            raise ValueError("Bad credentials")

        token = create_token(user.id)

        return SigninResponse(
            id=user.id,
            username=user.username,
            login=user.login,
            fullName=user.fullName,
            token=token
        )

    async def signup(self, login: str, password: str, username: str, fullName: str) -> SignupResponse:
        hash = hash_password(password)
        user = await self.userRepo.create_user(login, hash, username, fullName)

        token = create_token(user.id)

        return SignupResponse(
            id=user.id,
            username=user.username,
            login=user.login,
            fullName=user.fullName,
            token=token
        )
