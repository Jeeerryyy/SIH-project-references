"""Referral models — Closed-Loop Referral Tracking."""

import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship

from app.core.database.base import BaseModel


class ReferralUrgency(str, enum.Enum):
    ROUTINE = "ROUTINE"
    URGENT = "URGENT"
    EMERGENCY = "EMERGENCY"


class ReferralCategory(str, enum.Enum):
    MATERNAL = "MATERNAL"
    NCD = "NCD"
    SURGICAL = "SURGICAL"
    PEDIATRIC = "PEDIATRIC"
    DIAGNOSTIC = "DIAGNOSTIC"
    EMERGENCY = "EMERGENCY"
    GENERAL = "GENERAL"


class ReferralStatus(str, enum.Enum):
    INITIATED = "INITIATED"
    ACCEPTED = "ACCEPTED"
    IN_TRANSIT = "IN_TRANSIT"
    ARRIVED = "ARRIVED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class TransportStatus(str, enum.Enum):
    NOT_NEEDED = "NOT_NEEDED"
    REQUESTED = "REQUESTED"
    DISPATCHED_108 = "DISPATCHED_108"
    ARRIVED = "ARRIVED"


class Referral(BaseModel):
    __tablename__ = "referrals"

    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    referring_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    receiving_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    referred_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    accepted_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    urgency = Column(String(20), default=ReferralUrgency.ROUTINE.value, nullable=False)
    category = Column(String(30), default=ReferralCategory.GENERAL.value, nullable=False)
    reason = Column(String(255), nullable=False)
    clinical_summary = Column(Text, nullable=True)

    # Transport details
    transport_needed = Column(Boolean, default=False, nullable=False)
    transport_status = Column(String(30), default=TransportStatus.NOT_NEEDED.value, nullable=False)
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    ambulance_number = Column(String(30), nullable=True)

    # Status & Timeline
    status = Column(String(20), default=ReferralStatus.INITIATED.value, nullable=False, index=True)
    appointment_date = Column(DateTime, nullable=True)
    arrived_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Counter-Referral (Feedback Loop back to referring Sub-Centre / ASHA)
    counter_referral_notes = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    prescribed_medications_summary = Column(Text, nullable=True)

    patient = relationship("Patient", lazy="joined")
    referring_branch = relationship("Branch", foreign_keys=[referring_branch_id], lazy="joined")
    receiving_branch = relationship("Branch", foreign_keys=[receiving_branch_id], lazy="joined")
    referred_by = relationship("User", foreign_keys=[referred_by_user_id], lazy="joined")
