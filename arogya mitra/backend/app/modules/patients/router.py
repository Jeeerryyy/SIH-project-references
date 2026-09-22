"""Patient API endpoints — registration, search, detail."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.patients import service
from app.modules.patients.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=201)
async def register_patient(
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Register a new patient — auto-generates MRN."""
    patient = await service.register_patient(
        db, data, branch_id=current_user.branch_id, user_id=current_user.id
    )
    return PatientResponse.model_validate(patient)


@router.get("", response_model=dict)
async def search_patients(
    q: str | None = Query(None, description="Search by name, MRN, phone, or ABHA"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Search and list patients (paginated)."""
    result = await service.search_patients(db, query=q, page=page, size=size)
    result["items"] = [PatientResponse.model_validate(p) for p in result["items"]]
    return result


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get patient details by ID."""
    patient = await service.get_patient(db, patient_id)
    return PatientResponse.model_validate(patient)
