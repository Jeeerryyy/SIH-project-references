from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class AmbulanceVehicleResponse(BaseModel):
    id: str
    vehicle_number: str
    vehicle_type: str
    base_station_branch_id: Optional[str] = None
    current_lat: float
    current_lng: float
    speed_kmh: float
    oxygen_cylinder_psi: float
    fuel_level_pct: float
    driver_name: str
    driver_phone: str
    paramedic_name: str
    status: str

    class Config:
        from_attributes = True


class EnRouteVitalsCreate(BaseModel):
    pulse_bpm: Optional[int] = 95
    bp_systolic: Optional[int] = 130
    bp_diastolic: Optional[int] = 85
    spo2_pct: Optional[float] = 94.0
    ecg_rhythm: Optional[str] = "NORMAL_SINUS"
    gcs_score: Optional[int] = 14
    oxygen_flow_lpm: Optional[float] = 4.0
    paramedic_notes: Optional[str] = None


class EnRouteVitalsResponse(BaseModel):
    id: str
    dispatch_id: str
    recorded_at: datetime
    pulse_bpm: int
    bp_systolic: int
    bp_diastolic: int
    spo2_pct: float
    ecg_rhythm: str
    gcs_score: int
    oxygen_flow_lpm: float
    paramedic_notes: Optional[str] = None

    class Config:
        from_attributes = True


class EmergencyDispatchCreate(BaseModel):
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None
    location_name: str
    pickup_lat: Optional[float] = 26.9124
    pickup_lng: Optional[float] = 75.7873
    patient_id: Optional[str] = None
    chief_complaint: str
    urgency: Optional[str] = "EMERGENCY_CRITICAL"
    receiving_facility_id: Optional[str] = None


class EmergencyDispatchResponse(BaseModel):
    id: str
    call_number: str
    caller_name: Optional[str] = None
    caller_phone: Optional[str] = None
    location_name: str
    pickup_lat: float
    pickup_lng: float
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    chief_complaint: str
    urgency: str
    assigned_vehicle: Optional[AmbulanceVehicleResponse] = None
    eta_minutes: int
    status: str
    created_at: datetime
    latest_vitals: Optional[EnRouteVitalsResponse] = None

    class Config:
        from_attributes = True


class TraumaBayStatusResponse(BaseModel):
    facility_name: str
    trauma_team_assembled: bool
    resuscitation_bay_reserved: bool
    blood_bank_alerted: bool
    ot_readiness: str  # STANDBY, STERILE_READY, IN_USE
    icu_ventilator_allocated: bool
    estimated_arrival_minutes: int
