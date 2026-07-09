from datetime import datetime, date
import uuid

from pydantic import BaseModel, ConfigDict


class MeetUserResponse(BaseModel):
    id: uuid.UUID
    meet_id: uuid.UUID
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class MeetResponse(BaseModel):
    id: uuid.UUID
    topic: str
    date: date
    meet_users: list[MeetUserResponse]
    createdBy: int
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


class CreateMeetSuccessResponse(BaseModel):
    meet: MeetResponse


class CreateMeetErrorResponse(BaseModel):
    conflicts: list[uuid.UUID]