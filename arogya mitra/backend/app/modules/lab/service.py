import uuid
import random
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.lab.models import LabTestCatalog, LabOrder, LabOrderItem, LabSample
from app.modules.lab.schemas import (
    LabOrderCreate,
    LabResultEntryRequest,
    DiagnosticReportResponse,
    LabOrderResponse,
    LabOrderItemResponse,
    LabSampleResponse,
)
from app.modules.patients.models import Patient
from app.core.auth.models import User

DEFAULT_EDL_TESTS = [
    {
        "test_code": "HB",
        "name": "Hemoglobin (Hb)",
        "category": "HEMATOLOGY",
        "sample_type": "WHOLE_BLOOD",
        "vacutainer_color": "LAVENDER_EDTA",
        "units": "g/dL",
        "normal_min": 12.0,
        "normal_max": 16.5,
        "critical_low": 7.0,
        "critical_high": 20.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "PLT",
        "name": "Platelet Count",
        "category": "HEMATOLOGY",
        "sample_type": "WHOLE_BLOOD",
        "vacutainer_color": "LAVENDER_EDTA",
        "units": "cells/mcL",
        "normal_min": 150000.0,
        "normal_max": 450000.0,
        "critical_low": 50000.0,
        "critical_high": 1000000.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "WBC",
        "name": "Total Leukocyte Count (TLC)",
        "category": "HEMATOLOGY",
        "sample_type": "WHOLE_BLOOD",
        "vacutainer_color": "LAVENDER_EDTA",
        "units": "/mcL",
        "normal_min": 4000.0,
        "normal_max": 11000.0,
        "critical_low": 2000.0,
        "critical_high": 30000.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "FBS",
        "name": "Fasting Blood Sugar (FBS)",
        "category": "BIOCHEMISTRY",
        "sample_type": "PLASMA",
        "vacutainer_color": "GREY_FLUORIDE",
        "units": "mg/dL",
        "normal_min": 70.0,
        "normal_max": 100.0,
        "critical_low": 50.0,
        "critical_high": 300.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "CREAT",
        "name": "Serum Creatinine",
        "category": "BIOCHEMISTRY",
        "sample_type": "SERUM",
        "vacutainer_color": "YELLOW_SST",
        "units": "mg/dL",
        "normal_min": 0.6,
        "normal_max": 1.2,
        "critical_low": 0.3,
        "critical_high": 4.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "BILI",
        "name": "Serum Total Bilirubin",
        "category": "BIOCHEMISTRY",
        "sample_type": "SERUM",
        "vacutainer_color": "YELLOW_SST",
        "units": "mg/dL",
        "normal_min": 0.2,
        "normal_max": 1.2,
        "critical_low": 0.0,
        "critical_high": 12.0,
        "price_inr": 0.0,
    },
    {
        "test_code": "DENGUE_NS1",
        "name": "Dengue NS1 Antigen Rapid Test",
        "category": "SEROLOGY",
        "sample_type": "SERUM",
        "vacutainer_color": "RED_PLAIN",
        "units": "Result",
        "normal_min": None,
        "normal_max": None,
        "critical_low": None,
        "critical_high": None,
        "price_inr": 0.0,
    },
    {
        "test_code": "MALARIA_AG",
        "name": "Malaria Rapid Diagnostic Test (Pv/Pf)",
        "category": "SEROLOGY",
        "sample_type": "WHOLE_BLOOD",
        "vacutainer_color": "LAVENDER_EDTA",
        "units": "Result",
        "normal_min": None,
        "normal_max": None,
        "critical_low": None,
        "critical_high": None,
        "price_inr": 0.0,
    },
    {
        "test_code": "TB_AFB",
        "name": "Sputum Smear for AFB (Tuberculosis)",
        "category": "MICROBIOLOGY",
        "sample_type": "SPUTUM",
        "vacutainer_color": "SPUTUM_CUP",
        "units": "Result",
        "normal_min": None,
        "normal_max": None,
        "critical_low": None,
        "critical_high": None,
        "price_inr": 0.0,
    },
]


async def ensure_default_lab_tests(db: AsyncSession):
    for t_data in DEFAULT_EDL_TESTS:
        stmt = select(LabTestCatalog).where(LabTestCatalog.test_code == t_data["test_code"])
        result = await db.execute(stmt)
        if not result.scalar_one_or_none():
            test_obj = LabTestCatalog(**t_data)
            db.add(test_obj)
    await db.commit()


async def get_test_catalog(db: AsyncSession) -> list[LabTestCatalog]:
    await ensure_default_lab_tests(db)
    stmt = select(LabTestCatalog).where(LabTestCatalog.is_active == True).order_by(LabTestCatalog.category)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_lab_order(db: AsyncSession, user: User, data: LabOrderCreate) -> LabOrder:
    await ensure_default_lab_tests(db)

    # Generate sequential order number
    now = datetime.now(timezone.utc)
    order_num = f"LAB-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    branch_id = data.branch_id or user.branch_id
    if not branch_id:
        # Fallback to any active branch
        from app.modules.admin.models import Branch
        b_res = await db.execute(select(Branch).limit(1))
        branch = b_res.scalar_one_or_none()
        branch_id = branch.id if branch else str(uuid.uuid4())

    order = LabOrder(
        order_number=order_num,
        patient_id=data.patient_id,
        branch_id=branch_id,
        ordered_by_user_id=user.id,
        clinical_indication=data.clinical_indication or "Routine Diagnostic Workup",
        urgency=data.urgency or "ROUTINE",
        status="ORDERED",
    )
    db.add(order)
    await db.flush()

    # Add items and collect required sample types
    needed_sample_types = {}
    for test_id in data.test_ids:
        test = await db.get(LabTestCatalog, test_id)
        if test:
            item = LabOrderItem(
                order_id=order.id,
                test_id=test.id,
                result_value="PENDING",
            )
            db.add(item)
            needed_sample_types[test.sample_type] = test.vacutainer_color

    # Generate barcoded Vacutainers
    for s_type, v_color in needed_sample_types.items():
        sample = LabSample(
            barcode=f"SMP-{order_num[-4:]}-{s_type[:3]}-{random.randint(100, 999)}",
            order_id=order.id,
            sample_type=s_type,
            vacutainer_type=v_color,
            status="COLLECTED",
            collected_by_user_id=user.id,
        )
        db.add(sample)

    order.status = "SAMPLE_COLLECTED"
    await db.commit()
    
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order.id)
        .options(
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.samples),
            selectinload(LabOrder.patient),
        )
    )
    res = await db.execute(stmt)
    return res.scalar_one()


