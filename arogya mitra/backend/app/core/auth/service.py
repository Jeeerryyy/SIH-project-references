"""Auth business logic — login, registration, password hashing."""

import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.jwt import create_access_token, create_refresh_token
from app.core.auth.models import User
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.utils import new_uuid, utcnow


def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except Exception:
        return False


async def authenticate_user(db: AsyncSession, username: str, password: str) -> dict:
    """Verify credentials and return JWT token pair."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise UnauthorizedError("Invalid username or password")

    if not user.is_active:
        raise UnauthorizedError("Account is deactivated")

    # Update last_login
    user.last_login = utcnow()
    await db.flush()

    token_data = {"sub": user.id, "role": user.role, "branch_id": user.branch_id}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "branch_id": user.branch_id,
        },
    }


async def create_user(
    db: AsyncSession,
    *,
    username: str,
    password: str,
    full_name: str,
    role: str,
    email: str | None = None,
    phone: str | None = None,
    branch_id: str | None = None,
    designation: str | None = None,
) -> User:
    """Create a new user with hashed password."""
    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Username '{username}' already exists")

    user = User(
        id=new_uuid(),
        username=username,
        email=email,
        full_name=full_name,
        hashed_password=hash_password(password),
        role=role,
        phone=phone,
        branch_id=branch_id,
        designation=designation,
    )
    db.add(user)
    await db.flush()
    return user
