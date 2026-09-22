"""Admin API endpoints — Branch management."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import RoleEnum, User
from app.core.database.dependencies import get_db
from app.core.exceptions import ForbiddenError
from app.modules.admin import service
from app.modules.admin.schemas import (
    AuditLogResponse,
    BedWardCreate,
    BedWardResponse,
    BranchCreate,
    BranchResponse,
)

router = APIRouter(prefix="/branches", tags=["Administration"])



@router.get("", response_model=list[BranchResponse])
async def list_branches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List all active branches/facilities."""
    branches = await service.list_branches(db)
    return [BranchResponse.model_validate(b) for b in branches]


@router.post("", response_model=BranchResponse, status_code=201)
async def create_branch(
    data: BranchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new branch/facility (SUPERADMIN only)."""
    if current_user.role != RoleEnum.SUPERADMIN.value:
        raise ForbiddenError("Only SUPERADMIN can create branches")
    branch = await service.create_branch(db, data, user_id=current_user.id)
    return BranchResponse.model_validate(branch)


@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(
    branch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get branch details by ID."""
    branch = await service.get_branch(db, branch_id)
    return BranchResponse.model_validate(branch)


@router.get("/wards/all", response_model=list[BedWardResponse])
async def list_wards(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List hospital bed wards with live occupancy meters."""
    return await service.list_wards(db, branch_id=current_user.branch_id)


@router.post("/wards/create", response_model=dict, status_code=201)
async def create_ward(
    data: BedWardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new hospital ward / bed unit."""
    if not data.branch_id:
        data.branch_id = current_user.branch_id
    ward = await service.create_ward(db, data, user_id=current_user.id)
    return {"id": ward.id, "ward_name": ward.ward_name, "total_beds": ward.total_beds}



@router.get("/audit-logs/recent", response_model=list[dict])
async def get_recent_audit_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """View recent security and data modification audit logs."""
    return await service.list_audit_logs(db, limit=limit)

