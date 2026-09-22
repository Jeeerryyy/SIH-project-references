import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database.base import Base


class AmbulanceVehicle(Base):
    __tablename__ = "ambulance_vehicles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_number = Column(String(30), unique=True, index=True, nullable=False)  # e.g., RJ-14-108-4120
    vehicle_type = Column(String(30), default="ALS_ADVANCED")  # ALS_ADVANCED, BLS_BASIC, NEONATAL_AMBULANCE
    base_station_branch_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    current_lat = Column(Float, default=26.9124)
    current_lng = Column(Float, default=75.7873)
    speed_kmh = Column(Float, default=0.0)
    oxygen_cylinder_psi = Column(Float, default=1800.0)  # 2000 psi is full
    fuel_level_pct = Column(Float, default=85.0)
    driver_name = Column(String(100), default="Santosh Shinde")
    driver_phone = Column(String(20), default="+91 98765 43210")
    paramedic_name = Column(String(100), default="Sunil Rao (EMT)")
    status = Column(String(30), default="AVAILABLE")  # AVAILABLE, DISPATCHED, EN_ROUTE_HOSPITAL, MAINTENANCE

    base_station = relationship("Branch")


class EmergencyDispatchCall(Base):
    __tablename__ = "emergency_dispatch_calls"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    call_number = Column(String(30), unique=True, index=True, nullable=False)
    caller_name = Column(String(100), nullable=True)
    caller_phone = Column(String(20), nullable=True)
    location_name = Column(String(255), nullable=False)
    pickup_lat = Column(Float, default=26.9124)
    pickup_lng = Column(Float, default=75.7873)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    chief_complaint = Column(String(255), nullable=False)
    urgency = Column(String(30), default="EMERGENCY_CRITICAL")  # EMERGENCY_CRITICAL, URGENT, ROUTINE_TRANSFER
    assigned_vehicle_id = Column(String(36), ForeignKey("ambulance_vehicles.id"), nullable=True)
    receiving_facility_id = Column(String(36), ForeignKey("branches.id"), nullable=True)
    eta_minutes = Column(Integer, default=8)
    status = Column(String(30), default="DISPATCHED")  # DISPATCHED, ON_SCENE, EN_ROUTE_HOSPITAL, DELIVERED, CANCELLED
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient")
    vehicle = relationship("AmbulanceVehicle")
    receiving_facility = relationship("Branch")
    vitals_stream = relationship("EnRouteVitalsStream", back_populates="dispatch", cascade="all, delete-orphan")


class EnRouteVitalsStream(Base):
    __tablename__ = "en_route_vitals_stream"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dispatch_id = Column(String(36), ForeignKey("emergency_dispatch_calls.id"), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    pulse_bpm = Column(Integer, default=95)
    bp_systolic = Column(Integer, default=130)
    bp_diastolic = Column(Integer, default=85)
    spo2_pct = Column(Float, default=94.0)
    ecg_rhythm = Column(String(50), default="NORMAL_SINUS")  # NORMAL_SINUS, STEMI_ELEVATION, VENTRICULAR_TACHY, ATRIAL_FIB
    gcs_score = Column(Integer, default=14)  # Glasgow Coma Scale (3-15)
    oxygen_flow_lpm = Column(Float, default=4.0)
    paramedic_notes = Column(Text, nullable=True)

    dispatch = relationship("EmergencyDispatchCall", back_populates="vitals_stream")
