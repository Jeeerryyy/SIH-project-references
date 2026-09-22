"""Offline Sync Business Service."""

from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin.models import Branch
from app.modules.inventory.models import DrugItem
from app.modules.patients.models import Patient
from app.modules.patients.schemas import PatientCreate
from app.modules.patients.service import register_patient
from app.modules.programs.schemas import MaternalRecordCreate, NcdRecordCreate
from app.modules.programs.service import enroll_maternal_patient, record_ncd_screening
from app.modules.sync.schemas import (
    SyncMutationResult,
    SyncPullResponse,
    SyncPushRequest,
    SyncPushResponse,
)

# In-memory deduplication set for demonstration and local sync durability
_PROCESSED_MUTATION_IDS: set[str] = set()


async def process_sync_push(
    db: AsyncSession,
    request: SyncPushRequest,
    user_id: str | None = None,
    branch_id: str | None = None,
) -> SyncPushResponse:
    effective_branch = branch_id or "5a744316-2882-40c0-ac97-e360a4a09ae9"
    results: list[SyncMutationResult] = []
    applied = 0
    duplicates = 0
    failed = 0

    for item in request.mutations:
        if item.client_mutation_id in _PROCESSED_MUTATION_IDS:
            duplicates += 1
            results.append(
                SyncMutationResult(
                    client_mutation_id=item.client_mutation_id,
                    status="DUPLICATE_SKIPPED",
                    entity_type=item.entity_type,
                )
            )
            continue

        try:
            entity_id = None
            if item.entity_type == "PATIENT_REGISTER":
                data = PatientCreate(**item.payload)
                patient = await register_patient(db, data, branch_id=effective_branch, user_id=user_id)
                entity_id = patient.id

            elif item.entity_type == "ANC_SCREENING":
                data = MaternalRecordCreate(**item.payload)
                anc = await enroll_maternal_patient(db, data, branch_id=effective_branch)
                entity_id = anc.id

            elif item.entity_type == "NCD_SCREENING":
                data = NcdRecordCreate(**item.payload)
                ncd = await record_ncd_screening(db, data, branch_id=effective_branch)
                entity_id = ncd.id

            _PROCESSED_MUTATION_IDS.add(item.client_mutation_id)
            applied += 1

            results.append(
                SyncMutationResult(
                    client_mutation_id=item.client_mutation_id,
                    status="APPLIED",
                    entity_type=item.entity_type,
                    server_entity_id=entity_id,
                )
            )
        except Exception as ex:
            failed += 1
            results.append(
                SyncMutationResult(
                    client_mutation_id=item.client_mutation_id,
                    status="FAILED",
                    entity_type=item.entity_type,
                    error_message=str(ex),
                )
            )

    return SyncPushResponse(
        success=(failed == 0),
        processed_count=len(request.mutations),
        applied_count=applied,
        duplicate_count=duplicates,
        failed_count=failed,
        results=results,
        server_timestamp=datetime.utcnow(),
    )


async def process_sync_pull(
    db: AsyncSession,
    branch_id: str | None = None,
) -> SyncPullResponse:
    # 1. Fetch branches
    b_stmt = select(Branch).limit(50)
    b_res = await db.execute(b_stmt)
    branches = [
        {"id": b.id, "name": b.name, "code": b.code, "facility_type": b.facility_type}
        for b in b_res.scalars().all()
    ]

    # 2. Fetch drugs
    d_stmt = select(DrugItem).limit(100)
    d_res = await db.execute(d_stmt)
    drugs = [
        {"id": d.id, "name": d.name, "generic_name": d.generic_name, "strength": d.strength}
        for d in d_res.scalars().all()
    ]

    # 3. Fetch patients in branch
    p_stmt = select(Patient).limit(100)
    if branch_id:
        p_stmt = p_stmt.where(Patient.branch_id == branch_id)
    p_res = await db.execute(p_stmt)
    patients = [
        {"id": p.id, "mrn": p.mrn, "name": p.full_name, "gender": p.gender, "phone": p.phone, "abha_id": p.abha_id}
        for p in p_res.scalars().all()
    ]

    return SyncPullResponse(
        server_timestamp=datetime.utcnow(),
        branches=branches,
        drugs=drugs,
        patients=patients,
    )

