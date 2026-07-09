from pydantic import BaseModel


class UnauthorizedErrorResponse(BaseModel):
    message: str