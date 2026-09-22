"""Clinical business logic — EMR history and prescriptions."""

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.core.utils import new_uuid
from app.modules.clinical.models import Consultation, Prescription
from app.modules.clinical.schemas import (
    ConsultationCreate,
    ConsultationResponse,
    PrescriptionCreate,
    PrescriptionResponse,
)


def map_prescription_response(p: Prescription) -> PrescriptionResponse:
    resp = PrescriptionResponse.model_validate(p)
    if p.patient:
        resp.patient_name = f"{p.patient.first_name} {p.patient.last_name or ''}".strip()
        resp.patient_mrn = p.patient.mrn
    if p.doctor:
        resp.doctor_name = p.doctor.full_name
    return resp


def map_consultation_response(c: Consultation) -> ConsultationResponse:
    resp = ConsultationResponse.model_validate(c)
    if c.patient:
        resp.patient_name = f"{c.patient.first_name} {c.patient.last_name or ''}".strip()
        resp.patient_mrn = c.patient.mrn
    if c.doctor:
        resp.doctor_name = c.doctor.full_name
    if c.prescriptions:
        resp.prescriptions = [map_prescription_response(p) for p in c.prescriptions]
    return resp


async def create_consultation(
    db: AsyncSession,
    data: ConsultationCreate,
    *,
    doctor_user_id: str,
    branch_id: str,
) -> ConsultationResponse:
    """Create a clinical consultation and optionally issue a digital prescription."""
    consultation = Consultation(
        id=new_uuid(),
        patient_id=data.patient_id,
        doctor_user_id=doctor_user_id,
        branch_id=branch_id,
        visit_type=data.visit_type,
        chief_complaint=data.chief_complaint,
        clinical_notes=data.clinical_notes,
        diagnosis=data.diagnosis,
        snomed_codes=data.snomed_codes,
        icd10_codes=data.icd10_codes,
        vitals=data.vitals,
    )
    db.add(consultation)
    await db.flush()

    if data.prescription:
        prescription = Prescription(
            id=new_uuid(),
            consultation_id=consultation.id,
            patient_id=data.patient_id,
            doctor_user_id=doctor_user_id,
            branch_id=branch_id,
            medications=[m.model_dump() for m in data.prescription.medications],
            diet_lifestyle_advice=data.prescription.diet_lifestyle_advice,
            follow_up_date=data.prescription.follow_up_date,
        )
        db.add(prescription)
        await db.flush()

    await db.refresh(consultation, ["patient", "doctor", "prescriptions"])
    return map_consultation_response(consultation)


async def get_patient_history(
    db: AsyncSession,
    patient_id: str,
) -> list[ConsultationResponse]:
    """Retrieve longitudinal medical record history (EHR) for a patient."""
    query = (
        select(Consultation)
        .where(Consultation.patient_id == patient_id)
        .order_by(desc(Consultation.created_at))
        .options(selectinload(Consultation.prescriptions))
    )
    result = await db.execute(query)
    consultations = result.scalars().all()
    return [map_consultation_response(c) for c in consultations]
