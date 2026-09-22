"""Maternal & NCD API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.programs import service
from app.modules.programs.schemas import (
    MaternalRecordCreate,
    MaternalRecordResponse,
    NcdRecordCreate,
    NcdRecordResponse,
    FrontlineTaskResponse,
)

router = APIRouter(prefix="/programs", tags=["Maternal & NCD Programs"])


@router.post("/maternal", response_model=MaternalRecordResponse, status_code=201)
async def enroll_maternal(
    data: MaternalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Enroll a pregnant mother with automated high-risk detection."""
    return await service.enroll_maternal_patient(
        db, data, branch_id=current_user.branch_id or "cd8487d0-aeec-422c-afd0-19fc4766b085"
    )


@router.get("/maternal", response_model=list[MaternalRecordResponse])
async def list_maternal(
    high_risk_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List pregnant women cohort."""
    return await service.list_maternal_patients(
        db, branch_id=current_user.branch_id, high_risk_only=high_risk_only
    )


@router.post("/ncd", response_model=NcdRecordResponse, status_code=201)
async def record_ncd(
    data: NcdRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Record NCD screening metrics and evaluate stage."""
    return await service.record_ncd_screening(
        db, data, branch_id=current_user.branch_id or "cd8487d0-aeec-422c-afd0-19fc4766b085"
    )


@router.get("/ncd", response_model=list[NcdRecordResponse])
async def list_ncd(
    condition: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List chronic disease NCD cohort."""
    return await service.list_ncd_patients(
        db, condition=condition, branch_id=current_user.branch_id
    )


@router.get("/frontline-tasks", response_model=list[FrontlineTaskResponse])
async def get_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get prioritized daily visits & action tasks for ASHA / ANM / CHO."""
    return await service.get_frontline_tasks(db, branch_id=current_user.branch_id)
