"""Patient Pydantic schemas."""

from datetime import date
from pydantic import BaseModel


class PatientCreate(BaseModel):
    first_name: str
    last_name: str | None = None
    date_of_birth: date | None = None
    gender: str
    phone: str | None = None
    email: str | None = None
    abha_id: str | None = None
    blood_group: str | None = None
    address: dict | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    allergies: str | None = None


class PatientResponse(BaseModel):
    id: str
    mrn: str
    first_name: str
    last_name: str | None
    date_of_birth: date | None
    gender: str
    phone: str | None
    email: str | None
    abha_id: str | None
    blood_group: str | None
    address: dict | None
    emergency_contact_name: str | None
    emergency_contact_phone: str | None
    allergies: str | None
    branch_id: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class PatientSearch(BaseModel):
    query: str | None = None  # Search by name, MRN, phone, or ABHA
    page: int = 1
    size: int = 20
