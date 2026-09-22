"""Pydantic schemas for Public Health Analytics & Epidemiological Surveillance."""

from datetime import datetime
from pydantic import BaseModel, Field


class OutbreakAlert(BaseModel):
    id: str
    disease_name: str
    icd10_code: str
    district: str
    block: str
    reported_cases_this_week: int
    baseline_threshold: int
    spike_percentage: float
    alert_level: str  # WATCH, WARNING, EPIDEMIC_SPIKE
    recommended_action: str
    detected_at: datetime


class DiseaseTrendPoint(BaseModel):
    date: str
    cases: int
    category: str


class GeoClusterItem(BaseModel):
    id: str
    location_name: str
    facility_type: str
    latitude: float
    longitude: float
    active_cases: int
    outbreak_risk: str  # LOW, MODERATE, HIGH
    primary_condition: str


class PublicHealthOverview(BaseModel):
    total_consultations: int
    active_referrals: int
    high_risk_maternal_cases: int
    ncd_screenings_count: int
    overall_bed_occupancy_rate: float
    jan_aushadhi_dispensing_compliance: float
    active_outbreak_alerts: int
    outbreaks: list[OutbreakAlert] = Field(default_factory=list)
    geo_clusters: list[GeoClusterItem] = Field(default_factory=list)
