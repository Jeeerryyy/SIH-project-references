"""ABDM (Ayushman Bharat Digital Mission) Pydantic Schemas."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


# --- M1 Milestone: ABHA Generation ---
class AbhaGenerateRequest(BaseModel):
    id_type: str = "AADHAAR"  # AADHAAR or MOBILE
    id_value: str = Field(description="12-digit Aadhaar or 10-digit Mobile")
    otp: str = "123456"  # Mock OTP
    full_name: str | None = None
    gender: str = "MALE"
    year_of_birth: int = 1990


class AbhaProfileResponse(BaseModel):
    abha_number: str  # 14-digit format: 91-4820-9182-3910
    abha_address: str  # e.g., rajesh.patil@abdm
    full_name: str
    gender: str
    year_of_birth: int
    kyc_verified: bool = True
    qr_code_payload: str
    created_at: datetime


# --- M2 Milestone: HIP Care-Context Discovery & Linking ---
class LinkCareContextRequest(BaseModel):
    patient_id: str
    abha_number: str
    hip_facility_id: str


class CareContextItem(BaseModel):
    reference_number: str  # e.g. MRN or Visit ID
    display: str  # e.g. "OPD Consultation - General Medicine"
    type: str  # OPD_VISIT, TELECONSULT, PRESCRIPTION, DISCHARGE_SUMMARY


class LinkCareContextResponse(BaseModel):
    link_token: str
    patient_id: str
    abha_number: str
    hip_facility_id: str
    care_contexts: list[CareContextItem]
    status: str = "LINKED"
    linked_at: datetime


# --- M3 Milestone: HIU Consent & FHIR R4 Encrypted Bundle ---
class ConsentRequestPayload(BaseModel):
    patient_abha: str
    hiu_facility_id: str
    purpose: str = "CARETREATMENT"  # Care and Treatment
    data_range_from: datetime | None = None
    data_range_to: datetime | None = None


class FhirResourceEntry(BaseModel):
    resourceType: str
    id: str
    details: dict[str, Any]


class FhirBundle(BaseModel):
    resourceType: str = "Bundle"
    type: str = "document"
    timestamp: datetime
    entry: list[dict[str, Any]]


class ConsentExchangeResponse(BaseModel):
    consent_id: str
    patient_abha: str
    status: str  # REQUESTED, GRANTED, DENIED, EXPIRED
    granted_at: datetime
    valid_until: datetime
    fhir_bundle: FhirBundle
