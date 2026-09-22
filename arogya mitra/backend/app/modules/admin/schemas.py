"""Admin Pydantic schemas for request/response serialization."""

from pydantic import BaseModel


class BranchCreate(BaseModel):
    name: str
    code: str
    facility_type: str  # SUB_CENTRE, PHC, CHC, DISTRICT_HOSPITAL
    address: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    phone: str | None = None
    parent_branch_id: str | None = None


class BranchResponse(BaseModel):
    id: str
    name: str
    code: str
    facility_type: str
    address: str | None
    district: str | None
    state: str | None
    pincode: str | None
    phone: str | None
    parent_branch_id: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class DepartmentCreate(BaseModel):
    name: str
    code: str
    branch_id: str


class DepartmentResponse(BaseModel):
    id: str
    name: str
    code: str
    branch_id: str

    model_config = {"from_attributes": True}


class BedWardCreate(BaseModel):
    branch_id: str | None = None
    ward_name: str
    ward_type: str = "GENERAL"
    total_beds: int = 20
    occupied_beds: int = 0
    oxygen_supported_beds: int = 5
    icu_ventilator_beds: int = 0


class BedWardResponse(BaseModel):
    id: str
    branch_id: str
    ward_name: str
    ward_type: str
    total_beds: int
    occupied_beds: int
    available_beds: int
    oxygen_supported_beds: int
    icu_ventilator_beds: int
    occupancy_rate: float

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id: str
    user_id: str | None
    user_name: str | None = None
    user_role: str | None = None
    action: str
    entity_type: str
    entity_id: str | None
    branch_id: str | None
    ip_address: str | None
    created_at: str | None = None

    model_config = {"from_attributes": True}

