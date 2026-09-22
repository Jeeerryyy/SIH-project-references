import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database.base import Base


class LabTestCatalog(Base):
    __tablename__ = "lab_test_catalog"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    test_code = Column(String(30), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # HEMATOLOGY, BIOCHEMISTRY, SEROLOGY, MICROBIOLOGY, URINALYSIS
    sample_type = Column(String(50), nullable=False)  # WHOLE_BLOOD, SERUM, PLASMA, URINE, SPUTUM
    vacutainer_color = Column(String(30), default="LAVENDER_EDTA")  # LAVENDER_EDTA, RED_PLAIN, YELLOW_SST, GREY_FLUORIDE
    units = Column(String(30), nullable=True)
    normal_min = Column(Float, nullable=True)
    normal_max = Column(Float, nullable=True)
    critical_low = Column(Float, nullable=True)
    critical_high = Column(Float, nullable=True)
    price_inr = Column(Float, default=0.0)  # Free under National Free Diagnostics Initiative (NHM)
    is_active = Column(Boolean, default=True)


class LabOrder(Base):
    __tablename__ = "lab_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number = Column(String(30), unique=True, index=True, nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    ordered_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    clinical_indication = Column(String(255), nullable=True)
    urgency = Column(String(20), default="ROUTINE")  # ROUTINE, URGENT, STAT_EMERGENCY
    status = Column(String(30), default="ORDERED")  # ORDERED, SAMPLE_COLLECTED, IN_ANALYZER, VERIFIED, PUBLISHED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient")
    branch = relationship("Branch")
    ordered_by = relationship("User")
    items = relationship("LabOrderItem", back_populates="order", cascade="all, delete-orphan")
    samples = relationship("LabSample", back_populates="order", cascade="all, delete-orphan")


class LabOrderItem(Base):
    __tablename__ = "lab_order_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("lab_orders.id"), nullable=False, index=True)
    test_id = Column(String(36), ForeignKey("lab_test_catalog.id"), nullable=False)
    result_value = Column(String(100), nullable=True)
    numeric_value = Column(Float, nullable=True)
    is_abnormal = Column(Boolean, default=False)
    is_critical = Column(Boolean, default=False)
    technician_notes = Column(Text, nullable=True)
    verified_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("LabOrder", back_populates="items")
    test = relationship("LabTestCatalog")
    verified_by = relationship("User")


class LabSample(Base):
    __tablename__ = "lab_samples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    barcode = Column(String(50), unique=True, index=True, nullable=False)
    order_id = Column(String(36), ForeignKey("lab_orders.id"), nullable=False, index=True)
    sample_type = Column(String(50), nullable=False)
    vacutainer_type = Column(String(50), nullable=False)
    collected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    collected_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="COLLECTED")  # COLLECTED, RECEIVED_IN_LAB, PROCESSED, REJECTED

    order = relationship("LabOrder", back_populates="samples")
    collected_by = relationship("User")
