"""Maternal & NCD business logic, automated risk scoring, and frontline task builder."""

from datetime import date, timedelta
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.utils import new_uuid
from app.modules.programs.models import MaternalRecord, NcdRecord, NcdSeverity
from app.modules.programs.schemas import (
    MaternalRecordCreate,
    MaternalRecordResponse,
    NcdRecordCreate,
    NcdRecordResponse,
    FrontlineTaskResponse,
)


def calculate_anc_details(lmp: date, hb: float | None, manual_risks: list[str]) -> tuple[date, int, bool, list[str]]:
    """Auto-computes EDD (LMP + 280 days), current trimester, and high-risk flags."""
    edd = lmp + timedelta(days=280)
    today = date.today()
    days_pregnant = max(0, (today - lmp).days)

    if days_pregnant < 90:
        trimester = 1
    elif days_pregnant < 180:
        trimester = 2
    else:
        trimester = 3

    risks = list(manual_risks)
    is_high_risk = len(risks) > 0

    if hb is not None and hb < 8.0:
        if "SEVERE_ANEMIA" not in risks:
            risks.append("SEVERE_ANEMIA")
        is_high_risk = True

    return edd, trimester, is_high_risk, risks


def calculate_ncd_severity(condition: str, sys: int | None, dia: int | None, fbs: float | None, rbs: float | None) -> str:
    """Auto-determines NCD risk staging."""
    if condition == "HYPERTENSION" and sys and dia:
        if sys >= 160 or dia >= 100:
            return NcdSeverity.CRITICAL_HIGH_RISK.value
        elif sys >= 140 or dia >= 90:
            return NcdSeverity.STAGE_2.value
        elif sys >= 130 or dia >= 85:
            return NcdSeverity.STAGE_1.value
    elif condition == "DIABETES" and (fbs or rbs):
        if (fbs and fbs >= 200) or (rbs and rbs >= 300):
            return NcdSeverity.CRITICAL_HIGH_RISK.value
        elif (fbs and fbs >= 126) or (rbs and rbs >= 200):
            return NcdSeverity.STAGE_2.value
        elif (fbs and fbs >= 100) or (rbs and rbs >= 140):
            return NcdSeverity.STAGE_1.value

    return NcdSeverity.NORMAL.value


def map_maternal_response(m: MaternalRecord) -> MaternalRecordResponse:
    resp = MaternalRecordResponse.model_validate(m)
    if m.patient:
        resp.patient_name = f"{m.patient.first_name} {m.patient.last_name or ''}".strip()
        resp.patient_mrn = m.patient.mrn
        resp.patient_phone = m.patient.phone
    if m.assigned_asha:
        resp.assigned_asha_name = m.assigned_asha.full_name
    return resp


def map_ncd_response(n: NcdRecord) -> NcdRecordResponse:
    resp = NcdRecordResponse.model_validate(n)
    if n.patient:
        resp.patient_name = f"{n.patient.first_name} {n.patient.last_name or ''}".strip()
        resp.patient_mrn = n.patient.mrn
        resp.patient_phone = n.patient.phone
    if n.assigned_asha:
        resp.assigned_asha_name = n.assigned_asha.full_name
    return resp


async def enroll_maternal_patient(
    db: AsyncSession,
    data: MaternalRecordCreate,
    *,
    branch_id: str,
) -> MaternalRecordResponse:
    """Enroll a pregnant mother with automated EDD & High-Risk calculation."""
    edd, trimester, is_high_risk, calculated_risks = calculate_anc_details(
        data.lmp_date, data.hemoglobin_level, data.risk_factors
    )

    next_visit = data.lmp_date + timedelta(days=90 * min(trimester, 3))

    record = MaternalRecord(
        id=new_uuid(),
        patient_id=data.patient_id,
        lmp_date=data.lmp_date,
        edd_date=data.edd_date or edd,
        gravida=data.gravida,
        parity=data.parity,
        high_risk_flag=is_high_risk,
        risk_factors=calculated_risks,
        hemoglobin_level=data.hemoglobin_level,
        trimester=trimester,
        anc_visits_completed=1,
        next_visit_due=next_visit,
        assigned_asha_id=data.assigned_asha_id,
        assigned_anm_id=data.assigned_anm_id,
        branch_id=branch_id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record, ["patient", "assigned_asha"])
    return map_maternal_response(record)


