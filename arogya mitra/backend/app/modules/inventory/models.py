"""Inventory and Pharmacy Models."""

from datetime import date, datetime
from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database.base import AuditMixin, Base
from app.core.utils import new_uuid


class DrugItem(Base, AuditMixin):
    __tablename__ = "drug_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    generic_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    dosage_form: Mapped[str] = mapped_column(String(50), nullable=False)  # Tablet, Syrup, Injection, Ointment
    strength: Mapped[str] = mapped_column(String(50), nullable=False)  # 500mg, 5mg, 100ml
    category: Mapped[str] = mapped_column(String(100), default="General")  # Antibiotic, Antihypertensive, Antidiabetic, Analgesic
    is_essential_jan_aushadhi: Mapped[bool] = mapped_column(Boolean, default=True)
    unit_price: Mapped[float] = mapped_column(Float, default=0.0)

    stocks: Mapped[list["InventoryStock"]] = relationship("InventoryStock", back_populates="drug", cascade="all, delete-orphan")


class InventoryStock(Base, AuditMixin):
    __tablename__ = "inventory_stocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    branch_id: Mapped[str] = mapped_column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    drug_id: Mapped[str] = mapped_column(String(36), ForeignKey("drug_items.id"), nullable=False, index=True)
    batch_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    quantity_available: Mapped[int] = mapped_column(Integer, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, default=50)

    drug: Mapped["DrugItem"] = relationship("DrugItem", back_populates="stocks")


class StockTransaction(Base, AuditMixin):
    __tablename__ = "stock_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    branch_id: Mapped[str] = mapped_column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    drug_id: Mapped[str] = mapped_column(String(36), ForeignKey("drug_items.id"), nullable=False, index=True)
    batch_number: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)  # RECEIVE, DISPENSE, TRANSFER, ADJUSTMENT
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    prescription_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    patient_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
