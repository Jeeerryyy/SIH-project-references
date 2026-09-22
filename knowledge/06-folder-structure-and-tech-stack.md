# Arogya Mitra — Folder Structure & Tech Stack Reference

> Final folder structure for the project, informed by the architectural analysis of OpenMRS and Bahmni.
> This serves as the build guide for all phases.

---

## 1. Tech Stack (Final)

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | Python 3.12+ / FastAPI | Async-native, auto OpenAPI docs, type hints |
| **ORM** | SQLAlchemy 2.0 (async) | Best Python ORM, supports JSONB, migration via Alembic |
| **Database** | PostgreSQL 16+ | JSONB, RLS, partitioning, UUID type |
| **Cache / Queue** | Redis 7+ | Session store, event bus (Streams), Celery broker |
| **Task Queue** | Celery 5+ | Background jobs (reports, emails, ABDM sync) |
| **Frontend** | React 18 + TypeScript | Component-based, strong typing, massive ecosystem |
| **UI Framework** | Ant Design or Shadcn/ui | Enterprise-grade components (tables, forms, charts) |
| **State Mgmt** | Zustand / React Query | Lightweight, server-state focused |
| **Real-time** | Socket.io (python-socketio) | Live queue boards, bed status, OT monitor |
| **Auth** | JWT (access + refresh) | Stateless, branch-scoped claims |
| **File Storage** | MinIO (S3-compatible) | Self-hosted, DICOM / reports / documents |
| **Search** | PostgreSQL FTS (initially) | `tsvector` for patient/drug search; Elasticsearch later |
| **PACS** | Orthanc (external) | DICOM server, viewer integration |
| **Video Consult** | Jitsi Meet (self-hosted) | WebRTC, no vendor lock-in |
| **Containerization** | Docker + Docker Compose | Single command deployment |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy |
| **Monitoring** | Prometheus + Grafana | Metrics, dashboards, alerting |
| **Logging** | Structlog → ELK / Loki | Structured JSON logs |

---

## 2. Project Folder Structure

