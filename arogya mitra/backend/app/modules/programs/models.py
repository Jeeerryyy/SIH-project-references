"""Maternal & NCD Program models."""

import enum
from datetime import date, datetime
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Boolean, Float, Integer, JSON
from sqlalchemy.orm import relationship

from app.core.database.base import BaseModel


class MaternalDeliveryStatus(str, enum.Enum):
    PREGNANT = "PREGNANT"
    DELIVERED = "DELIVERED"
    COMPLICATION = "COMPLICATION"


class NcdCondition(str, enum.Enum):
    HYPERTENSION = "HYPERTENSION"
    DIABETES = "DIABETES"
    COPD = "COPD"
    CANCER_SCREENING = "CANCER_SCREENING"
    CARDIOVASCULAR = "CARDIOVASCULAR"


class NcdSeverity(str, enum.Enum):
    NORMAL = "NORMAL"
    STAGE_1 = "STAGE_1"
    STAGE_2 = "STAGE_2"
    CRITICAL_HIGH_RISK = "CRITICAL_HIGH_RISK"


class MaternalRecord(BaseModel):
    __tablename__ = "maternal_records"

    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    lmp_date = Column(Date, nullable=False)
    edd_date = Column(Date, nullable=False)
    gravida = Column(Integer, default=1, nullable=False)
    parity = Column(Integer, default=0, nullable=False)

    # Risk assessment & flags
    high_risk_flag = Column(Boolean, default=False, nullable=False, index=True)
    risk_factors = Column(JSON, default=list, nullable=False)  # ["SEVERE_ANEMIA", "GESTATIONAL_HYPERTENSION", "TEENAGE_PREGNANCY"]
    hemoglobin_level = Column(Float, nullable=True)  # g/dL

    # Trimester & Visit tracking
    trimester = Column(Integer, default=1, nullable=False)
    anc_visits_completed = Column(Integer, default=0, nullable=False)
    next_visit_due = Column(Date, nullable=True, index=True)

    # Frontline worker assignments
    assigned_asha_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    assigned_anm_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    delivery_status = Column(String(20), default=MaternalDeliveryStatus.PREGNANT.value, nullable=False)

    patient = relationship("Patient", lazy="joined")
    assigned_asha = relationship("User", foreign_keys=[assigned_asha_id], lazy="joined")


class NcdRecord(BaseModel):
    __tablename__ = "ncd_records"

    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    condition_type = Column(String(30), default=NcdCondition.HYPERTENSION.value, nullable=False, index=True)
    severity = Column(String(30), default=NcdSeverity.NORMAL.value, nullable=False, index=True)

    # Vitals
    systolic_bp = Column(Integer, nullable=True)
    diastolic_bp = Column(Integer, nullable=True)
    fasting_blood_sugar = Column(Float, nullable=True)
    random_blood_sugar = Column(Float, nullable=True)
    hba1c = Column(Float, nullable=True)

    # Follow-up
    last_checkup_date = Column(Date, nullable=True)
    next_checkup_due = Column(Date, nullable=True, index=True)
    medication_compliance = Column(Boolean, default=True, nullable=False)
    assigned_asha_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", lazy="joined")
    assigned_asha = relationship("User", foreign_keys=[assigned_asha_id], lazy="joined")
