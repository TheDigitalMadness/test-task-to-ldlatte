from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from models.meet import Meet, MeetUser


class MeetRepository:
    session: AsyncSession

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[Meet]:
        result = await self.session.execute(
            select(Meet)
            .options(
                selectinload(Meet.meet_users)
            )
        )

        return list(result.scalars().fetchall())

    async def create_meet_with_users(self, topic: str, meet_date: date, createdBy: int, user_ids: list[int]) -> Meet:
        async with self.session.begin():
            try:
                meet = Meet(
                    topic=topic,
                    date=meet_date,
                    createdBy=createdBy,
                    meet_users=[]
                )
                self.session.add(meet)

                for user_id in user_ids:
                    meet.meet_users.append(
                        MeetUser(user_id=user_id, date=meet_date)
                    )

                await self.session.flush()

                return meet

            except IntegrityError as e:
                raise ValueError("Some users already registered on date") from e

    async def get_meet_users_by_ids_and_date(self, user_ids: list[int], meet_date: date) -> list[MeetUser]:
        result = await self.session.execute(
            select(MeetUser)
            .where(
                MeetUser.user_id.in_(user_ids),
                MeetUser.date == meet_date
            )
        )

        return list(result.scalars().fetchall())