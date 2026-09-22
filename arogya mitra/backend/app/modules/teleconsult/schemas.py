"""Teleconsultation Pydantic Schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class TeleconsultSessionCreate(BaseModel):
    patient_id: str
    hospital_branch_id: str
    chief_complaint: str
    vitals_snapshot: dict = Field(default_factory=dict)
    doctor_user_id: str | None = None


class TeleconsultJoinResponse(BaseModel):
    session_id: str
    room_id: str
    webrtc_token: str
    status: str
    patient_name: str
    vitals_snapshot: dict


class TeleconsultCompleteRequest(BaseModel):
    doctor_diagnosis: str
    prescription_id: str | None = None


class TeleconsultSessionResponse(BaseModel):
    id: str
    patient_id: str
    requesting_user_id: str
    doctor_user_id: str | None = None
    sub_centre_branch_id: str
    hospital_branch_id: str
    room_id: str
    status: str
    chief_complaint: str
    vitals_snapshot: dict
    doctor_diagnosis: str | None = None
    prescription_id: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    patient_name: str | None = None
    patient_mrn: str | None = None
    requesting_user_name: str | None = None
    doctor_user_name: str | None = None
    sub_centre_name: str | None = None

    model_config = {"from_attributes": True}
