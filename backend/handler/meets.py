from fastapi import APIRouter, Depends, status, HTTPException

from domain.request.meets import CreateMeetRequest
from domain.response.meets import MeetResponse, CreateMeetSuccessResponse
from handler.dependencies import get_user, get_meets_service
from models.user import User
from service.meets import MeetsService

router = APIRouter(prefix="/meets", tags=["Meets"])

@router.get("/", response_model=list[MeetResponse])
async def get_all(user: User = Depends(get_user), service: MeetsService = Depends(get_meets_service)) -> list[MeetResponse]:
    return await service.get_all()


@router.post("/", response_model=CreateMeetSuccessResponse, status_code=status.HTTP_201_CREATED)
async def create(data: CreateMeetRequest, user: User = Depends(get_user), service: MeetsService = Depends(get_meets_service)):
    topic = data.topic
    participantIds = data.participantIds
    date = data.date

    resp = await service.create(
        user=user,
        topic=topic,
        participantIds=participantIds,
        meet_date=date
    )

    if type(resp) == CreateMeetSuccessResponse:
        return resp
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=resp.model_dump()
        )