```
arogya-mitra/
│
├── README.md
├── LICENSE
├── docker-compose.yml              # Full stack: backend + frontend + DB + Redis + MinIO
├── docker-compose.dev.yml          # Development overrides
├── docker-compose.prod.yml         # Production overrides
├── .env.example                    # Environment variables template
├── Makefile                        # Common commands (make dev, make test, make migrate)
│
├── backend/                        # FastAPI application
│   ├── Dockerfile
│   ├── pyproject.toml              # Python project config (replaces setup.py + requirements.txt)
│   ├── alembic.ini                 # Migration config
│   ├── alembic/                    # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       ├── 001_initial_core_schema.py
│   │       └── ...
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI app factory, startup/shutdown hooks
│   │   ├── config.py               # Settings (pydantic-settings, env-based)
│   │   │
│   │   ├── core/                   # Cross-cutting concerns (used by all modules)
│   │   │   ├── __init__.py
│   │   │   ├── auth/               # Authentication & Authorization
│   │   │   │   ├── __init__.py
│   │   │   │   ├── jwt.py          # Token creation/validation
│   │   │   │   ├── rbac.py         # Role-based access control
│   │   │   │   ├── abac.py         # Attribute-based (branch, department scoping)
│   │   │   │   ├── dependencies.py # FastAPI Depends() for auth
│   │   │   │   └── models.py       # User, Role, Permission models
│   │   │   │
│   │   │   ├── database/           # Database engine & session
│   │   │   │   ├── __init__.py
│   │   │   │   ├── engine.py       # Async engine + session factory
│   │   │   │   ├── base.py         # Base model with audit fields
│   │   │   │   └── dependencies.py # get_db() dependency
│   │   │   │
│   │   │   ├── events/             # Internal event bus (Redis Streams)
│   │   │   │   ├── __init__.py
│   │   │   │   ├── bus.py          # Publish/subscribe logic
│   │   │   │   └── handlers.py     # Event handler registry
│   │   │   │
│   │   │   ├── audit/              # Audit logging
│   │   │   │   ├── __init__.py
│   │   │   │   ├── logger.py       # Audit event writer
│   │   │   │   └── models.py       # AuditLog model (partitioned)
│   │   │   │
│   │   │   ├── tenant/             # Multi-branch scoping
│   │   │   │   ├── __init__.py
│   │   │   │   ├── middleware.py   # Branch extraction from JWT
│   │   │   │   └── filters.py     # Auto branch_id injection
│   │   │   │
│   │   │   ├── storage/            # File storage (MinIO/S3)
│   │   │   │   ├── __init__.py
│   │   │   │   └── client.py
│   │   │   │
│   │   │   ├── exceptions.py       # Custom exception classes
│   │   │   ├── pagination.py       # Cursor-based pagination
│   │   │   └── utils.py            # MRN generator, date helpers, etc.
│   │   │
│   │   ├── modules/                # Feature modules (domain boundaries)
│   │   │   ├── __init__.py
│   │   │   │
│   │   │   ├── patients/           # Patient lifecycle
│   │   │   │   ├── __init__.py
│   │   │   │   ├── router.py       # API endpoints (FastAPI router)
│   │   │   │   ├── models.py       # SQLAlchemy models
│   │   │   │   ├── schemas.py      # Pydantic request/response schemas
│   │   │   │   ├── service.py      # Business logic
│   │   │   │   ├── repository.py   # Database queries
│   │   │   │   └── events.py       # Event publishers/subscribers
│   │   │   │
│   │   │   ├── appointments/       # Scheduling engine
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── slot_engine.py  # Slot generation algorithm
│   │   │   │
│   │   │   ├── clinical/           # EMR core
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Encounter, Observation
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── templates/      # JSON Schema files for specialty forms
│   │   │   │       ├── general_medicine.json
│   │   │   │       ├── cardiology.json
│   │   │   │       ├── orthopedics.json
│   │   │   │       ├── pediatrics.json
│   │   │   │       ├── obstetrics.json
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── lab/                # Laboratory Information System
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # LabOrder, Sample, LabResult, TestPanel
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── repository.py
│   │   │   │
│   │   │   ├── pharmacy/           # Pharmacy & drug dispensing
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Drug, DrugStock, Dispensing
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── fefo.py         # First-Expiry-First-Out algorithm
│   │   │   │
│   │   │   ├── billing/            # Revenue cycle management
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Bill, BillItem, Payment, InsuranceClaim
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   ├── gst.py          # GST calculation + e-invoicing
│   │   │   │   └── nhcx.py         # PM-JAY / NHCX claim submission
│   │   │   │
│   │   │   ├── radiology/          # Imaging orders & reports
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── pacs_client.py  # Orthanc DICOM integration
│   │   │   │
│   │   │   ├── ipd/                # Inpatient management
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Admission, Bed, NursingNote, DietChart
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── repository.py
│   │   │   │   └── bed_manager.py  # Bed allocation/transfer engine
│   │   │   │
│   │   │   ├── ot/                 # Operation Theatre
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # OTBooking, SurgicalSafetyChecklist
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── safety.py       # WHO checklist enforcement
│   │   │   │
│   │   │   ├── blood_bank/         # Blood bank management
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── service.py
│   │   │   │
│   │   │   ├── hr/                 # Human resources
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Staff, Attendance, Leave, Payroll
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── statutory.py    # PF/ESI/TDS calculations
│   │   │   │
│   │   │   ├── inventory/          # Supply chain
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── procurement.py  # PO/GRN workflow
│   │   │   │
│   │   │   ├── admin/              # System administration
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # Branch, Department, Config
│   │   │   │   ├── schemas.py
│   │   │   │   └── service.py
│   │   │   │
│   │   │   ├── abdm/               # ABDM Integration
│   │   │   │   ├── router.py
│   │   │   │   ├── models.py       # ABHARegistration, ConsentArtifact
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   ├── hip.py          # Health Information Provider
│   │   │   │   ├── hiu.py          # Health Information User
│   │   │   │   └── fhir.py         # FHIR R4 bundle builder
│   │   │   │
│   │   │   ├── analytics/          # Dashboards & MIS
│   │   │   │   ├── router.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── service.py
│   │   │   │   └── queries/        # Raw SQL for complex reports
│   │   │   │       ├── daily_census.sql
│   │   │   │       ├── revenue_summary.sql
│   │   │   │       └── department_stats.sql
│   │   │   │
│   │   │   └── ai/                 # AI / CDSS (Phase 7)
│   │   │       ├── router.py
│   │   │       ├── schemas.py
│   │   │       ├── cdss_rules.py   # Rule-based CDSS (Phase 2)
│   │   │       └── llm_service.py  # LLM-powered CDSS (Phase 7)
│   │   │
│   │   └── realtime/               # Socket.io for live updates
│   │       ├── __init__.py
│   │       ├── server.py           # Socket.io event handlers
│   │       └── channels.py         # Channel definitions (queue, beds, ot)
│   │
│   └── tests/                      # Test suite (mirrors app/ structure)
│       ├── conftest.py             # Shared fixtures (test DB, test client)
│       ├── core/
│       │   ├── test_auth.py
│       │   └── test_audit.py
│       └── modules/
│           ├── test_patients.py
│           ├── test_appointments.py
│           └── ...
│
├── frontend/                       # React application
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/                 # Page-level routes
│   │   ├── components/             # Shared UI components
│   │   │   ├── ui/                 # Base design system
│   │   │   ├── forms/              # Dynamic JSON Schema form renderer
│   │   │   ├── layouts/            # Dashboard layouts per role
│   │   │   └── widgets/            # Reusable widgets (patient-card, vitals-chart)
│   │   ├── features/               # Feature-based modules (mirrors backend)
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── clinical/
│   │   │   ├── lab/
│   │   │   ├── pharmacy/
│   │   │   ├── billing/
│   │   │   ├── ipd/
│   │   │   ├── ot/
│   │   │   ├── admin/
│   │   │   └── dashboard/
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── services/               # API client (axios/fetch wrappers)
│   │   ├── store/                  # Zustand state stores
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Helpers, formatters, validators
│   └── tests/
│
├── knowledge/                      # THIS FOLDER — architecture reference docs
│   ├── 01-openmrs-deep-analysis.md
│   ├── 02-bahmni-deep-analysis.md
│   ├── 03-comparative-analysis.md
│   ├── 04-design-patterns.md
│   ├── 05-database-schema-principles.md
│   └── 06-folder-structure-and-tech-stack.md (this file)
│
├── docs/                           # Project documentation
│   ├── api/                        # Auto-generated OpenAPI specs
│   ├── architecture/               # ADRs (Architecture Decision Records)
│   ├── deployment/                 # Deployment guides
│   └── user-guides/                # End-user documentation
│
├── scripts/                        # DevOps & utility scripts
│   ├── seed_data.py                # Development seed data
│   ├── generate_mrn.py             # MRN generation utility
│   └── backup.sh                   # Database backup script
│
└── .github/
    └── workflows/
        ├── ci.yml                  # Lint → Test → Build
        ├── cd.yml                  # Deploy to staging/production
        └── security.yml            # Dependency audit
```

