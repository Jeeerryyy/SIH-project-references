"""Teleconsultation API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.teleconsult import service
from app.modules.teleconsult.schemas import (
    TeleconsultSessionCreate,
    TeleconsultSessionResponse,
    TeleconsultJoinResponse,
    TeleconsultCompleteRequest,
)

router = APIRouter(prefix="/teleconsult", tags=["Teleconsultation"])


@router.post("/sessions", response_model=TeleconsultSessionResponse, status_code=201)
async def create_session(
    data: TeleconsultSessionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """CHO creates teleconsultation session with vitals snapshot."""
    return await service.create_session(
        db,
        data,
        requesting_user_id=current_user.id,
        sub_centre_branch_id=current_user.branch_id or "5a744316-2882-40c0-ac97-e360a4a09ae9",
    )


@router.get("/sessions", response_model=list[TeleconsultSessionResponse])
async def list_sessions(
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List waiting / in-call teleconsultation queue."""
    return await service.list_sessions(
        db, branch_id=current_user.branch_id, status=status
    )


@router.post("/sessions/{session_id}/join", response_model=TeleconsultJoinResponse)
async def join_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Join video consultation session room."""
    return await service.join_session(
        db, session_id, user_id=current_user.id, user_role=current_user.role
    )


@router.post("/sessions/{session_id}/complete", response_model=TeleconsultSessionResponse)
async def complete_session(
    session_id: str,
    data: TeleconsultCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Finish teleconsultation call and save diagnosis."""
    return await service.complete_session(db, session_id, data)
