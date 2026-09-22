"""Patient repository — database queries."""

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.patients.models import Patient


async def search_patients(
    db: AsyncSession, query: str | None = None, offset: int = 0, limit: int = 20
) -> tuple[list[Patient], int]:
    """Search patients by name, MRN, phone, or ABHA ID. Returns (items, total_count)."""
    base = select(Patient).where(Patient.is_active == True)
    count_q = select(func.count(Patient.id)).where(Patient.is_active == True)

    if query:
        like = f"%{query}%"
        condition = or_(
            Patient.first_name.ilike(like),
            Patient.last_name.ilike(like),
            Patient.mrn.ilike(like),
            Patient.phone.ilike(like),
            Patient.abha_id.ilike(like),
        )
        base = base.where(condition)
        count_q = count_q.where(condition)

    total = (await db.execute(count_q)).scalar_one()
    result = await db.execute(base.order_by(Patient.created_at.desc()).offset(offset).limit(limit))
    return list(result.scalars().all()), total


async def get_patient_by_id(db: AsyncSession, patient_id: str) -> Patient | None:
    result = await db.execute(select(Patient).where(Patient.id == patient_id))
    return result.scalar_one_or_none()


async def get_next_mrn_sequence(db: AsyncSession) -> int:
    result = await db.execute(select(func.count(Patient.id)))
    return result.scalar_one() + 1
