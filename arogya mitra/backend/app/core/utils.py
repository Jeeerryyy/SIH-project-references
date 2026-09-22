"""Shared utility functions — MRN generation, date helpers, ID generation."""

import uuid
from datetime import datetime, timezone


def new_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def generate_mrn(sequence: int) -> str:
    """Generate Medical Record Number: MRN-YYYY-NNNNNN."""
    year = utcnow().year
    return f"MRN-{year}-{sequence:06d}"


def generate_token_number(prefix: str, sequence: int) -> str:
    """Generate queue token: TK-OPD-001, REF-DH-042, etc."""
    return f"{prefix}-{sequence:03d}"
