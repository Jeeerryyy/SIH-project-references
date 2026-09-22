"""Offline Sync API Endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.sync import service
from app.modules.sync.schemas import (
    SyncPullResponse,
    SyncPushRequest,
    SyncPushResponse,
)

router = APIRouter(prefix="/sync", tags=["Offline Synchronization"])


@router.post("/push", response_model=SyncPushResponse)
async def sync_push(
    data: SyncPushRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Replay and commit offline-buffered mutations from field health worker devices."""
    return await service.process_sync_push(
        db, data, user_id=current_user.id, branch_id=current_user.branch_id
    )


@router.get("/pull", response_model=SyncPullResponse)
async def sync_pull(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Pull delta updates of branches, drugs, and patient directories for offline cache."""
    return await service.process_sync_pull(db, branch_id=current_user.branch_id)
