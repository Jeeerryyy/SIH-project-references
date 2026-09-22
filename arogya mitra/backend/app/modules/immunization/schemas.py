from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class VaccineCatalogResponse(BaseModel):
    id: str
    vaccine_code: str
    name: str
    target_disease: str
    dose_number: str
    recommended_age_days: int
    route_of_admin: str
    required_storage_temp_c: str
    is_uip_essential: bool

    class Config:
        from_attributes = True


class ChildImmunizationCreate(BaseModel):
    child_patient_id: str
    mother_patient_id: Optional[str] = None
    vaccine_id: str
    scheduled_date: datetime


class VaccineAdministerRequest(BaseModel):
    batch_number: str
    aefi_reported: Optional[str] = "NONE"


class ChildImmunizationResponse(BaseModel):
    id: str
    child_patient_id: str
    child_name: Optional[str] = None
    child_dob: Optional[str] = None
    mother_name: Optional[str] = None
    vaccine_name: str
    target_disease: str
    dose_number: str
    scheduled_date: datetime
    administered_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    status: str
    aefi_reported: str
    asha_notified: bool

    class Config:
        from_attributes = True


class TemperatureLogResponse(BaseModel):
    id: str
    recorded_at: datetime
    temperature_c: float
    ambient_temp_c: float
    is_excursion: bool

    class Config:
        from_attributes = True


class ColdChainEquipmentResponse(BaseModel):
    id: str
    equipment_code: str
    equipment_type: str
    current_temperature_c: float
    target_min_c: float
    target_max_c: float
    power_source: str
    status: str
    recent_logs: List[TemperatureLogResponse] = []

    class Config:
        from_attributes = True


class SupplyForecastResponse(BaseModel):
    id: str
    district_name: str
    commodity_name: str
    predicted_demand_units: int
    current_stock_units: int
    seasonal_risk_factor: str
    recommended_buffer_units: int
    forecast_month: str

    class Config:
        from_attributes = True
