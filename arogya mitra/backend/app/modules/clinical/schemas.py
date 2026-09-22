"""Clinical EMR and Prescription Pydantic Schemas."""

from datetime import datetime
from pydantic import BaseModel, Field


class MedicationItem(BaseModel):
    medicine_name: str
    generic_name: str | None = None
    dosage: str = "1 tablet"
    frequency: str = "1-0-1 (Twice daily)"
    duration: str = "5 days"
    instructions: str | None = "After meals"


class PrescriptionCreate(BaseModel):
    patient_id: str
    consultation_id: str | None = None
    medications: list[MedicationItem]
    diet_lifestyle_advice: str | None = None
    follow_up_date: datetime | None = None


class PrescriptionResponse(BaseModel):
    id: str
    consultation_id: str | None = None
    patient_id: str
    doctor_user_id: str
    branch_id: str
    medications: list[dict]
    diet_lifestyle_advice: str | None = None
    follow_up_date: datetime | None = None
    is_dispensed: bool
    created_at: datetime
    updated_at: datetime

    patient_name: str | None = None
    patient_mrn: str | None = None
    doctor_name: str | None = None

    model_config = {"from_attributes": True}


class ConsultationCreate(BaseModel):
    patient_id: str
    visit_type: str = "OPD"
    chief_complaint: str
    clinical_notes: str | None = None
    diagnosis: str
    snomed_codes: list[str] = []
    icd10_codes: list[str] = []
    vitals: dict = Field(default_factory=dict)
    prescription: PrescriptionCreate | None = None


class ConsultationResponse(BaseModel):
    id: str
    patient_id: str
    doctor_user_id: str
    branch_id: str
    visit_type: str
    chief_complaint: str
    clinical_notes: str | None = None
    diagnosis: str
    snomed_codes: list[str]
    icd10_codes: list[str]
    vitals: dict
    created_at: datetime
    updated_at: datetime

    patient_name: str | None = None
    patient_mrn: str | None = None
    doctor_name: str | None = None
    prescriptions: list[PrescriptionResponse] = []

    model_config = {"from_attributes": True}
