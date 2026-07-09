from pydantic import BaseModel, ConfigDict


class BadCredentialsErrorResponse(BaseModel):
    message: str

class UserAlreadyExistsErrorResponse(BaseModel):
    message: str

class SigninResponse(BaseModel):
    id: int
    username: str
    login: str
    fullName: str
    token: str

    model_config = ConfigDict(from_attributes=True)

class SignupResponse(BaseModel):
    id: int
    username: str
    login: str
    fullName: str
    token: str

    model_config = ConfigDict(from_attributes=True)