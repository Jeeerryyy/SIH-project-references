"""Patient service — business logic for patient registration and search."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit.logger import log_audit
from app.core.exceptions import NotFoundError
from app.core.utils import generate_mrn, new_uuid
from app.modules.patients import repository as repo
from app.modules.patients.models import Patient
from app.modules.patients.schemas import PatientCreate


async def register_patient(
    db: AsyncSession, data: PatientCreate, branch_id: str | None = None, user_id: str | None = None
) -> Patient:
    """Register a new patient with auto-generated MRN."""
    seq = await repo.get_next_mrn_sequence(db)
    mrn = generate_mrn(seq)

    patient = Patient(
        id=new_uuid(),
        mrn=mrn,
        branch_id=branch_id,
        registered_by=user_id,
        **data.model_dump(),
    )
    db.add(patient)
    await db.flush()

    await log_audit(
        db, action="CREATE", entity_type="Patient", entity_id=patient.id,
        user_id=user_id, branch_id=branch_id,
        new_values={"mrn": mrn, "name": f"{data.first_name} {data.last_name or ''}"},
    )
    return patient


async def get_patient(db: AsyncSession, patient_id: str) -> Patient:
    patient = await repo.get_patient_by_id(db, patient_id)
    if not patient:
        raise NotFoundError("Patient", patient_id)
    return patient


async def search_patients(
    db: AsyncSession, query: str | None = None, page: int = 1, size: int = 20
) -> dict:
    offset = (page - 1) * size
    items, total = await repo.search_patients(db, query=query, offset=offset, limit=size)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size,
    }
