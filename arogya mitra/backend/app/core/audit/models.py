"""Immutable audit log model."""

from sqlalchemy import DateTime, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import Base
from app.core.utils import new_uuid, utcnow


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    timestamp: Mapped[str] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # CREATE, UPDATE, DELETE, LOGIN
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    old_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    new_values: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    branch_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
