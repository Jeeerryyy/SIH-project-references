"""Base model with universal audit columns — every table inherits from this."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _new_uuid() -> str:
    return str(uuid.uuid4())


class Base(DeclarativeBase):
    """Abstract declarative base — NOT a table itself."""
    pass


class AuditMixin:
    """Adds created_at, updated_at, created_by, is_active to any model."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )
    created_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class BranchScopedMixin:
    """Adds branch_id for multi-tenant row scoping."""

    branch_id: Mapped[str | None] = mapped_column(
        String(36), nullable=True, index=True
    )


class BaseModel(Base, AuditMixin, BranchScopedMixin):
    """Abstract Base Model with id, audit mixin and branch scoping."""
    __abstract__ = True

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_new_uuid)
