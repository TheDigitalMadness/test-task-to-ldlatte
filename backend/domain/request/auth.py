from pydantic import BaseModel, Field


class SigninRequest(BaseModel):
    login: str = Field(..., min_length=3)
    password: str = Field(..., min_length=3)

class SignupRequest(BaseModel):
    login: str = Field(..., min_length=3)
    password: str = Field(..., min_length=3)
    username: str = Field(..., min_length=3)
    fullName: str = Field(..., min_length=3)