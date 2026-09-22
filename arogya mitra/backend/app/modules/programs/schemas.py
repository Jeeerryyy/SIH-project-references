"""Maternal & NCD Pydantic Schemas."""

from datetime import date, datetime
from pydantic import BaseModel


class MaternalRecordCreate(BaseModel):
    patient_id: str
    lmp_date: date
    edd_date: date | None = None
    gravida: int = 1
    parity: int = 0
    hemoglobin_level: float | None = None
    risk_factors: list[str] = []
    assigned_asha_id: str | None = None
    assigned_anm_id: str | None = None


class MaternalRecordResponse(BaseModel):
    id: str
    patient_id: str
    lmp_date: date
    edd_date: date
    gravida: int
    parity: int
    high_risk_flag: bool
    risk_factors: list[str]
    hemoglobin_level: float | None = None
    trimester: int
    anc_visits_completed: int
    next_visit_due: date | None = None
    assigned_asha_id: str | None = None
    delivery_status: str
    created_at: datetime
    updated_at: datetime

    patient_name: str | None = None
    patient_mrn: str | None = None
    patient_phone: str | None = None
    assigned_asha_name: str | None = None

    model_config = {"from_attributes": True}


class NcdRecordCreate(BaseModel):
    patient_id: str
    condition_type: str
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    fasting_blood_sugar: float | None = None
    random_blood_sugar: float | None = None
    hba1c: float | None = None
    medication_compliance: bool = True
    assigned_asha_id: str | None = None
    notes: str | None = None


class NcdRecordResponse(BaseModel):
    id: str
    patient_id: str
    condition_type: str
    severity: str
    systolic_bp: int | None = None
    diastolic_bp: int | None = None
    fasting_blood_sugar: float | None = None
    random_blood_sugar: float | None = None
    hba1c: float | None = None
    last_checkup_date: date | None = None
    next_checkup_due: date | None = None
    medication_compliance: bool
    assigned_asha_id: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    patient_name: str | None = None
    patient_mrn: str | None = None
    patient_phone: str | None = None
    assigned_asha_name: str | None = None

    model_config = {"from_attributes": True}


class FrontlineTaskResponse(BaseModel):
    task_id: str
    patient_id: str
    patient_name: str
    patient_mrn: str
    task_type: str  # "ANC_OVERDUE", "HIGH_RISK_ANC", "NCD_CRITICAL_BP", "NCD_REFILL"
    priority: str   # "CRITICAL", "HIGH", "ROUTINE"
    due_date: date | None = None
    description: str
