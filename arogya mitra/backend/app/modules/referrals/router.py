"""Referral API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.referrals import service
from app.modules.referrals.schemas import (
    ReferralCreate,
    ReferralResponse,
    ReferralStatusUpdate,
    CounterReferralCreate,
)

router = APIRouter(prefix="/referrals", tags=["Referrals"])


@router.post("", response_model=ReferralResponse, status_code=201)
async def create_referral(
    data: ReferralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Initiate a closed-loop referral from current branch."""
    return await service.create_referral(
        db,
        data,
        referring_branch_id=current_user.branch_id or "cd8487d0-aeec-422c-afd0-19fc4766b085",
        user_id=current_user.id,
    )


@router.get("", response_model=list[ReferralResponse])
async def list_referrals(
    filter_type: str = Query("all", description="inbox, outbox, or all"),
    status: str | None = Query(None),
    urgency: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List referrals for current facility / staff."""
    return await service.list_referrals(
        db,
        branch_id=current_user.branch_id,
        filter_type=filter_type,
        status=status,
        urgency=urgency,
    )


@router.get("/{referral_id}", response_model=ReferralResponse)
async def get_referral(
    referral_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get single referral tracking record."""
    return await service.get_referral(db, referral_id)


@router.patch("/{referral_id}/status", response_model=ReferralResponse)
async def update_status(
    referral_id: str,
    data: ReferralStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Advance referral status (ACCEPTED, IN_TRANSIT, ARRIVED)."""
    return await service.update_referral_status(
        db, referral_id, data, user_id=current_user.id
    )


@router.post("/{referral_id}/counter-referral", response_model=ReferralResponse)
async def counter_referral(
    referral_id: str,
    data: CounterReferralCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Complete referral with counter-referral discharge notes."""
    return await service.complete_counter_referral(
        db, referral_id, data, user_id=current_user.id
    )
