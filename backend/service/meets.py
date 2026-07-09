from datetime import date

from domain.response.meets import MeetResponse, MeetUserResponse, CreateMeetSuccessResponse, CreateMeetErrorResponse
from models.meet import Meet
from repository.meet import MeetRepository
from models.user import User


def meet_to_response(meet: Meet) -> MeetResponse:
    return MeetResponse(
        id=meet.id,
        topic=meet.topic,
        date=meet.date,
        createdBy=meet.createdBy,
        createdAt=meet.createdAt,
        meet_users=[
            MeetUserResponse(
                id=meet_user.id,
                meet_id=meet_user.meet_id,
                user_id=meet_user.user_id
            )
            for meet_user in meet.meet_users
        ]
    )


class MeetsService:
    meetRepo: MeetRepository

    def __init__(self, meetRepo: MeetRepository):
        self.meetRepo = meetRepo

    async def get_all(self) -> list[MeetResponse]:
        meets = await self.meetRepo.get_all()

        resp = [meet_to_response(meet) for meet in meets]

        return resp

    async def create(self, user: User, topic: str, participantIds: list[int], meet_date: date) -> CreateMeetSuccessResponse | CreateMeetErrorResponse:
        try:
            meet = await self.meetRepo.create_meet_with_users(
                topic=topic,
                meet_date=meet_date,
                createdBy=user.id,
                user_ids=participantIds
            )

            resp = CreateMeetSuccessResponse(
                meet=meet_to_response(meet)
            )

            return resp
        except ValueError as e:
            conflicts = await self.meetRepo.get_meet_users_by_ids_and_date(participantIds, meet_date)

            resp = CreateMeetErrorResponse(
                conflicts=[meet_user.id for meet_user in conflicts]
            )

            return resp
