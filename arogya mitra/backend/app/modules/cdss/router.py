"""API router for AI Clinical Decision Support System (CDSS)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth.dependencies import get_current_active_user
from app.core.auth.models import User
from app.core.database.dependencies import get_db
from app.modules.cdss import service
from app.modules.cdss.schemas import CdssEvaluateRequest, CdssEvaluateResponse

router = APIRouter(prefix="/cdss", tags=["AI Clinical Decision Support (CDSS)"])


@router.post(
    "/evaluate",
    response_model=CdssEvaluateResponse,
    summary="Evaluate patient case for drug interactions, allergies, and triage red flags",
)
async def evaluate_clinical_case(
    data: CdssEvaluateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Evaluates vitals, proposed prescriptions, and complaints using CDSS intelligence."""
    return await service.evaluate_clinical_case(db, data)
