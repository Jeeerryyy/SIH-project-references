"""Referral business logic & state transitions."""

from datetime import datetime
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, BadRequestError
from app.core.utils import new_uuid, utcnow
from app.modules.referrals.models import Referral, ReferralStatus, TransportStatus, ReferralUrgency
from app.modules.referrals.schemas import ReferralCreate, ReferralStatusUpdate, CounterReferralCreate, ReferralResponse


def map_referral_response(r: Referral) -> ReferralResponse:
    resp = ReferralResponse.model_validate(r)
    if r.patient:
        resp.patient_name = f"{r.patient.first_name} {r.patient.last_name or ''}".strip()
        resp.patient_mrn = r.patient.mrn
        resp.patient_phone = r.patient.phone
    if r.referring_branch:
        resp.referring_branch_name = r.referring_branch.name
    if r.receiving_branch:
        resp.receiving_branch_name = r.receiving_branch.name
    if r.referred_by:
        resp.referred_by_name = r.referred_by.full_name
    return resp


async def create_referral(
    db: AsyncSession,
    data: ReferralCreate,
    *,
    referring_branch_id: str,
    user_id: str,
) -> ReferralResponse:
    """Initiate a new closed-loop referral."""
    transport_status = TransportStatus.NOT_NEEDED.value
    if data.transport_needed or data.urgency == ReferralUrgency.EMERGENCY.value:
        transport_status = TransportStatus.DISPATCHED_108.value

    referral = Referral(
        id=new_uuid(),
        patient_id=data.patient_id,
        referring_branch_id=referring_branch_id,
        receiving_branch_id=data.receiving_branch_id,
        referred_by_user_id=user_id,
        urgency=data.urgency,
        category=data.category,
        reason=data.reason,
        clinical_summary=data.clinical_summary,
        transport_needed=data.transport_needed,
        transport_status=transport_status,
        driver_name="Santosh Shinde (108)" if transport_status == TransportStatus.DISPATCHED_108.value else None,
        driver_phone="9822144108" if transport_status == TransportStatus.DISPATCHED_108.value else None,
        ambulance_number="MH-15-EG-1108" if transport_status == TransportStatus.DISPATCHED_108.value else None,
        appointment_date=data.appointment_date,
        branch_id=referring_branch_id,
    )
    db.add(referral)
    await db.flush()
    await db.refresh(referral, ["patient", "referring_branch", "receiving_branch", "referred_by"])
    return map_referral_response(referral)


async def list_referrals(
    db: AsyncSession,
    *,
    branch_id: str | None = None,
    filter_type: str = "all",  # "inbox", "outbox", "all"
    status: str | None = None,
    urgency: str | None = None,
) -> list[ReferralResponse]:
    """Query referrals with role/branch scoping."""
    query = select(Referral).order_by(desc(Referral.created_at))

    conditions = []
    if branch_id and filter_type == "inbox":
        conditions.append(Referral.receiving_branch_id == branch_id)
    elif branch_id and filter_type == "outbox":
        conditions.append(Referral.referring_branch_id == branch_id)
    elif branch_id:
        conditions.append(or_(Referral.referring_branch_id == branch_id, Referral.receiving_branch_id == branch_id))

    if status:
        conditions.append(Referral.status == status)
    if urgency:
        conditions.append(Referral.urgency == urgency)

    if conditions:
        query = query.where(and_(*conditions))

    result = await db.execute(query)
    referrals = result.scalars().all()
    return [map_referral_response(r) for r in referrals]


async def get_referral(db: AsyncSession, referral_id: str) -> ReferralResponse:
    """Fetch referral details."""
    result = await db.execute(select(Referral).where(Referral.id == referral_id))
    referral = result.scalar_one_or_none()
    if not referral:
        raise NotFoundError("Referral not found")
    return map_referral_response(referral)


async def update_referral_status(
    db: AsyncSession,
    referral_id: str,
    data: ReferralStatusUpdate,
    *,
    user_id: str,
) -> ReferralResponse:
    """Advance referral through workflow stages."""
    result = await db.execute(select(Referral).where(Referral.id == referral_id))
    referral = result.scalar_one_or_none()
    if not referral:
        raise NotFoundError("Referral not found")

    referral.status = data.status
    if data.status == ReferralStatus.ACCEPTED.value:
        referral.accepted_by_user_id = user_id
    elif data.status == ReferralStatus.ARRIVED.value:
        referral.arrived_at = utcnow()
    elif data.status == ReferralStatus.COMPLETED.value:
        referral.completed_at = utcnow()

    if data.driver_name:
        referral.driver_name = data.driver_name
    if data.driver_phone:
        referral.driver_phone = data.driver_phone
    if data.ambulance_number:
        referral.ambulance_number = data.ambulance_number

    await db.flush()
    return map_referral_response(referral)


async def complete_counter_referral(
    db: AsyncSession,
    referral_id: str,
    data: CounterReferralCreate,
    *,
    user_id: str,
) -> ReferralResponse:
    """Discharge patient with counter-referral notes back to village/sub-centre worker."""
    result = await db.execute(select(Referral).where(Referral.id == referral_id))
    referral = result.scalar_one_or_none()
    if not referral:
        raise NotFoundError("Referral not found")

    referral.counter_referral_notes = data.counter_referral_notes
    referral.follow_up_instructions = data.follow_up_instructions
    referral.prescribed_medications_summary = data.prescribed_medications_summary
    referral.status = ReferralStatus.COMPLETED.value
    referral.completed_at = utcnow()

    await db.flush()
    return map_referral_response(referral)
