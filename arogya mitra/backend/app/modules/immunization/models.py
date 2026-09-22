import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database.base import Base


class VaccineCatalog(Base):
    __tablename__ = "vaccine_catalog"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vaccine_code = Column(String(30), unique=True, index=True, nullable=False)  # BCG, OPV_0, HEP_B_0, PENTA_1, ROTA_1, PCV_1, MR_1, DPT_BOOSTER
    name = Column(String(100), nullable=False)
    target_disease = Column(String(100), nullable=False)
    dose_number = Column(String(20), default="Dose 1")
    recommended_age_days = Column(Integer, default=0)  # 0 for birth, 42 for 6 weeks, 70 for 10 weeks, 98 for 14 weeks, 270 for 9 months
    route_of_admin = Column(String(50), default="INTRAMUSCULAR")  # ORAL, INTRADERMAL, INTRAMUSCULAR, SUBCUTANEOUS
    required_storage_temp_c = Column(String(30), default="+2 to +8 C")
    is_uip_essential = Column(Boolean, default=True)


class ChildImmunizationRecord(Base):
    __tablename__ = "child_immunization_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    child_patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    mother_patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    vaccine_id = Column(String(36), ForeignKey("vaccine_catalog.id"), nullable=False)
    scheduled_date = Column(DateTime(timezone=True), nullable=False)
    administered_date = Column(DateTime(timezone=True), nullable=True)
    batch_number = Column(String(50), nullable=True)
    administered_by_user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    status = Column(String(30), default="SCHEDULED")  # SCHEDULED, DUE, OVERDUE, ADMINISTERED, MISSED
    aefi_reported = Column(String(50), default="NONE")  # NONE, MILD_FEVER, LOCAL_SWELLING, ANAPHYLAXIS
    asha_notified = Column(Boolean, default=False)

    child = relationship("Patient", foreign_keys=[child_patient_id])
    mother = relationship("Patient", foreign_keys=[mother_patient_id])
    vaccine = relationship("VaccineCatalog")
    administered_by = relationship("User")


class ColdChainEquipment(Base):
    __tablename__ = "cold_chain_equipment"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_code = Column(String(30), unique=True, index=True, nullable=False)  # ILR-DH-01, DF-CHC-02
    equipment_type = Column(String(50), default="ILR_ICE_LINED_REFRIGERATOR")  # ILR_ICE_LINED_REFRIGERATOR, DEEP_FREEZER, SOLAR_DIRECT_DRIVE
    branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    current_temperature_c = Column(Float, default=4.2)
    target_min_c = Column(Float, default=2.0)
    target_max_c = Column(Float, default=8.0)
    power_source = Column(String(30), default="GRID_MAINS")  # GRID_MAINS, BATTERY_SOLAR, GENERATOR
    status = Column(String(30), default="NORMAL")  # NORMAL, EXCURSION_ALARM, DEFROSTING

    branch = relationship("Branch")
    logs = relationship("TemperatureLog", back_populates="equipment", cascade="all, delete-orphan")


class TemperatureLog(Base):
    __tablename__ = "temperature_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    equipment_id = Column(String(36), ForeignKey("cold_chain_equipment.id"), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    temperature_c = Column(Float, nullable=False)
    ambient_temp_c = Column(Float, default=32.0)
    is_excursion = Column(Boolean, default=False)

    equipment = relationship("ColdChainEquipment", back_populates="logs")


class SupplyForecast(Base):
    __tablename__ = "supply_forecasts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    district_name = Column(String(100), default="Jaipur Rural & Urban Hub")
    commodity_name = Column(String(100), nullable=False)  # ORS Packets, Dengue NS1 Kits, Paracetamol Syrup, Chloroquine, Anti-Snake Venom
    predicted_demand_units = Column(Integer, nullable=False)
    current_stock_units = Column(Integer, nullable=False)
    seasonal_risk_factor = Column(String(100), default="MONSOON_VECTOR_SURGE")
    recommended_buffer_units = Column(Integer, nullable=False)
    forecast_month = Column(String(20), default="Next 30 Days")
