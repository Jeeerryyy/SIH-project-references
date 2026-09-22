import uuid
import random
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.emergency.models import AmbulanceVehicle, EmergencyDispatchCall, EnRouteVitalsStream
from app.modules.emergency.schemas import (
    EmergencyDispatchCreate,
    EnRouteVitalsCreate,
    TraumaBayStatusResponse,
    EmergencyDispatchResponse,
    AmbulanceVehicleResponse,
    EnRouteVitalsResponse,
)
from app.modules.admin.models import Branch
from app.modules.patients.models import Patient

DEFAULT_AMBULANCES = [
    {
        "vehicle_number": "RJ-14-108-4101",
        "vehicle_type": "ALS_ADVANCED",
        "current_lat": 26.9124,
        "current_lng": 75.7873,
        "speed_kmh": 62.0,
        "oxygen_cylinder_psi": 1950.0,
        "fuel_level_pct": 92.0,
        "driver_name": "Santosh Shinde",
        "driver_phone": "+91 98765 41010",
        "paramedic_name": "Dr. Vikas Verma (EMT-P)",
        "status": "EN_ROUTE_HOSPITAL",
    },
    {
        "vehicle_number": "RJ-14-108-4102",
        "vehicle_type": "BLS_BASIC",
        "current_lat": 26.8345,
        "current_lng": 76.0421,
        "speed_kmh": 45.0,
        "oxygen_cylinder_psi": 1800.0,
        "fuel_level_pct": 84.0,
        "driver_name": "Ramesh Gurjar",
        "driver_phone": "+91 98765 41020",
        "paramedic_name": "Sunita Meena (EMT)",
        "status": "AVAILABLE",
    },
    {
        "vehicle_number": "RJ-14-108-4103",
        "vehicle_type": "NEONATAL_AMBULANCE",
        "current_lat": 27.0125,
        "current_lng": 75.9520,
        "speed_kmh": 0.0,
        "oxygen_cylinder_psi": 2000.0,
        "fuel_level_pct": 96.0,
        "driver_name": "Kailash Choudhary",
        "driver_phone": "+91 98765 41030",
        "paramedic_name": "Sister Anita (NICU Nurse)",
        "status": "AVAILABLE",
    },
    {
        "vehicle_number": "RJ-14-108-4104",
        "vehicle_type": "ALS_ADVANCED",
        "current_lat": 26.8742,
        "current_lng": 75.7321,
        "speed_kmh": 58.0,
        "oxygen_cylinder_psi": 1700.0,
        "fuel_level_pct": 78.0,
        "driver_name": "Mohan Lal",
        "driver_phone": "+91 98765 41040",
        "paramedic_name": "Deepak Sharma (EMT-P)",
        "status": "DISPATCHED",
    },
]


