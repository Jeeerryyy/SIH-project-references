"""Async SQLAlchemy engine and session factory.

Works with both SQLite (dev) and PostgreSQL (prod) via DATABASE_URL.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.config import settings

_connect_args = {}
_pool_class = None

# SQLite requires special handling for async + in-memory/file
if settings.is_sqlite:
    _connect_args = {"check_same_thread": False}
    _pool_class = StaticPool

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.is_dev,
    connect_args=_connect_args,
    poolclass=_pool_class,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_tables():
    """Create all tables — used in dev/testing. Use Alembic migrations in prod."""
    from app.core.database.base import Base  # noqa: F811
    from app.core.auth.models import User  # noqa: F401
    from app.core.audit.models import AuditLog  # noqa: F401
    from app.modules.admin.models import Branch, Department, BedWard  # noqa: F401
    from app.modules.patients.models import Patient  # noqa: F401
    from app.modules.referrals.models import Referral  # noqa: F401
    from app.modules.programs.models import MaternalRecord, NcdRecord  # noqa: F401
    from app.modules.teleconsult.models import TeleconsultSession  # noqa: F401
    from app.modules.clinical.models import Consultation, Prescription  # noqa: F401
    from app.modules.inventory.models import DrugItem, InventoryStock, StockTransaction  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)



async def dispose_engine():
    """Gracefully close all connections."""
    await engine.dispose()
