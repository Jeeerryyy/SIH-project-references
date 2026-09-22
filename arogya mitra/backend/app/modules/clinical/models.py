"""Clinical EMR and Digital Prescription models."""

import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database.base import BaseModel


class VisitType(str, enum.Enum):
    OPD = "OPD"
    TELECONSULT = "TELECONSULT"
    EMERGENCY = "EMERGENCY"
    INPATIENT = "INPATIENT"


class Consultation(BaseModel):
    __tablename__ = "consultations"

    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False, index=True)

    visit_type = Column(String(20), default=VisitType.OPD.value, nullable=False)
    chief_complaint = Column(String(255), nullable=False)
    clinical_notes = Column(Text, nullable=True)
    
    # Diagnosis & Standard Clinical Coding
    diagnosis = Column(String(255), nullable=False)
    snomed_codes = Column(JSON, default=list, nullable=False)
    icd10_codes = Column(JSON, default=list, nullable=False)

    # Vitals Recorded
    vitals = Column(JSON, default=dict, nullable=False)

    patient = relationship("Patient", lazy="joined")
    doctor = relationship("User", lazy="joined")
    prescriptions = relationship("Prescription", back_populates="consultation", lazy="selectin")


class Prescription(BaseModel):
    __tablename__ = "prescriptions"

    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    doctor_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)

    # Formatted array of drug items:
    # [{ "medicine_name": "Paracetamol 500mg", "generic_name": "Acetaminophen", "dosage": "1 tablet", "frequency": "1-0-1 (Twice daily)", "duration": "5 days", "instructions": "After food" }]
    medications = Column(JSON, default=list, nullable=False)
    
    diet_lifestyle_advice = Column(Text, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    is_dispensed = Column(Boolean, default=False, nullable=False)

    consultation = relationship("Consultation", back_populates="prescriptions")
    patient = relationship("Patient", lazy="joined")
    doctor = relationship("User", lazy="joined")
