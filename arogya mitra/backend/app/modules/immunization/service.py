import uuid
import random
from datetime import datetime, timezone, timedelta, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.modules.immunization.models import (
    VaccineCatalog,
    ChildImmunizationRecord,
    ColdChainEquipment,
    TemperatureLog,
    SupplyForecast,
)
from app.modules.immunization.schemas import (
    VaccineAdministerRequest,
    ChildImmunizationResponse,
    ColdChainEquipmentResponse,
    TemperatureLogResponse,
    SupplyForecastResponse,
)
from app.modules.patients.models import Patient
from app.core.auth.models import User

DEFAULT_UIP_VACCINES = [
    {
        "vaccine_code": "BCG",
        "name": "Bacillus Calmette-Guérin (BCG)",
        "target_disease": "Tuberculosis (Meningeal & Disseminated)",
        "dose_number": "Single Dose",
        "recommended_age_days": 0,
        "route_of_admin": "INTRADERMAL",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "OPV_0",
        "name": "Oral Polio Vaccine (OPV-0)",
        "target_disease": "Poliomyelitis (Infantile Paralysis)",
        "dose_number": "Birth Dose",
        "recommended_age_days": 0,
        "route_of_admin": "ORAL",
        "required_storage_temp_c": "-20 C (Sub-Zero Storage)",
    },
    {
        "vaccine_code": "HEP_B_0",
        "name": "Hepatitis B (Birth Dose)",
        "target_disease": "Perinatal Hepatitis B Infection",
        "dose_number": "Birth Dose",
        "recommended_age_days": 0,
        "route_of_admin": "INTRAMUSCULAR",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "PENTA_1",
        "name": "Pentavalent-1 (DPT + HepB + Hib)",
        "target_disease": "Diphtheria, Pertussis, Tetanus, Hep B, Hib Pneumonia",
        "dose_number": "Dose 1",
        "recommended_age_days": 42,  # 6 weeks
        "route_of_admin": "INTRAMUSCULAR",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "ROTA_1",
        "name": "Rotavirus Vaccine (RVV-1)",
        "target_disease": "Rotavirus Diarrheal Dehydration",
        "dose_number": "Dose 1",
        "recommended_age_days": 42,
        "route_of_admin": "ORAL",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "PENTA_2",
        "name": "Pentavalent-2",
        "target_disease": "Diphtheria, Pertussis, Tetanus, Hep B, Hib",
        "dose_number": "Dose 2",
        "recommended_age_days": 70,  # 10 weeks
        "route_of_admin": "INTRAMUSCULAR",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "PENTA_3",
        "name": "Pentavalent-3",
        "target_disease": "Diphtheria, Pertussis, Tetanus, Hep B, Hib",
        "dose_number": "Dose 3",
        "recommended_age_days": 98,  # 14 weeks
        "route_of_admin": "INTRAMUSCULAR",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "MR_1",
        "name": "Measles & Rubella (MR-1)",
        "target_disease": "Measles & Congenital Rubella Syndrome",
        "dose_number": "Dose 1",
        "recommended_age_days": 270,  # 9 months
        "route_of_admin": "SUBCUTANEOUS",
        "required_storage_temp_c": "+2 to +8 C",
    },
    {
        "vaccine_code": "DPT_BOOSTER_1",
        "name": "DPT Booster-1",
        "target_disease": "Diphtheria, Pertussis, Tetanus",
        "dose_number": "Booster 1",
        "recommended_age_days": 480,  # 16-24 months
        "route_of_admin": "INTRAMUSCULAR",
        "required_storage_temp_c": "+2 to +8 C",
    },
]