async def enter_lab_results(db: AsyncSession, user: User, order_id: str, data: LabResultEntryRequest) -> LabOrder:
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.samples),
            selectinload(LabOrder.patient),
        )
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError("Lab order not found")

    item_map = {item.id: item for item in order.items}

    has_any_critical = False
    for res in data.results:
        item = item_map.get(res.item_id)
        if not item:
            continue

        item.result_value = res.result_value
        item.numeric_value = res.numeric_value
        item.technician_notes = res.technician_notes
        item.verified_by_user_id = user.id
        item.verified_at = datetime.now(timezone.utc)

        # Check Abnormal & Critical Thresholds
        test = item.test
        if res.numeric_value is not None and test:
            if test.normal_min is not None and res.numeric_value < test.normal_min:
                item.is_abnormal = True
            elif test.normal_max is not None and res.numeric_value > test.normal_max:
                item.is_abnormal = True
            else:
                item.is_abnormal = False

            if test.critical_low is not None and res.numeric_value <= test.critical_low:
                item.is_critical = True
                has_any_critical = True
            elif test.critical_high is not None and res.numeric_value >= test.critical_high:
                item.is_critical = True
                has_any_critical = True
            else:
                item.is_critical = False
        elif "POSITIVE" in res.result_value.upper() or "DETECTED" in res.result_value.upper():
            item.is_abnormal = True
            if "TB" in (test.test_code if test else "") or "DENGUE" in (test.test_code if test else ""):
                item.is_critical = True
                has_any_critical = True

    order.status = "PUBLISHED" if data.mark_published else "VERIFIED"
    await db.commit()
    
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order.id)
        .options(
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.samples),
            selectinload(LabOrder.patient),
        )
    )
    res = await db.execute(stmt)
    return res.scalar_one()


async def get_lab_orders(db: AsyncSession, branch_id: str | None = None, patient_id: str | None = None) -> list[LabOrder]:
    stmt = (
        select(LabOrder)
        .options(
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.samples),
            selectinload(LabOrder.patient),
        )
        .order_by(LabOrder.created_at.desc())
    )
    if patient_id:
        stmt = stmt.where(LabOrder.patient_id == patient_id)
    if branch_id:
        stmt = stmt.where(LabOrder.branch_id == branch_id)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_diagnostic_report(db: AsyncSession, order_id: str) -> DiagnosticReportResponse:
    stmt = (
        select(LabOrder)
        .where(LabOrder.id == order_id)
        .options(
            selectinload(LabOrder.items).selectinload(LabOrderItem.test),
            selectinload(LabOrder.samples),
            selectinload(LabOrder.patient),
        )
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError("Lab order not found")

    patient = order.patient
    critical_alerts = []
    item_responses = []

    for item in order.items:
        test = item.test
        if item.is_critical:
            critical_alerts.append(f"CRITICAL: {test.name if test else 'Test'} = {item.result_value} {test.units or ''}")

        item_responses.append(
            LabOrderItemResponse(
                id=item.id,
                test_id=item.test_id,
                test_name=test.name if test else "Unknown Test",
                test_code=test.test_code if test else "UNK",
                category=test.category if test else "GENERAL",
                units=test.units if test else None,
                normal_min=test.normal_min if test else None,
                normal_max=test.normal_max if test else None,
                result_value=item.result_value,
                numeric_value=item.numeric_value,
                is_abnormal=item.is_abnormal,
                is_critical=item.is_critical,
                technician_notes=item.technician_notes,
                verified_at=item.verified_at,
            )
        )

    # Automated clinical interpretation summary
    if critical_alerts:
        interpretation = "CRITICAL ALERT: Critical lab values detected. Review immediately for inpatient admission, transfusion, or emergency referral."
    elif any(i.is_abnormal for i in order.items):
        interpretation = "Borderline / Abnormal values detected. Correlate with clinical findings and prescribe appropriate pharmacological follow-up."
    else:
        interpretation = "All diagnostic parameters within biological reference intervals. Routine outpatient monitoring recommended."

    return DiagnosticReportResponse(
        order_id=order.id,
        order_number=order.order_number,
        patient_name=f"{patient.first_name} {patient.last_name}" if patient else "Citizen",
        patient_mrn=patient.mrn if patient else "MRN-000",
        patient_gender=patient.gender if patient else "OTHER",
        patient_age_dob=str(patient.date_of_birth) if (patient and patient.date_of_birth) else "1990-01-01",
        ordered_date=order.created_at.strftime("%Y-%m-%d %H:%M") if order.created_at else "",
        reporting_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        has_critical_alerts=len(critical_alerts) > 0,
        critical_alerts=critical_alerts,
        results=item_responses,
        clinical_interpretation=interpretation,
    )
