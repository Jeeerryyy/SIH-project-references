"""Pydantic schemas for Pharmacy and Inventory."""

from datetime import date, datetime
from pydantic import BaseModel, Field


class DrugItemBase(BaseModel):
    code: str
    name: str
    generic_name: str
    dosage_form: str = "Tablet"
    strength: str = "500mg"
    category: str = "General"
    is_essential_jan_aushadhi: bool = True
    unit_price: float = 0.0


class DrugItemCreate(DrugItemBase):
    pass


class DrugItemResponse(DrugItemBase):
    id: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class InventoryStockCreate(BaseModel):
    branch_id: str | None = None
    drug_id: str
    batch_number: str
    expiry_date: date
    quantity_available: int = Field(ge=0)
    reorder_level: int = 50


class InventoryStockResponse(BaseModel):
    id: str
    branch_id: str
    drug_id: str
    batch_number: str
    expiry_date: date
    quantity_available: int
    reorder_level: int
    created_at: datetime | None = None
    updated_at: datetime | None = None

    drug_name: str | None = None
    generic_name: str | None = None
    dosage_form: str | None = None
    strength: str | None = None
    is_essential_jan_aushadhi: bool | None = None
    is_low_stock: bool = False
    is_expiring_soon: bool = False  # Within 90 days

    model_config = {"from_attributes": True}



class StockReceiveRequest(BaseModel):
    branch_id: str | None = None
    drug_id: str
    batch_number: str
    expiry_date: date
    quantity: int = Field(gt=0)
    notes: str | None = None


class DispenseMedicationItem(BaseModel):
    stock_id: str
    quantity: int = Field(gt=0)


class DispenseMedicationRequest(BaseModel):
    prescription_id: str | None = None
    patient_id: str
    items: list[DispenseMedicationItem]
    notes: str | None = None


class DispenseMedicationResponse(BaseModel):
    success: bool
    prescription_id: str | None = None
    dispensed_at: datetime
    items_dispensed: int
    message: str
