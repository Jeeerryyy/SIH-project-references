"""Teleconsultation business logic & session lifecycle."""

import uuid
from datetime import datetime
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, BadRequestError
from app.core.utils import new_uuid, utcnow
from app.modules.teleconsult.models import TeleconsultSession, TeleconsultStatus
from app.modules.teleconsult.schemas import (
    TeleconsultSessionCreate,
    TeleconsultSessionResponse,
    TeleconsultJoinResponse,
    TeleconsultCompleteRequest,
)


def map_session_response(s: TeleconsultSession) -> TeleconsultSessionResponse:
    resp = TeleconsultSessionResponse.model_validate(s)
    if s.patient:
        resp.patient_name = f"{s.patient.first_name} {s.patient.last_name or ''}".strip()
        resp.patient_mrn = s.patient.mrn
    if s.requesting_user:
        resp.requesting_user_name = s.requesting_user.full_name
    if s.doctor_user:
        resp.doctor_user_name = s.doctor_user.full_name
    if s.sub_centre:
        resp.sub_centre_name = s.sub_centre.name
    return resp


async def create_session(
    db: AsyncSession,
    data: TeleconsultSessionCreate,
    *,
    requesting_user_id: str,
    sub_centre_branch_id: str,
) -> TeleconsultSessionResponse:
    """CHO at Sub-Centre initiates a teleconsultation request to DH Specialist."""
    room_id = f"room-tele-{uuid.uuid4().hex[:12]}"

    session = TeleconsultSession(
        id=new_uuid(),
        patient_id=data.patient_id,
        requesting_user_id=requesting_user_id,
        doctor_user_id=data.doctor_user_id,
        sub_centre_branch_id=sub_centre_branch_id,
        hospital_branch_id=data.hospital_branch_id,
        room_id=room_id,
        status=TeleconsultStatus.WAITING.value,
        chief_complaint=data.chief_complaint,
        vitals_snapshot=data.vitals_snapshot,
        branch_id=sub_centre_branch_id,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session, ["patient", "requesting_user", "doctor_user", "sub_centre"])
    return map_session_response(session)


async def list_sessions(
    db: AsyncSession,
    *,
    branch_id: str | None = None,
    status: str | None = None,
) -> list[TeleconsultSessionResponse]:
    """List waiting and active teleconsultation queues."""
    query = select(TeleconsultSession).order_by(desc(TeleconsultSession.created_at))

    conditions = []
    if branch_id:
        conditions.append(
            or_(
                TeleconsultSession.sub_centre_branch_id == branch_id,
                TeleconsultSession.hospital_branch_id == branch_id,
            )
        )
    if status:
        conditions.append(TeleconsultSession.status == status)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query)
    sessions = result.scalars().all()
    return [map_session_response(s) for s in sessions]


async def join_session(
    db: AsyncSession,
    session_id: str,
    *,
    user_id: str,
    user_role: str,
) -> TeleconsultJoinResponse:
    """Join video call room and update state to IN_CALL."""
    result = await db.execute(select(TeleconsultSession).where(TeleconsultSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Teleconsultation session not found")

    if user_role == "DOCTOR":
        session.doctor_user_id = user_id

    session.status = TeleconsultStatus.IN_CALL.value
    if not session.started_at:
        session.started_at = utcnow()

    await db.flush()
    await db.refresh(session, ["patient"])

    patient_name = f"{session.patient.first_name} {session.patient.last_name or ''}".strip() if session.patient else "Patient"

    return TeleconsultJoinResponse(
        session_id=session.id,
        room_id=session.room_id,
        webrtc_token=f"rtc-tok-{uuid.uuid4().hex[:16]}",
        status=session.status,
        patient_name=patient_name,
        vitals_snapshot=session.vitals_snapshot or {},
    )


async def complete_session(
    db: AsyncSession,
    session_id: str,
    data: TeleconsultCompleteRequest,
) -> TeleconsultSessionResponse:
    """Finish teleconsultation and attach clinical diagnosis & prescription."""
    result = await db.execute(select(TeleconsultSession).where(TeleconsultSession.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise NotFoundError("Teleconsultation session not found")

    session.status = TeleconsultStatus.COMPLETED.value
    session.doctor_diagnosis = data.doctor_diagnosis
    session.prescription_id = data.prescription_id
    session.ended_at = utcnow()

    await db.flush()
    return map_session_response(session)
