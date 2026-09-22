"""ABDM API Endpoints — M1/M2/M3 Sandbox."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.abdm import service
from app.modules.abdm.schemas import (
    AbhaGenerateRequest,
    AbhaProfileResponse,
    ConsentExchangeResponse,
    ConsentRequestPayload,
    LinkCareContextRequest,
    LinkCareContextResponse,
)

router = APIRouter(prefix="/abdm", tags=["ABDM Digital Health Integration"])


@router.post("/m1/generate-abha", response_model=AbhaProfileResponse)
async def generate_abha_profile(
    data: AbhaGenerateRequest,
    current_user: User = Depends(get_current_active_user),
):
    """M1 Milestone: Create 14-digit ABHA Number & Address with KYC simulation."""
    return await service.generate_abha(data)


@router.post("/m2/link-care-context", response_model=LinkCareContextResponse)
async def link_care_context(
    data: LinkCareContextRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """M2 Milestone: Health Information Provider (HIP) — Discover & Link Patient Care Contexts to ABHA."""
    return await service.link_care_context(db, data)


@router.post("/m3/consent/exchange", response_model=ConsentExchangeResponse)
async def exchange_consent_and_fhir(
    data: ConsentRequestPayload,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """M3 Milestone: Health Information User (HIU) — Consent Manager & FHIR R4 Encrypted Bundle Transfer."""
    return await service.exchange_consent_and_fetch_fhir(db, data)
