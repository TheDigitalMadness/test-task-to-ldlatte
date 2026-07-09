from pydantic import BaseModel

class UserResponse(BaseModel):
    id: int
    login: str
    username: str
    fullName: str