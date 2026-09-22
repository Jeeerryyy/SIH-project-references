"""Pharmacy and Inventory Business Service."""

from datetime import date, datetime, timedelta
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ValidationError
from app.modules.clinical.models import Prescription
from app.modules.inventory.models import DrugItem, InventoryStock, StockTransaction
from app.modules.inventory.schemas import (
    DispenseMedicationRequest,
    DispenseMedicationResponse,
    DrugItemCreate,
    InventoryStockResponse,
    StockReceiveRequest,
)


async def list_drugs(db: AsyncSession, q: str | None = None) -> list[DrugItem]:
    stmt = select(DrugItem).order_by(DrugItem.name)
    if q:
        stmt = stmt.where(
            or_(
                DrugItem.name.ilike(f"%{q}%"),
                DrugItem.generic_name.ilike(f"%{q}%"),
                DrugItem.category.ilike(f"%{q}%"),
                DrugItem.code.ilike(f"%{q}%"),
            )
        )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_drug(db: AsyncSession, data: DrugItemCreate, user_id: str | None = None) -> DrugItem:
    drug = DrugItem(**data.model_dump(), created_by=user_id)
    db.add(drug)
    await db.commit()
    await db.refresh(drug)
    return drug


async def list_inventory(
    db: AsyncSession,
    branch_id: str | None = None,
    only_low_stock: bool = False,
    only_expiring_soon: bool = False,
) -> list[InventoryStockResponse]:
    stmt = select(InventoryStock).options(selectinload(InventoryStock.drug))
    if branch_id:
        stmt = stmt.where(InventoryStock.branch_id == branch_id)

    result = await db.execute(stmt)
    stocks = result.scalars().all()

    today = date.today()
    ninety_days_later = today + timedelta(days=90)
    items: list[InventoryStockResponse] = []

    for s in stocks:
        is_low = s.quantity_available <= s.reorder_level
        is_expiring = s.expiry_date <= ninety_days_later

        if only_low_stock and not is_low:
            continue
        if only_expiring_soon and not is_expiring:
            continue

        resp = InventoryStockResponse.model_validate(s)
        resp.is_low_stock = is_low
        resp.is_expiring_soon = is_expiring
        if s.drug:
            resp.drug_name = s.drug.name
            resp.generic_name = s.drug.generic_name
            resp.dosage_form = s.drug.dosage_form
            resp.strength = s.drug.strength
            resp.is_essential_jan_aushadhi = s.drug.is_essential_jan_aushadhi

        items.append(resp)

    return items


async def receive_stock(
    db: AsyncSession,
    data: StockReceiveRequest,
    user_id: str | None = None,
    branch_id: str | None = None,
) -> InventoryStock:
    target_branch = data.branch_id or branch_id
    if not target_branch:
        raise ValidationError("Target facility branch is required to receive stock")

    drug = await db.get(DrugItem, data.drug_id)
    if not drug:
        raise NotFoundError("DrugItem", data.drug_id)

    # Check if existing batch exists
    stmt = select(InventoryStock).where(
        InventoryStock.branch_id == target_branch,
        InventoryStock.drug_id == data.drug_id,
        InventoryStock.batch_number == data.batch_number,
    )
    res = await db.execute(stmt)
    stock = res.scalar_one_or_none()

    if stock:
        stock.quantity_available += data.quantity
        stock.expiry_date = data.expiry_date
    else:
        stock = InventoryStock(
            branch_id=target_branch,
            drug_id=data.drug_id,
            batch_number=data.batch_number,
            expiry_date=data.expiry_date,
            quantity_available=data.quantity,
            reorder_level=50,
            created_by=user_id,
        )
        db.add(stock)

    # Record transaction
    tx = StockTransaction(
        branch_id=target_branch,
        drug_id=data.drug_id,
        batch_number=data.batch_number,
        transaction_type="RECEIVE",
        quantity=data.quantity,
        notes=data.notes or "PO Stock Delivery Received",
        created_by=user_id,
    )
    db.add(tx)

    await db.commit()
    await db.refresh(stock)
    return stock


async def dispense_medications(
    db: AsyncSession,
    data: DispenseMedicationRequest,
    user_id: str | None = None,
    branch_id: str | None = None,
) -> DispenseMedicationResponse:
    if not data.items:
        raise ValidationError("At least one medication item must be selected for dispensing")

    dispensed_count = 0

    for item in data.items:
        stock = await db.get(InventoryStock, item.stock_id)
        if not stock:
            raise NotFoundError("InventoryStock", item.stock_id)

        if stock.quantity_available < item.quantity:
            raise ValidationError(
                f"Insufficient stock for batch {stock.batch_number}. Available: {stock.quantity_available}, Requested: {item.quantity}"
            )

        stock.quantity_available -= item.quantity

        tx = StockTransaction(
            branch_id=stock.branch_id,
            drug_id=stock.drug_id,
            batch_number=stock.batch_number,
            transaction_type="DISPENSE",
            quantity=item.quantity,
            prescription_id=data.prescription_id,
            patient_id=data.patient_id,
            notes=data.notes or "Prescription Dispensed at Pharmacy Counter",
            created_by=user_id,
        )
        db.add(tx)
        dispensed_count += 1

    # If linked to a prescription, mark prescription as dispensed
    if data.prescription_id:
        prescription = await db.get(Prescription, data.prescription_id)
        if prescription:
            prescription.is_dispensed = True

    await db.commit()

    return DispenseMedicationResponse(
        success=True,
        prescription_id=data.prescription_id,
        dispensed_at=datetime.utcnow(),
        items_dispensed=dispensed_count,
        message=f"Successfully dispensed {dispensed_count} item(s) from inventory.",
    )
