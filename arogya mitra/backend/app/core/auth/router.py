"""Auth API endpoints — login, refresh, me."""

from pydantic import BaseModel
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import service as auth_service
from app.core.auth.dependencies import get_current_active_user
from app.core.auth.jwt import decode_token, create_access_token
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.core.exceptions import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: dict


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    branch_id: str | None
    email: str | None
    phone: str | None


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with username/password and receive JWT tokens."""
    return await auth_service.authenticate_user(db, body.username, body.password)


@router.post("/refresh", response_model=dict)
async def refresh_token(body: RefreshRequest):
    """Exchange a valid refresh token for a new access token."""
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")

    token_data = {"sub": payload["sub"], "role": payload["role"], "branch_id": payload.get("branch_id")}
    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        branch_id=current_user.branch_id,
        email=current_user.email,
        phone=current_user.phone,
    )
