from sqlalchemy import select, insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User

class UserRepository:
    session: AsyncSession

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_user_by_login(self, login: str) -> User | None:
        result = await self.session.execute(
            select(User)
            .where(User.login == login)
        )

        return result.scalars().first()

    async def get_by_id(self, id: int) -> User | None:
        result = await self.session.execute(
            select(User)
            .where(User.id == id)
        )

        return result.scalars().first()

    async def get_all(self) -> list[User]:
        result = await self.session.execute(
            select(User)
        )

        return list(result.scalars().fetchall())

    async def create_user(self, login: str, hash: str, username: str, fullName: str) -> User:
        user = User(
            login=login,
            hash=hash,
            username=username,
            fullName=fullName
        )
        self.session.add(user)

        try:
            await self.session.flush()
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise ValueError("User with such login or username already exists")

        return user