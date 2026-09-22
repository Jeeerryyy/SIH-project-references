from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.dependencies import get_db
from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.modules.emergency import service
from app.modules.emergency.schemas import (
    AmbulanceVehicleResponse,
    EmergencyDispatchCreate,
    EmergencyDispatchResponse,
    EnRouteVitalsCreate,
    EnRouteVitalsResponse,
    TraumaBayStatusResponse,
)

router = APIRouter(prefix="/emergency", tags=["108 Emergency Ambulance & Trauma Hub"])


@router.get("/fleet", response_model=List[AmbulanceVehicleResponse])
async def get_ambulance_fleet(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    fleet = await service.get_active_fleet(db)
    return fleet


@router.post("/dispatch", response_model=EmergencyDispatchResponse, status_code=status.HTTP_201_CREATED)
async def create_emergency_dispatch(
    data: EmergencyDispatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispatch = await service.create_dispatch_call(db, data)
    latest_v = dispatch.vitals_stream[-1] if dispatch.vitals_stream else None
    return EmergencyDispatchResponse(
        id=dispatch.id,
        call_number=dispatch.call_number,
        caller_name=dispatch.caller_name,
        caller_phone=dispatch.caller_phone,
        location_name=dispatch.location_name,
        pickup_lat=dispatch.pickup_lat,
        pickup_lng=dispatch.pickup_lng,
        patient_id=dispatch.patient_id,
        patient_name=f"{dispatch.patient.first_name} {dispatch.patient.last_name}" if dispatch.patient else None,
        chief_complaint=dispatch.chief_complaint,
        urgency=dispatch.urgency,
        assigned_vehicle=dispatch.vehicle,
        eta_minutes=dispatch.eta_minutes,
        status=dispatch.status,
        created_at=dispatch.created_at,
        latest_vitals=latest_v,
    )


@router.get("/dispatches", response_model=List[EmergencyDispatchResponse])
async def list_emergency_dispatches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    dispatches = await service.get_active_dispatches(db)
    return [
        EmergencyDispatchResponse(
            id=d.id,
            call_number=d.call_number,
            caller_name=d.caller_name,
            caller_phone=d.caller_phone,
            location_name=d.location_name,
            pickup_lat=d.pickup_lat,
            pickup_lng=d.pickup_lng,
            patient_id=d.patient_id,
            patient_name=f"{d.patient.first_name} {d.patient.last_name}" if d.patient else None,
            chief_complaint=d.chief_complaint,
            urgency=d.urgency,
            assigned_vehicle=d.vehicle,
            eta_minutes=d.eta_minutes,
            status=d.status,
            created_at=d.created_at,
            latest_vitals=d.vitals_stream[-1] if d.vitals_stream else None,
        )
        for d in dispatches
    ]


@router.post("/dispatches/{dispatch_id}/vitals", response_model=EnRouteVitalsResponse)
async def post_en_route_vitals(
    dispatch_id: str,
    data: EnRouteVitalsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        stream = await service.stream_en_route_vitals(db, dispatch_id, data)
        return stream
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/dispatches/{dispatch_id}/trauma-bay", response_model=TraumaBayStatusResponse)
async def get_trauma_readiness(
    dispatch_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    status_resp = await service.get_trauma_bay_status(db, dispatch_id)
    return status_resp
