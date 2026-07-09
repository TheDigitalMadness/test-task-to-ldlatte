from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from core.config import settings


def create_token(id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    return jwt.encode(
        claims={
            "id": id,
            "exp": expire
        },
        key=settings.JWT_SECRET,
        algorithm="HS256"
    )

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(
            token=token,
            key=settings.JWT_SECRET,
            algorithms=["HS256"]
        )
        return payload
    except JWTError:
        return None