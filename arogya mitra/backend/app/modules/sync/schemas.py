"""Offline Sync Pydantic Schemas."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class SyncMutationItem(BaseModel):
    client_mutation_id: str
    entity_type: str  # PATIENT_REGISTER, ANC_SCREENING, NCD_SCREENING, VITALS_LOG
    payload: dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SyncPushRequest(BaseModel):
    device_id: str
    worker_role: str | None = None
    mutations: list[SyncMutationItem]


class SyncMutationResult(BaseModel):
    client_mutation_id: str
    status: str  # APPLIED, DUPLICATE_SKIPPED, FAILED
    entity_type: str
    server_entity_id: str | None = None
    error_message: str | None = None


class SyncPushResponse(BaseModel):
    success: bool
    processed_count: int
    applied_count: int
    duplicate_count: int
    failed_count: int
    results: list[SyncMutationResult]
    server_timestamp: datetime


class SyncPullResponse(BaseModel):
    server_timestamp: datetime
    branches: list[dict[str, Any]]
    drugs: list[dict[str, Any]]
    patients: list[dict[str, Any]]
