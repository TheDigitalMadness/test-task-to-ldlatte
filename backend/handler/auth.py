from fastapi import APIRouter, HTTPException, status, Depends

from domain.request.auth import SigninRequest, SignupRequest
from domain.response.auth import SigninResponse, SignupResponse, BadCredentialsErrorResponse, \
    UserAlreadyExistsErrorResponse
from handler.dependencies import get_auth_service
from service.auth import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signin", response_model=SigninResponse)
async def signin(data: SigninRequest, service: AuthService = Depends(get_auth_service)):
    try:
        login = data.login
        password = data.password

        return await service.signin(login, password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=BadCredentialsErrorResponse(message=str(e)).model_dump()
        )

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(data: SignupRequest, service: AuthService = Depends(get_auth_service)):
    try:
        login = data.login
        password = data.password
        username = data.username
        fullName = data.fullName

        return await service.signup(login, password, username, fullName)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=UserAlreadyExistsErrorResponse(message=str(e)).model_dump()
        )

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout():
    return { "success": True }