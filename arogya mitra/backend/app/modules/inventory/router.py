"""Pharmacy and Inventory API Endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.inventory import service
from app.modules.inventory.schemas import (
    DispenseMedicationRequest,
    DispenseMedicationResponse,
    DrugItemCreate,
    DrugItemResponse,
    InventoryStockResponse,
    StockReceiveRequest,
)

router = APIRouter(prefix="/inventory", tags=["Pharmacy & Inventory"])


@router.get("/drugs", response_model=list[DrugItemResponse])
async def list_drugs(
    q: str | None = Query(None, description="Search drug by name, generic, or code"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List Jan Aushadhi & essential drugs catalog."""
    drugs = await service.list_drugs(db, q=q)
    return [DrugItemResponse.model_validate(d) for d in drugs]


@router.post("/drugs", response_model=DrugItemResponse, status_code=201)
async def create_drug(
    data: DrugItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Add a new drug item to master formulary."""
    drug = await service.create_drug(db, data, user_id=current_user.id)
    return DrugItemResponse.model_validate(drug)


@router.get("/stocks", response_model=list[InventoryStockResponse])
async def list_stocks(
    only_low_stock: bool = Query(False),
    only_expiring_soon: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List facility inventory stock batches with real-time low-stock/expiry alerts."""
    return await service.list_inventory(
        db,
        branch_id=current_user.branch_id,
        only_low_stock=only_low_stock,
        only_expiring_soon=only_expiring_soon,
    )


@router.post("/receive", response_model=InventoryStockResponse, status_code=201)
async def receive_stock(
    data: StockReceiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Receive supply delivery / PO shipment into pharmacy inventory."""
    stock = await service.receive_stock(
        db, data, user_id=current_user.id, branch_id=current_user.branch_id
    )
    return InventoryStockResponse.model_validate(stock)


@router.post("/dispense", response_model=DispenseMedicationResponse)
async def dispense_medications(
    data: DispenseMedicationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Dispense prescribed medications at pharmacy counter and auto-decrement batch stock."""
    return await service.dispense_medications(
        db, data, user_id=current_user.id, branch_id=current_user.branch_id
    )
