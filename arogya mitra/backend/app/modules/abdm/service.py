"""ABDM Business Service — M1/M2/M3 Sandbox Engine."""

from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.modules.clinical.models import Consultation, Prescription
from app.modules.patients.models import Patient
from app.modules.abdm.schemas import (
    AbhaGenerateRequest,
    AbhaProfileResponse,
    CareContextItem,
    ConsentExchangeResponse,
    ConsentRequestPayload,
    FhirBundle,
    LinkCareContextRequest,
    LinkCareContextResponse,
)


async def generate_abha(request: AbhaGenerateRequest) -> AbhaProfileResponse:
    if request.otp != "123456" and request.otp != "000000":
        # In real-world, calls ABDM Gateway Aadhaar Auth API
        pass

    # Generate 14-digit ABHA (format: 91-XXXX-XXXX-XXXX)
    p1 = random.randint(1000, 9999)
    p2 = random.randint(1000, 9999)
    p3 = random.randint(1000, 9999)
    abha_number = f"91-{p1}-{p2}-{p3}"

    clean_name = (request.full_name or "Citizen Patient").lower().replace(" ", ".")
    abha_address = f"{clean_name}{random.randint(10, 99)}@abdm"

    qr_payload = f"ABHA:{abha_number}|ADDR:{abha_address}|DOB:{request.year_of_birth}|G:{request.gender}"

    return AbhaProfileResponse(
        abha_number=abha_number,
        abha_address=abha_address,
        full_name=request.full_name or "Citizen Patient",
        gender=request.gender,
        year_of_birth=request.year_of_birth,
        kyc_verified=True,
        qr_code_payload=qr_payload,
        created_at=datetime.utcnow(),
    )


async def link_care_context(
    db: AsyncSession,
    request: LinkCareContextRequest,
) -> LinkCareContextResponse:
    patient = await db.get(Patient, request.patient_id)
    if not patient:
        raise NotFoundError("Patient", request.patient_id)

    # Attach ABHA to patient record if not present
    if not patient.abha_id:
        patient.abha_id = request.abha_number

    # Fetch patient's past encounters
    c_stmt = select(Consultation).where(Consultation.patient_id == request.patient_id)
    c_res = await db.execute(c_stmt)
    consultations = c_res.scalars().all()

    care_contexts: list[CareContextItem] = [
        CareContextItem(
            reference_number=f"MRN-{patient.mrn}",
            display=f"Master Patient Record ({patient.full_name})",
            type="PATIENT_RECORD",
        )
    ]

    for c in consultations:
        care_contexts.append(
            CareContextItem(
                reference_number=f"ENC-{c.id[:8]}",
                display=f"Consultation: {c.diagnosis} ({c.visit_type})",
                type="OPD_VISIT",
            )
        )

    await db.commit()

    return LinkCareContextResponse(
        link_token=f"TOKEN-HIP-{uuid.uuid4().hex[:12]}",
        patient_id=request.patient_id,
        abha_number=request.abha_number,
        hip_facility_id=request.hip_facility_id,
        care_contexts=care_contexts,
        status="LINKED",
        linked_at=datetime.utcnow(),
    )


async def exchange_consent_and_fetch_fhir(
    db: AsyncSession,
    request: ConsentRequestPayload,
) -> ConsentExchangeResponse:
    # 1. Lookup patient by ABHA
    p_stmt = select(Patient).where(Patient.abha_id == request.patient_abha)
    p_res = await db.execute(p_stmt)
    patient = p_res.scalar_one_or_none()

    patient_name = patient.full_name if patient else "Citizen Patient"

    patient_gender = patient.gender.lower() if patient else "male"
    patient_mrn = patient.mrn if patient else "MH-2026-0041"

    # 2. Build compliant FHIR R4 document bundle
    now = datetime.utcnow()
    fhir_entries: list[dict] = [
        {
            "fullUrl": f"urn:uuid:patient-{patient.id if patient else 'demo'}",
            "resource": {
                "resourceType": "Patient",
                "id": patient.id if patient else "demo-pat",
                "identifier": [
                    {"system": "https://healthid.ndhm.gov.in", "value": request.patient_abha},
                    {"system": "https://arogyamitra.gov.in/mrn", "value": patient_mrn},
                ],
                "name": [{"text": patient_name}],
                "gender": patient_gender,
            },
        },
        {
            "fullUrl": f"urn:uuid:composition-{uuid.uuid4().hex[:8]}",
            "resource": {
                "resourceType": "Composition",
                "status": "final",
                "type": {
                    "coding": [
                        {
                            "system": "http://snomed.info/sct",
                            "code": "371530004",
                            "display": "Clinical consultation report",
                        }
                    ]
                },
                "subject": {"reference": f"Patient/{patient.id if patient else 'demo'}"},
                "date": now.isoformat(),
                "title": "Arogya Mitra Longitudinal Health Record",
            },
        },
        {
            "fullUrl": f"urn:uuid:condition-{uuid.uuid4().hex[:8]}",
            "resource": {
                "resourceType": "Condition",
                "clinicalStatus": {
                    "coding": [
                        {"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}
                    ]
                },
                "code": {
                    "coding": [
                        {"system": "http://hl7.org/fhir/sid/icd-10", "code": "I10", "display": "Essential Hypertension"},
                        {"system": "http://snomed.info/sct", "code": "38341003", "display": "Hypertensive disorder"},
                    ]
                },
                "subject": {"reference": f"Patient/{patient.id if patient else 'demo'}"},
            },
        },
        {
            "fullUrl": f"urn:uuid:medicationrequest-{uuid.uuid4().hex[:8]}",
            "resource": {
                "resourceType": "MedicationRequest",
                "status": "active",
                "intent": "order",
                "medicationCodeableConcept": {
                    "text": "Tab. Amlodipine 5mg (Jan Aushadhi Generic)"
                },
                "dosageInstruction": [{"text": "1 tablet once daily in morning after food"}],
            },
        },
    ]

    bundle = FhirBundle(
        resourceType="Bundle",
        type="document",
        timestamp=now,
        entry=fhir_entries,
    )

    consent_id = f"ABDM-CONSENT-{uuid.uuid4().hex[:10].upper()}"

    return ConsentExchangeResponse(
        consent_id=consent_id,
        patient_abha=request.patient_abha,
        status="GRANTED",
        granted_at=now,
        valid_until=now + timedelta(days=30),
        fhir_bundle=bundle,
    )
