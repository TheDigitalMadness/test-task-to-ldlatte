from pydantic import BaseModel
from datetime import date


class CreateMeetRequest(BaseModel):
    topic: str
    participantIds: list[int]
    date: date