---

## 3. Module File Convention

Every module follows the **same internal structure** (inspired by OpenMRS module pattern, adapted for FastAPI):

```
modules/<module_name>/
├── __init__.py         # Module registration
├── router.py           # API routes (FastAPI APIRouter)
├── models.py           # SQLAlchemy ORM models
├── schemas.py          # Pydantic schemas (request/response DTOs)
├── service.py          # Business logic (the "brain")
├── repository.py       # Database queries (the "data layer")
├── events.py           # Event publishers + subscribers
└── <specialty>.py      # Module-specific utilities (optional)
```

**Rules:**
1. `router.py` → Only handles HTTP (parse request, call service, return response)
2. `service.py` → Contains ALL business logic, validation, authorization checks
3. `repository.py` → Contains ALL database queries (raw SQL or ORM)
4. `models.py` → Pure data definition, no logic
5. `schemas.py` → Pure serialization, no logic
6. Modules NEVER import from other modules' `repository.py` — only via events or service

---

## 4. Build Order (Phase-Aligned)

| Phase | Modules Built | LOC Estimate |
|---|---|---|
| **Phase 1: Foundation** | `core/` (auth, db, audit, tenant, events) + `admin` + `patients` | ~15,000 |
| **Phase 2: Clinical Core** | `clinical` + `appointments` + `pharmacy` (basic) + `lab` (basic) | ~30,000 |
| **Phase 3: Revenue** | `billing` + `pharmacy` (full) + `inventory` (basic) | ~25,000 |
| **Phase 4: IPD/OT** | `ipd` + `ot` + `blood_bank` + `radiology` | ~30,000 |
| **Phase 5: HR/Ops** | `hr` + `inventory` (full) | ~20,000 |
| **Phase 6: Compliance** | `abdm` + `analytics` | ~25,000 |
| **Phase 7: AI** | `ai` (CDSS, NLP, recommendations) | ~15,000 |
| **Frontend** | React app (all phases) | ~80,000 |
| **Tests** | Full test suite | ~40,000 |
| **Total** | | **~280,000 LOC** |
