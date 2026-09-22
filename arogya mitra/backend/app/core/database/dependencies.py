"""FastAPI dependency for database sessions."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.engine import async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a scoped async session, auto-commit on success, rollback on error."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
