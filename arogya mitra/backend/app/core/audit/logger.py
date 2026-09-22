"""Audit log writer — call from any service to record an auditable action."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit.models import AuditLog
from app.core.utils import new_uuid


async def log_audit(
    db: AsyncSession,
    *,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    user_id: str | None = None,
    username: str | None = None,
    old_values: dict | None = None,
    new_values: dict | None = None,
    ip_address: str | None = None,
    branch_id: str | None = None,
    details: str | None = None,
) -> None:
    """Write an immutable audit log record."""
    entry = AuditLog(
        id=new_uuid(),
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        username=username,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        branch_id=branch_id,
        details=details,
    )
    db.add(entry)
    await db.flush()