async def ensure_default_ambulance_fleet(db: AsyncSession):
    for a_data in DEFAULT_AMBULANCES:
        stmt = select(AmbulanceVehicle).where(AmbulanceVehicle.vehicle_number == a_data["vehicle_number"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            db.add(AmbulanceVehicle(**a_data))
    await db.commit()


async def get_active_fleet(db: AsyncSession) -> list[AmbulanceVehicle]:
    await ensure_default_ambulance_fleet(db)
    stmt = select(AmbulanceVehicle).order_by(AmbulanceVehicle.vehicle_number)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def create_dispatch_call(db: AsyncSession, data: EmergencyDispatchCreate) -> EmergencyDispatchCall:
    await ensure_default_ambulance_fleet(db)
    now = datetime.now(timezone.utc)
    call_num = f"108-{now.strftime('%Y%m%d')}-{random.randint(1000, 9999)}"

    # Find available vehicle
    v_stmt = select(AmbulanceVehicle).where(AmbulanceVehicle.status == "AVAILABLE").limit(1)
    v_res = await db.execute(v_stmt)
    vehicle = v_res.scalar_one_or_none()
    if not vehicle:
        # fallback to any vehicle
        any_v = await db.execute(select(AmbulanceVehicle).limit(1))
        vehicle = any_v.scalar_one_or_none()

    if vehicle:
        vehicle.status = "DISPATCHED"

    dispatch = EmergencyDispatchCall(
        call_number=call_num,
        caller_name=data.caller_name or "Emergency Caller",
        caller_phone=data.caller_phone or "+91 98765 00000",
        location_name=data.location_name,
        pickup_lat=data.pickup_lat or 26.9124,
        pickup_lng=data.pickup_lng or 75.7873,
        patient_id=data.patient_id,
        chief_complaint=data.chief_complaint,
        urgency=data.urgency or "EMERGENCY_CRITICAL",
        assigned_vehicle_id=vehicle.id if vehicle else None,
        receiving_facility_id=data.receiving_facility_id,
        eta_minutes=random.randint(5, 12),
        status="DISPATCHED",
    )
    db.add(dispatch)
    await db.flush()

    # Create initial vitals stream
    initial_vitals = EnRouteVitalsStream(
        dispatch_id=dispatch.id,
        pulse_bpm=102,
        bp_systolic=135,
        bp_diastolic=88,
        spo2_pct=93.5,
        ecg_rhythm="NORMAL_SINUS",
        gcs_score=14,
        oxygen_flow_lpm=4.0,
        paramedic_notes="Patient secured on cot. High-flow O2 initiated.",
    )
    db.add(initial_vitals)

    await db.commit()
    stmt = (
        select(EmergencyDispatchCall)
        .where(EmergencyDispatchCall.id == dispatch.id)
        .options(
            selectinload(EmergencyDispatchCall.vehicle),
            selectinload(EmergencyDispatchCall.patient),
            selectinload(EmergencyDispatchCall.vitals_stream),
        )
    )
    res = await db.execute(stmt)
    return res.scalar_one()


async def stream_en_route_vitals(db: AsyncSession, dispatch_id: str, data: EnRouteVitalsCreate) -> EnRouteVitalsStream:
    dispatch = await db.get(EmergencyDispatchCall, dispatch_id)
    if not dispatch:
        raise ValueError("Emergency dispatch call not found")

    dispatch.status = "EN_ROUTE_HOSPITAL"
    stream = EnRouteVitalsStream(
        dispatch_id=dispatch.id,
        pulse_bpm=data.pulse_bpm or 95,
        bp_systolic=data.bp_systolic or 130,
        bp_diastolic=data.bp_diastolic or 85,
        spo2_pct=data.spo2_pct or 94.0,
        ecg_rhythm=data.ecg_rhythm or "NORMAL_SINUS",
        gcs_score=data.gcs_score or 14,
        oxygen_flow_lpm=data.oxygen_flow_lpm or 4.0,
        paramedic_notes=data.paramedic_notes or "Telemetry live feed updating",
    )
    db.add(stream)
    await db.commit()
    await db.refresh(stream)
    return stream


async def get_active_dispatches(db: AsyncSession) -> list[EmergencyDispatchCall]:
    await ensure_default_ambulance_fleet(db)
    stmt = (
        select(EmergencyDispatchCall)
        .options(
            selectinload(EmergencyDispatchCall.vehicle),
            selectinload(EmergencyDispatchCall.patient),
            selectinload(EmergencyDispatchCall.vitals_stream),
        )
        .order_by(EmergencyDispatchCall.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_trauma_bay_status(db: AsyncSession, dispatch_id: str) -> TraumaBayStatusResponse:
    dispatch = await db.get(EmergencyDispatchCall, dispatch_id)
    return TraumaBayStatusResponse(
        facility_name="District Hospital Jaipur (Trauma Hub)",
        trauma_team_assembled=True,
        resuscitation_bay_reserved=True,
        blood_bank_alerted=True,
        ot_readiness="STERILE_READY",
        icu_ventilator_allocated=True,
        estimated_arrival_minutes=dispatch.eta_minutes if dispatch else 6,
    )
