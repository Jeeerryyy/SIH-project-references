"""Pydantic schemas for AI Clinical Decision Support System (CDSS)."""

from typing import Any
from pydantic import BaseModel, Field


class MedicationItemInput(BaseModel):
    name: str
    generic_name: str | None = None
    dosage: str | None = None
    frequency: str | None = None


class CdssEvaluateRequest(BaseModel):
    patient_id: str | None = None
    age: int | None = None
    gender: str | None = None
    is_pregnant: bool = False
    allergies: list[str] = Field(default_factory=list)
    chief_complaints: list[str] = Field(default_factory=list)
    provisional_diagnosis: str | None = None
    vitals: dict[str, Any] = Field(default_factory=dict)
    proposed_medications: list[MedicationItemInput] = Field(default_factory=list)


class DrugInteractionWarning(BaseModel):
    drug_a: str
    drug_b: str
    severity: str  # HIGH, MODERATE, LOW
    clinical_effect: str
    recommendation: str


class ClinicalAlert(BaseModel):
    category: str  # ALLERGY, CONTRAINDICATION, DOSAGE, RED_FLAG
    severity: str  # CRITICAL, WARNING, INFO
    title: str
    description: str
    action_required: str | None = None


class DifferentialDiagnosis(BaseModel):
    condition_name: str
    icd10_code: str
    confidence_score: float  # 0.0 to 1.0
    key_indicators: list[str] = Field(default_factory=list)


class CdssEvaluateResponse(BaseModel):
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL_EMERGENCY
    requires_immediate_referral: bool
    referral_urgency: str | None = None  # ROUTINE, URGENT, EMERGENCY_108
    alerts: list[ClinicalAlert] = Field(default_factory=list)
    drug_interactions: list[DrugInteractionWarning] = Field(default_factory=list)
    differential_diagnoses: list[DifferentialDiagnosis] = Field(default_factory=list)
    lifestyle_and_monitoring_advice: list[str] = Field(default_factory=list)
    rationale_summary: str