DEFAULT_EQUIPMENT = [
    {
        "equipment_code": "ILR-DH-01",
        "equipment_type": "ILR_ICE_LINED_REFRIGERATOR",
        "current_temperature_c": 4.1,
        "target_min_c": 2.0,
        "target_max_c": 8.0,
        "power_source": "GRID_MAINS",
        "status": "NORMAL",
    },
    {
        "equipment_code": "DF-DH-02",
        "equipment_type": "DEEP_FREEZER",
        "current_temperature_c": -18.5,
        "target_min_c": -25.0,
        "target_max_c": -15.0,
        "power_source": "GRID_MAINS",
        "status": "NORMAL",
    },
    {
        "equipment_code": "ILR-CHC-BASSI",
        "equipment_type": "SOLAR_DIRECT_DRIVE",
        "current_temperature_c": 5.2,
        "target_min_c": 2.0,
        "target_max_c": 8.0,
        "power_source": "BATTERY_SOLAR",
        "status": "NORMAL",
    },
]

DEFAULT_FORECASTS = [
    {
        "district_name": "Jaipur Rural & Urban Hub",
        "commodity_name": "ORS (Oral Rehydration Salts)",
        "predicted_demand_units": 12500,
        "current_stock_units": 6800,
        "seasonal_risk_factor": "SUMMER_MONSOON_DIARRHEA_SPIKE",
        "recommended_buffer_units": 6000,
        "forecast_month": "Aug - Oct Peak",
    },
    {
        "district_name": "Jaipur Rural & Urban Hub",
        "commodity_name": "Dengue NS1 Antigen Rapid Test Kits",
        "predicted_demand_units": 4500,
        "current_stock_units": 1800,
        "seasonal_risk_factor": "POST_MONSOON_VECTOR_SURGE",
        "recommended_buffer_units": 3000,
        "forecast_month": "Aug - Nov Peak",
    },
    {
        "district_name": "Jaipur Rural & Urban Hub",
        "commodity_name": "Anti-Snake Venom (ASV Lyophilized)",
        "predicted_demand_units": 800,
        "current_stock_units": 320,
        "seasonal_risk_factor": "AGRICULTURAL_MONSOON_EXPOSURE",
        "recommended_buffer_units": 500,
        "forecast_month": "Monsoon Buffer",
    },
    {
        "district_name": "Jaipur Rural & Urban Hub",
        "commodity_name": "Pentavalent Vaccine Vials (10-dose)",
        "predicted_demand_units": 3200,
        "current_stock_units": 2900,
        "seasonal_risk_factor": "UIP_ROUTINE_BIRTH_COHORT",
        "recommended_buffer_units": 1000,
        "forecast_month": "Monthly Routine",
    },
]