async def list_maternal_patients(
    db: AsyncSession,
    *,
    branch_id: str | None = None,
    high_risk_only: bool = False,
) -> list[MaternalRecordResponse]:
    """Query ANC maternal records."""
    query = select(MaternalRecord).order_by(desc(MaternalRecord.created_at))
    if high_risk_only:
        query = query.where(MaternalRecord.high_risk_flag == True)
    if branch_id:
        query = query.where(MaternalRecord.branch_id == branch_id)

    result = await db.execute(query)
    records = result.scalars().all()
    return [map_maternal_response(r) for r in records]


async def record_ncd_screening(
    db: AsyncSession,
    data: NcdRecordCreate,
    *,
    branch_id: str,
) -> NcdRecordResponse:
    """Record NCD screening metrics and evaluate clinical risk severity."""
    severity = calculate_ncd_severity(
        data.condition_type,
        data.systolic_bp,
        data.diastolic_bp,
        data.fasting_blood_sugar,
        data.random_blood_sugar,
    )

    today = date.today()
    next_due = today + timedelta(days=30 if severity == NcdSeverity.CRITICAL_HIGH_RISK.value else 90)

    record = NcdRecord(
        id=new_uuid(),
        patient_id=data.patient_id,
        condition_type=data.condition_type,
        severity=severity,
        systolic_bp=data.systolic_bp,
        diastolic_bp=data.diastolic_bp,
        fasting_blood_sugar=data.fasting_blood_sugar,
        random_blood_sugar=data.random_blood_sugar,
        hba1c=data.hba1c,
        last_checkup_date=today,
        next_checkup_due=next_due,
        medication_compliance=data.medication_compliance,
        assigned_asha_id=data.assigned_asha_id,
        notes=data.notes,
        branch_id=branch_id,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record, ["patient", "assigned_asha"])
    return map_ncd_response(record)


async def list_ncd_patients(
    db: AsyncSession,
    *,
    condition: str | None = None,
    branch_id: str | None = None,
) -> list[NcdRecordResponse]:
    """Query NCD chronic disease cohort."""
    query = select(NcdRecord).order_by(desc(NcdRecord.created_at))
    if condition:
        query = query.where(NcdRecord.condition_type == condition)
    if branch_id:
        query = query.where(NcdRecord.branch_id == branch_id)

    result = await db.execute(query)
    records = result.scalars().all()
    return [map_ncd_response(r) for r in records]


async def get_frontline_tasks(
    db: AsyncSession,
    *,
    branch_id: str | None = None,
) -> list[FrontlineTaskResponse]:
    """Generate prioritized daily tasks for ASHA/ANM workers."""
    tasks = []

    # High-Risk ANC tasks
    m_res = await db.execute(
        select(MaternalRecord).where(MaternalRecord.high_risk_flag == True)
    )
    for m in m_res.scalars().all():
        patient_name = f"{m.patient.first_name} {m.patient.last_name or ''}".strip() if m.patient else "Patient"
        mrn = m.patient.mrn if m.patient else "MRN"
        risks_str = ", ".join(m.risk_factors) if m.risk_factors else "High Risk"
        tasks.append(
            FrontlineTaskResponse(
                task_id=f"TASK-ANC-{m.id[:8]}",
                patient_id=m.patient_id,
                patient_name=patient_name,
                patient_mrn=mrn,
                task_type="HIGH_RISK_ANC",
                priority="CRITICAL",
                due_date=m.next_visit_due or date.today(),
                description=f"Home Visit & Vitals Check: Severe Risk Factors [{risks_str}], Hb: {m.hemoglobin_level or 'N/A'} g/dL",
            )
        )

    # Critical NCD tasks
    n_res = await db.execute(
        select(NcdRecord).where(NcdRecord.severity == NcdSeverity.CRITICAL_HIGH_RISK.value)
    )
    for n in n_res.scalars().all():
        patient_name = f"{n.patient.first_name} {n.patient.last_name or ''}".strip() if n.patient else "Patient"
        mrn = n.patient.mrn if n.patient else "MRN"
        tasks.append(
            FrontlineTaskResponse(
                task_id=f"TASK-NCD-{n.id[:8]}",
                patient_id=n.patient_id,
                patient_name=patient_name,
                patient_mrn=mrn,
                task_type="NCD_CRITICAL_BP",
                priority="CRITICAL",
                due_date=n.next_checkup_due or date.today(),
                description=f"Urgent Follow-Up: {n.condition_type} Stage 3 Critical (BP: {n.systolic_bp}/{n.diastolic_bp} mmHg)",
            )
        )

    return tasks
