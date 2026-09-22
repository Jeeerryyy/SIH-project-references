"""Auth FastAPI dependencies — extracts and validates the current user from JWT."""

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.jwt import decode_token
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.core.exceptions import UnauthorizedError

_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract JWT from Authorization header, decode, and load User from DB."""
    if not credentials:
        raise UnauthorizedError("Missing authentication token")

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token")

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token payload")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("User not found")

    return user


async def get_current_active_user(
    user: User = Depends(get_current_user),
) -> User:
    """Ensure user is active (not deactivated)."""
    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")
    return user
