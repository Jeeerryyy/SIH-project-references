"""API router for Public Health Analytics & Epidemiological Surveillance."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.analytics import service
from app.modules.analytics.schemas import DiseaseTrendPoint, PublicHealthOverview

router = APIRouter(prefix="/analytics", tags=["Public Health & Epidemiological Analytics"])


@router.get(
    "/overview",
    response_model=PublicHealthOverview,
    summary="Get national/district public health overview, outbreak alerts, and geo-clusters",
)
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await service.get_public_health_overview(db)


@router.get(
    "/disease-trends",
    response_model=list[DiseaseTrendPoint],
    summary="Get 14-day disease incidence trend timeline",
)
async def get_disease_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await service.get_disease_trends(db)
