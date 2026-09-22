"""User & Role models — the identity backbone of the entire system."""

import enum

from sqlalchemy import Boolean, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import AuditMixin, Base, BranchScopedMixin
from app.core.utils import new_uuid, utcnow


class RoleEnum(str, enum.Enum):
    SUPERADMIN = "SUPERADMIN"
    DOCTOR = "DOCTOR"
    CHO = "CHO"
    ANM = "ANM"
    ASHA = "ASHA"
    NURSE = "NURSE"
    PHARMACIST = "PHARMACIST"
    BILLING = "BILLING"
    LAB_TECH = "LAB_TECH"
    RECEPTIONIST = "RECEPTIONIST"


class FacilityType(str, enum.Enum):
    SUB_CENTRE = "SUB_CENTRE"
    PHC = "PHC"
    CHC = "CHC"
    DISTRICT_HOSPITAL = "DISTRICT_HOSPITAL"


class User(Base, AuditMixin, BranchScopedMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_login: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<User {self.username} role={self.role}>"
