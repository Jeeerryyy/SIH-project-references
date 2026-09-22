"""Patient model — the core clinical entity."""

from sqlalchemy import Date, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database.base import AuditMixin, Base, BranchScopedMixin
from app.core.utils import new_uuid


class Patient(Base, AuditMixin, BranchScopedMixin):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    mrn: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_birth: Mapped[str | None] = mapped_column(Date, nullable=True)
    gender: Mapped[str] = mapped_column(String(10), nullable=False)  # MALE, FEMALE, OTHER
    phone: Mapped[str | None] = mapped_column(String(15), nullable=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    abha_id: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    blood_group: Mapped[str | None] = mapped_column(String(5), nullable=True)
    address: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {line1, line2, village, district, state, pincode}
    emergency_contact_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    registered_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Patient {self.mrn} {self.first_name}>"

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name or ''}".strip()
