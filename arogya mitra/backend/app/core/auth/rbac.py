"""Role-Based Access Control — FastAPI dependencies for endpoint protection."""

from functools import wraps
from typing import Callable

from fastapi import Depends

from app.core.auth.models import RoleEnum
from app.core.exceptions import ForbiddenError


def require_roles(*allowed_roles: RoleEnum) -> Callable:
    """FastAPI dependency that checks if the current user has one of the allowed roles."""

    async def role_checker(current_user=Depends(_get_current_user_lazy)):
        if current_user.role not in [r.value for r in allowed_roles]:
            raise ForbiddenError(
                f"Role '{current_user.role}' is not authorized. Required: {[r.value for r in allowed_roles]}"
            )
        return current_user

    return role_checker


def _get_current_user_lazy():
    """Lazy import to avoid circular dependency — resolved at runtime."""
    from app.core.auth.dependencies import get_current_active_user

    return Depends(get_current_active_user)
