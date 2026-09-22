from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.dependencies import get_db
from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.modules.lab import service
from app.modules.lab.schemas import (
    LabTestCatalogResponse,
    LabOrderCreate,
    LabOrderResponse,
    LabResultEntryRequest,
    DiagnosticReportResponse,
    LabOrderItemResponse,
    LabSampleResponse,
)

router = APIRouter(prefix="/lab", tags=["Laboratory & Diagnostics"])


@router.get("/catalog", response_model=List[LabTestCatalogResponse])
async def get_lab_catalog(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tests = await service.get_test_catalog(db)
    return tests


@router.post("/orders", response_model=LabOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_lab_order(
    data: LabOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = await service.create_lab_order(db, current_user, data)
    # Convert to response
    return LabOrderResponse(
        id=order.id,
        order_number=order.order_number,
        patient_id=order.patient_id,
        patient_name=f"{order.patient.first_name} {order.patient.last_name}" if order.patient else None,
        patient_mrn=order.patient.mrn if order.patient else None,
        branch_id=order.branch_id,
        clinical_indication=order.clinical_indication,
        urgency=order.urgency,
        status=order.status,
        created_at=order.created_at,
        items=[
            LabOrderItemResponse(
                id=i.id,
                test_id=i.test_id,
                test_name=i.test.name if i.test else None,
                test_code=i.test.test_code if i.test else None,
                category=i.test.category if i.test else None,
                units=i.test.units if i.test else None,
                normal_min=i.test.normal_min if i.test else None,
                normal_max=i.test.normal_max if i.test else None,
                result_value=i.result_value,
                numeric_value=i.numeric_value,
                is_abnormal=i.is_abnormal,
                is_critical=i.is_critical,
                technician_notes=i.technician_notes,
                verified_at=i.verified_at,
            )
            for i in order.items
        ],
        samples=[
            LabSampleResponse(
                id=s.id,
                barcode=s.barcode,
                sample_type=s.sample_type,
                vacutainer_type=s.vacutainer_type,
                status=s.status,
                collected_at=s.collected_at,
            )
            for s in order.samples
        ],
    )


@router.get("/orders", response_model=List[LabOrderResponse])
async def list_lab_orders(
    patient_id: Optional[str] = None,
    branch_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    orders = await service.get_lab_orders(db, branch_id=branch_id, patient_id=patient_id)
    return [
        LabOrderResponse(
            id=o.id,
            order_number=o.order_number,
            patient_id=o.patient_id,
            patient_name=f"{o.patient.first_name} {o.patient.last_name}" if o.patient else None,
            patient_mrn=o.patient.mrn if o.patient else None,
            branch_id=o.branch_id,
            clinical_indication=o.clinical_indication,
            urgency=o.urgency,
            status=o.status,
            created_at=o.created_at,
            items=[
                LabOrderItemResponse(
                    id=i.id,
                    test_id=i.test_id,
                    test_name=i.test.name if i.test else None,
                    test_code=i.test.test_code if i.test else None,
                    category=i.test.category if i.test else None,
                    units=i.test.units if i.test else None,
                    normal_min=i.test.normal_min if i.test else None,
                    normal_max=i.test.normal_max if i.test else None,
                    result_value=i.result_value,
                    numeric_value=i.numeric_value,
                    is_abnormal=i.is_abnormal,
                    is_critical=i.is_critical,
                    technician_notes=i.technician_notes,
                    verified_at=i.verified_at,
                )
                for i in o.items
            ],
            samples=[
                LabSampleResponse(
                    id=s.id,
                    barcode=s.barcode,
                    sample_type=s.sample_type,
                    vacutainer_type=s.vacutainer_type,
                    status=s.status,
                    collected_at=s.collected_at,
                )
                for s in o.samples
            ],
        )
        for o in orders
    ]


@router.post("/orders/{order_id}/results", response_model=LabOrderResponse)
async def enter_order_results(
    order_id: str,
    data: LabResultEntryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        order = await service.enter_lab_results(db, current_user, order_id, data)
        return LabOrderResponse(
            id=order.id,
            order_number=order.order_number,
            patient_id=order.patient_id,
            patient_name=f"{order.patient.first_name} {order.patient.last_name}" if order.patient else None,
            patient_mrn=order.patient.mrn if order.patient else None,
            branch_id=order.branch_id,
            clinical_indication=order.clinical_indication,
            urgency=order.urgency,
            status=order.status,
            created_at=order.created_at,
            items=[
                LabOrderItemResponse(
                    id=i.id,
                    test_id=i.test_id,
                    test_name=i.test.name if i.test else None,
                    test_code=i.test.test_code if i.test else None,
                    category=i.test.category if i.test else None,
                    units=i.test.units if i.test else None,
                    normal_min=i.test.normal_min if i.test else None,
                    normal_max=i.test.normal_max if i.test else None,
                    result_value=i.result_value,
                    numeric_value=i.numeric_value,
                    is_abnormal=i.is_abnormal,
                    is_critical=i.is_critical,
                    technician_notes=i.technician_notes,
                    verified_at=i.verified_at,
                )
                for i in order.items
            ],
            samples=[
                LabSampleResponse(
                    id=s.id,
                    barcode=s.barcode,
                    sample_type=s.sample_type,
                    vacutainer_type=s.vacutainer_type,
                    status=s.status,
                    collected_at=s.collected_at,
                )
                for s in order.samples
            ],
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/orders/{order_id}/report", response_model=DiagnosticReportResponse)
async def get_diagnostic_report(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        report = await service.get_diagnostic_report(db, order_id)
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
