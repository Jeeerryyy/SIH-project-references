"""Branch & Department models — the facility hierarchy backbone."""

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database.base import AuditMixin, Base
from app.core.utils import new_uuid


class Branch(Base, AuditMixin):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    facility_type: Mapped[str] = mapped_column(String(30), nullable=False)  # SUB_CENTRE, PHC, CHC, DISTRICT_HOSPITAL
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(15), nullable=True)
    parent_branch_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("branches.id"), nullable=True
    )

    def __repr__(self) -> str:
        return f"<Branch {self.code} type={self.facility_type}>"


class Department(Base, AuditMixin):
    __tablename__ = "departments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    branch_id: Mapped[str] = mapped_column(String(36), ForeignKey("branches.id"), nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<Department {self.code} branch={self.branch_id}>"


class BedWard(Base, AuditMixin):
    __tablename__ = "bed_wards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    branch_id: Mapped[str] = mapped_column(String(36), ForeignKey("branches.id"), nullable=False, index=True)
    ward_name: Mapped[str] = mapped_column(String(100), nullable=False)  # General Male, Maternity ICU, Pediatric NICU, Emergency Bay
    ward_type: Mapped[str] = mapped_column(String(50), default="GENERAL")
    total_beds: Mapped[int] = mapped_column(nullable=False, default=20)
    occupied_beds: Mapped[int] = mapped_column(nullable=False, default=0)
    oxygen_supported_beds: Mapped[int] = mapped_column(nullable=False, default=5)
    icu_ventilator_beds: Mapped[int] = mapped_column(nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<BedWard {self.ward_name} {self.occupied_beds}/{self.total_beds}>"

