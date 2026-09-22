from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database.dependencies import get_db
from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.modules.immunization import service
from app.modules.immunization.schemas import (
    VaccineCatalogResponse,
    ChildImmunizationResponse,
    VaccineAdministerRequest,
    ColdChainEquipmentResponse,
    TemperatureLogResponse,
    SupplyForecastResponse,
)

router = APIRouter(prefix="/immunization", tags=["Universal Immunization & eVIN Cold Chain"])


@router.get("/catalog", response_model=List[VaccineCatalogResponse])
async def get_uip_vaccines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    vaccines = await service.get_uip_catalog(db)
    return vaccines


@router.get("/child/{child_id}", response_model=List[ChildImmunizationResponse])
async def get_child_immunization_pass(
    child_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        records = await service.generate_child_immunization_schedule(db, child_id)
        return [
            ChildImmunizationResponse(
                id=r.id,
                child_patient_id=r.child_patient_id,
                child_name=f"{r.child.first_name} {r.child.last_name}" if r.child else None,
                child_dob=str(r.child.date_of_birth) if (r.child and r.child.date_of_birth) else None,
                mother_name=f"{r.mother.first_name} {r.mother.last_name}" if r.mother else None,
                vaccine_name=r.vaccine.name if r.vaccine else "Vaccine",
                target_disease=r.vaccine.target_disease if r.vaccine else "General",
                dose_number=r.vaccine.dose_number if r.vaccine else "Dose",
                scheduled_date=r.scheduled_date,
                administered_date=r.administered_date,
                batch_number=r.batch_number,
                status=r.status,
                aefi_reported=r.aefi_reported,
                asha_notified=r.asha_notified,
            )
            for r in records
        ]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/records/{record_id}/administer", response_model=ChildImmunizationResponse)
async def record_vaccination(
    record_id: str,
    data: VaccineAdministerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        rec = await service.administer_child_vaccine(db, current_user, record_id, data)
        return ChildImmunizationResponse(
            id=rec.id,
            child_patient_id=rec.child_patient_id,
            child_name=f"{rec.child.first_name} {rec.child.last_name}" if rec.child else None,
            child_dob=str(rec.child.date_of_birth) if (rec.child and rec.child.date_of_birth) else None,
            mother_name=f"{rec.mother.first_name} {rec.mother.last_name}" if rec.mother else None,
            vaccine_name=rec.vaccine.name if rec.vaccine else "Vaccine",
            target_disease=rec.vaccine.target_disease if rec.vaccine else "General",
            dose_number=rec.vaccine.dose_number if rec.vaccine else "Dose",
            scheduled_date=rec.scheduled_date,
            administered_date=rec.administered_date,
            batch_number=rec.batch_number,
            status=rec.status,
            aefi_reported=rec.aefi_reported,
            asha_notified=rec.asha_notified,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/cold-chain", response_model=List[ColdChainEquipmentResponse])
async def get_cold_chain_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    equipment = await service.get_cold_chain_telemetry(db)
    return [
        ColdChainEquipmentResponse(
            id=eq.id,
            equipment_code=eq.equipment_code,
            equipment_type=eq.equipment_type,
            current_temperature_c=eq.current_temperature_c,
            target_min_c=eq.target_min_c,
            target_max_c=eq.target_max_c,
            power_source=eq.power_source,
            status=eq.status,
            recent_logs=[
                TemperatureLogResponse(
                    id=l.id,
                    recorded_at=l.recorded_at,
                    temperature_c=l.temperature_c,
                    ambient_temp_c=l.ambient_temp_c,
                    is_excursion=l.is_excursion,
                )
                for l in eq.logs
            ],
        )
        for eq in equipment
    ]


@router.get("/forecast", response_model=List[SupplyForecastResponse])
async def get_supply_demand_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    forecasts = await service.get_demand_forecasts(db)
    return forecasts
