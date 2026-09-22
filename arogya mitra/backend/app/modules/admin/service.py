"""Admin service — branch management business logic."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit.logger import log_audit
from app.core.exceptions import ConflictError, NotFoundError
from app.core.utils import new_uuid
from app.modules.admin import repository as repo
from app.modules.admin.models import Branch
from app.modules.admin.schemas import BranchCreate


async def create_branch(db: AsyncSession, data: BranchCreate, user_id: str | None = None) -> Branch:
    existing = await repo.get_branch_by_code(db, data.code)
    if existing:
        raise ConflictError(f"Branch code '{data.code}' already exists")

    branch = Branch(id=new_uuid(), **data.model_dump())
    db.add(branch)
    await db.flush()

    await log_audit(
        db, action="CREATE", entity_type="Branch", entity_id=branch.id,
        user_id=user_id, new_values=data.model_dump(),
    )
    return branch


async def get_branch(db: AsyncSession, branch_id: str) -> Branch:
    branch = await repo.get_branch_by_id(db, branch_id)
    if not branch:
        raise NotFoundError("Branch", branch_id)
    return branch


async def list_branches(db: AsyncSession) -> list[Branch]:
    return await repo.get_all_branches(db)


async def list_wards(db: AsyncSession, branch_id: str | None = None) -> list[BedWardResponse]:
    from sqlalchemy import select
    from app.modules.admin.models import BedWard
    from app.modules.admin.schemas import BedWardResponse

    stmt = select(BedWard)
    if branch_id:
        stmt = stmt.where(BedWard.branch_id == branch_id)
    result = await db.execute(stmt)
    wards = result.scalars().all()

    items: list[BedWardResponse] = []
    for w in wards:
        avail = max(0, w.total_beds - w.occupied_beds)
        rate = round((w.occupied_beds / w.total_beds) * 100, 1) if w.total_beds > 0 else 0.0
        items.append(
            BedWardResponse(
                id=w.id,
                branch_id=w.branch_id,
                ward_name=w.ward_name,
                ward_type=w.ward_type,
                total_beds=w.total_beds,
                occupied_beds=w.occupied_beds,
                available_beds=avail,
                oxygen_supported_beds=w.oxygen_supported_beds,
                icu_ventilator_beds=w.icu_ventilator_beds,
                occupancy_rate=rate,
            )
        )
    return items


async def create_ward(db: AsyncSession, data: BedWardCreate, user_id: str | None = None) -> BedWard:
    from app.modules.admin.models import BedWard
    ward = BedWard(**data.model_dump(), created_by=user_id)
    db.add(ward)
    await db.commit()
    await db.refresh(ward)
    return ward


async def list_audit_logs(db: AsyncSession, limit: int = 50) -> list[dict]:
    from sqlalchemy import desc, select
    from app.core.audit.models import AuditLog

    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "branch_id": l.branch_id,
            "ip_address": l.ip_address,
            "created_at": l.timestamp.isoformat() if l.timestamp else None,
        }
        for l in logs
    ]

