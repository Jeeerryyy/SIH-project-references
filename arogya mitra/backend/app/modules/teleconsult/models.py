"""Teleconsultation database models."""

import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.core.database.base import BaseModel


class TeleconsultStatus(str, enum.Enum):
    WAITING = "WAITING"
    IN_CALL = "IN_CALL"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TeleconsultSession(BaseModel):
    __tablename__ = "teleconsult_sessions"

    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    requesting_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)  # CHO / ANM
    doctor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)      # DH Specialist
    sub_centre_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)
    hospital_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False)

    room_id = Column(String(64), unique=True, nullable=False, index=True)
    status = Column(String(20), default=TeleconsultStatus.WAITING.value, nullable=False, index=True)
    chief_complaint = Column(String(255), nullable=False)
    
    # Real-time vitals snapshot taken by CHO
    vitals_snapshot = Column(JSON, default=dict, nullable=False)  # { "bp": "140/90", "pulse": 82, "spo2": 98, "temp": 98.6, "sugar": 142 }
    
    # Clinical outcome
    doctor_diagnosis = Column(Text, nullable=True)
    prescription_id = Column(String(36), nullable=True)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", lazy="joined")
    requesting_user = relationship("User", foreign_keys=[requesting_user_id], lazy="joined")
    doctor_user = relationship("User", foreign_keys=[doctor_user_id], lazy="joined")
    sub_centre = relationship("Branch", foreign_keys=[sub_centre_branch_id], lazy="joined")
