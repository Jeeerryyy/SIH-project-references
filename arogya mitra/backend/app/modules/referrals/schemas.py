"""Referral Pydantic Schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class ReferralCreate(BaseModel):
    patient_id: str
    receiving_branch_id: str
    urgency: str = "ROUTINE"
    category: str = "GENERAL"
    reason: str
    clinical_summary: str | None = None
    transport_needed: bool = False
    appointment_date: datetime | None = None


class ReferralStatusUpdate(BaseModel):
    status: str
    driver_name: str | None = None
    driver_phone: str | None = None
    ambulance_number: str | None = None


class CounterReferralCreate(BaseModel):
    counter_referral_notes: str
    follow_up_instructions: str
    prescribed_medications_summary: str | None = None


class ReferralResponse(BaseModel):
    id: str
    patient_id: str
    referring_branch_id: str
    receiving_branch_id: str
    referred_by_user_id: str
    accepted_by_user_id: str | None = None
    urgency: str
    category: str
    reason: str
    clinical_summary: str | None = None
    transport_needed: bool
    transport_status: str
    driver_name: str | None = None
    driver_phone: str | None = None
    ambulance_number: str | None = None
    status: str
    appointment_date: datetime | None = None
    arrived_at: datetime | None = None
    completed_at: datetime | None = None
    counter_referral_notes: str | None = None
    follow_up_instructions: str | None = None
    prescribed_medications_summary: str | None = None
    created_at: datetime
    updated_at: datetime

    # Associated nested details
    patient_name: str | None = None
    patient_mrn: str | None = None
    patient_phone: str | None = None
    referring_branch_name: str | None = None
    receiving_branch_name: str | None = None
    referred_by_name: str | None = None

    model_config = {"from_attributes": True}
