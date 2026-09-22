"""Clinical API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.clinical import service
from app.modules.clinical.schemas import (
    ConsultationCreate,
    ConsultationResponse,
)

router = APIRouter(prefix="/clinical", tags=["Clinical EMR & Prescriptions"])


@router.post("/consultations", response_model=ConsultationResponse, status_code=201)
async def create_consultation(
    data: ConsultationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a clinical consultation and generate digital prescription."""
    return await service.create_consultation(
        db,
        data,
        doctor_user_id=current_user.id,
        branch_id=current_user.branch_id or "cd8487d0-aeec-422c-afd0-19fc4766b085",
    )


@router.get("/patients/{patient_id}/history", response_model=list[ConsultationResponse])
async def get_patient_history(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve complete longitudinal EHR history for a patient."""
    return await service.get_patient_history(db, patient_id)
