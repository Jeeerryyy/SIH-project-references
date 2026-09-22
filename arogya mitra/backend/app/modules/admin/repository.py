"""Admin repository — database queries for branches."""

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Branch


async def get_all_branches(db: AsyncSession) -> list[Branch]:
    result = await db.execute(select(Branch).where(Branch.is_active == True).order_by(Branch.name))
    return list(result.scalars().all())


async def get_branch_by_id(db: AsyncSession, branch_id: str) -> Branch | None:
    result = await db.execute(select(Branch).where(Branch.id == branch_id))
    return result.scalar_one_or_none()


async def get_branch_by_code(db: AsyncSession, code: str) -> Branch | None:
    result = await db.execute(select(Branch).where(Branch.code == code))
    return result.scalar_one_or_none()


async def count_branches(db: AsyncSession) -> int:
    result = await db.execute(select(func.count(Branch.id)).where(Branch.is_active == True))
    return result.scalar_one()