async def ensure_default_immunization_data(db: AsyncSession):
    # 1. Vaccines
    for v_data in DEFAULT_UIP_VACCINES:
        stmt = select(VaccineCatalog).where(VaccineCatalog.vaccine_code == v_data["vaccine_code"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            db.add(VaccineCatalog(**v_data))

    # 2. Equipment
    for eq_data in DEFAULT_EQUIPMENT:
        stmt = select(ColdChainEquipment).where(ColdChainEquipment.equipment_code == eq_data["equipment_code"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            eq = ColdChainEquipment(**eq_data)
            db.add(eq)
            await db.flush()

            # Add temperature logs
            for i in range(5):
                log_time = datetime.now(timezone.utc) - timedelta(hours=i * 2)
                t_log = TemperatureLog(
                    equipment_id=eq.id,
                    recorded_at=log_time,
                    temperature_c=eq.current_temperature_c + (random.random() * 0.6 - 0.3),
                    ambient_temp_c=31.5 + (random.random() * 2),
                    is_excursion=False,
                )
                db.add(t_log)

    # 3. Forecasts
    for f_data in DEFAULT_FORECASTS:
        stmt = select(SupplyForecast).where(SupplyForecast.commodity_name == f_data["commodity_name"])
        res = await db.execute(stmt)
        if not res.scalar_one_or_none():
            db.add(SupplyForecast(**f_data))

    await db.commit()


async def get_uip_catalog(db: AsyncSession) -> list[VaccineCatalog]:
    await ensure_default_immunization_data(db)
    stmt = select(VaccineCatalog).order_by(VaccineCatalog.recommended_age_days)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def generate_child_immunization_schedule(db: AsyncSession, child_patient_id: str) -> list[ChildImmunizationRecord]:
    await ensure_default_immunization_data(db)
    child = await db.get(Patient, child_patient_id)
    if not child:
        raise ValueError("Child patient not found")

    # Check if already generated
    existing = await db.execute(
        select(ChildImmunizationRecord)
        .where(ChildImmunizationRecord.child_patient_id == child_patient_id)
        .options(
            selectinload(ChildImmunizationRecord.vaccine),
            selectinload(ChildImmunizationRecord.child),
            selectinload(ChildImmunizationRecord.mother),
        )
    )
    records = list(existing.scalars().all())
    if records:
        return records

    dob = datetime.now(timezone.utc)
    if child.date_of_birth:
        if isinstance(child.date_of_birth, datetime):
            dob = child.date_of_birth if child.date_of_birth.tzinfo else child.date_of_birth.replace(tzinfo=timezone.utc)
        elif isinstance(child.date_of_birth, date):
            dob = datetime.combine(child.date_of_birth, datetime.min.time(), tzinfo=timezone.utc)
        elif isinstance(child.date_of_birth, str):
            try:
                parsed = datetime.fromisoformat(child.date_of_birth)
                dob = parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
            except Exception:
                dob = datetime.now(timezone.utc)

    vaccines = await get_uip_catalog(db)
    now = datetime.now(timezone.utc)
    for idx, v in enumerate(vaccines):
        sched_date = dob + timedelta(days=v.recommended_age_days)
        is_past = sched_date < now
        rec = ChildImmunizationRecord(
            child_patient_id=child.id,
            vaccine_id=v.id,
            scheduled_date=sched_date,
            administered_date=sched_date if idx < 3 else None,
            batch_number=f"VAC-{v.vaccine_code[:3]}-2026B" if idx < 3 else None,
            status="ADMINISTERED" if idx < 3 else ("DUE" if is_past else "SCHEDULED"),
            aefi_reported="NONE",
            asha_notified=True if is_past and idx >= 3 else False,
        )
        db.add(rec)

    await db.commit()
    final_res = await db.execute(
        select(ChildImmunizationRecord)
        .where(ChildImmunizationRecord.child_patient_id == child_patient_id)
        .options(
            selectinload(ChildImmunizationRecord.vaccine),
            selectinload(ChildImmunizationRecord.child),
            selectinload(ChildImmunizationRecord.mother),
        )
    )
    return list(final_res.scalars().all())


async def administer_child_vaccine(db: AsyncSession, user: User, record_id: str, data: VaccineAdministerRequest) -> ChildImmunizationRecord:
    rec = await db.get(ChildImmunizationRecord, record_id)
    if not rec:
        raise ValueError("Immunization record not found")

    rec.status = "ADMINISTERED"
    rec.administered_date = datetime.now(timezone.utc)
    rec.batch_number = data.batch_number
    rec.aefi_reported = data.aefi_reported or "NONE"
    rec.administered_by_user_id = user.id

    await db.commit()
    final_res = await db.execute(
        select(ChildImmunizationRecord)
        .where(ChildImmunizationRecord.id == record_id)
        .options(
            selectinload(ChildImmunizationRecord.vaccine),
            selectinload(ChildImmunizationRecord.child),
            selectinload(ChildImmunizationRecord.mother),
        )
    )
    return final_res.scalar_one()


async def get_cold_chain_telemetry(db: AsyncSession) -> list[ColdChainEquipment]:
    await ensure_default_immunization_data(db)
    stmt = select(ColdChainEquipment).options(selectinload(ColdChainEquipment.logs)).order_by(ColdChainEquipment.equipment_code)
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_demand_forecasts(db: AsyncSession) -> list[SupplyForecast]:
    await ensure_default_immunization_data(db)
    stmt = select(SupplyForecast).order_by(SupplyForecast.predicted_demand_units.desc())
    res = await db.execute(stmt)
    return list(res.scalars().all())
