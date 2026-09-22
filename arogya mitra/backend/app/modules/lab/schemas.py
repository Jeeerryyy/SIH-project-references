from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class LabTestCatalogBase(BaseModel):
    test_code: str
    name: str
    category: str
    sample_type: str
    vacutainer_color: Optional[str] = "LAVENDER_EDTA"
    units: Optional[str] = None
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    critical_low: Optional[float] = None
    critical_high: Optional[float] = None
    price_inr: Optional[float] = 0.0
    is_active: Optional[bool] = True


class LabTestCatalogResponse(LabTestCatalogBase):
    id: str

    class Config:
        from_attributes = True


class LabOrderItemCreate(BaseModel):
    test_id: str


class LabOrderCreate(BaseModel):
    patient_id: str
    branch_id: Optional[str] = None
    clinical_indication: Optional[str] = None
    urgency: Optional[str] = "ROUTINE"
    test_ids: List[str]


class LabSampleResponse(BaseModel):
    id: str
    barcode: str
    sample_type: str
    vacutainer_type: str
    status: str
    collected_at: datetime

    class Config:
        from_attributes = True


class LabOrderItemResponse(BaseModel):
    id: str
    test_id: str
    test_name: Optional[str] = None
    test_code: Optional[str] = None
    category: Optional[str] = None
    units: Optional[str] = None
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    result_value: Optional[str] = None
    numeric_value: Optional[float] = None
    is_abnormal: bool = False
    is_critical: bool = False
    technician_notes: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LabOrderResponse(BaseModel):
    id: str
    order_number: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_mrn: Optional[str] = None
    branch_id: str
    clinical_indication: Optional[str] = None
    urgency: str
    status: str
    created_at: datetime
    items: List[LabOrderItemResponse] = []
    samples: List[LabSampleResponse] = []

    class Config:
        from_attributes = True


class LabResultEntryItem(BaseModel):
    item_id: str
    result_value: str
    numeric_value: Optional[float] = None
    technician_notes: Optional[str] = None


class LabResultEntryRequest(BaseModel):
    results: List[LabResultEntryItem]
    mark_published: Optional[bool] = True


class DiagnosticReportResponse(BaseModel):
    order_id: str
    order_number: str
    patient_name: str
    patient_mrn: str
    patient_gender: str
    patient_age_dob: str
    ordered_date: str
    reporting_date: str
    has_critical_alerts: bool
    critical_alerts: List[str] = []
    results: List[LabOrderItemResponse]
    clinical_interpretation: str
