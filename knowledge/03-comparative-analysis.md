# Comparative Analysis — OpenMRS vs Bahmni vs Arogya Mitra

> This document synthesizes lessons from both reference systems and maps them to our architecture decisions.

---

## 1. Head-to-Head Comparison

| Dimension | OpenMRS | Bahmni | **Arogya Mitra** (Ours) |
|---|---|---|---|
| **Purpose** | EMR platform (clinical records only) | HMS integration layer (EMR+ERP+LIS+PACS) | **Full HMS** (single codebase, all modules) |
| **Architecture** | Modular monolith (Java) | Distributed multi-system | **Modular monolith** (Python/FastAPI) |
| **Backend** | Java/Spring/Hibernate | Java + Python (Odoo) | **Python/FastAPI + SQLAlchemy** |
| **Frontend** | React microfrontends (O3) | AngularJS + React (migrating) | **React + TypeScript** |
| **Database** | MySQL (primarily) | MySQL + PostgreSQL (Odoo) + 2 more | **PostgreSQL single DB** (multi-schema) |
| **Clinical Data** | EAV (Concept Dictionary + `obs`) | Inherits OpenMRS EAV | **JSONB** (JSON Schema templates) |
| **Integration** | REST + FHIR R4 | Atom Feed (polling) | **Internal event bus** (Redis Streams) |
| **Multi-branch** | ❌ Single site | ❌ Single site | ✅ **Branch-scoped from day one** |
| **India Compliance** | ❌ No ABDM/NHCX | ❌ No ABDM/NHCX | ✅ **ABDM, NHCX, DPDP, GST baked in** |
| **AI/CDSS** | ❌ No built-in | ❌ No built-in | ✅ **Rule engine + LLM phase** |
| **Billing** | ❌ Not included | Via Odoo (basic) | ✅ **Purpose-built with GST/TDS** |
| **Scale** | 500K+ LOC | 200K+ LOC | **Target: 250K-350K LOC** |

---

## 2. Architectural Decisions Derived from Research

### 2.1 Why Modular Monolith (Not Microservices, Not Multi-System)

**OpenMRS** chose modular monolith → ✅ Correct for EMR, but they need plugins for everything else.
**Bahmni** chose multi-system integration → ❌ Created operational complexity, sync failures, multi-DB headaches.

**Our decision:** Modular monolith with **folder-level isolation** and a shared database.

```
backend/
  app/
    modules/
      patients/       → Patient lifecycle (registration to discharge)
      appointments/   → Scheduling engine (in-person + video)
      clinical/       → EMR core (encounters, vitals, notes)
      lab/            → LIS (orders, samples, results)
      pharmacy/       → Dispensing, inventory, FEFO
      radiology/      → Orders, reports, PACS link
      billing/        → Revenue cycle, GST, insurance claims
      ot/             → OT scheduling, surgical safety
      ipd/            → Inpatient (bed, nursing, diet)
      blood-bank/     → Donor, stock, cross-match
      hr/             → Staff, attendance, payroll
      inventory/      → Supply chain, procurement
      admin/          → Branch mgmt, roles, config
      abdm/           → ABHA, HIP/HIU, NHCX gateway
      analytics/      → Dashboards, MIS reports
      ai/             → CDSS, NLP, recommendations
    core/
      auth/           → RBAC + ABAC + JWT + ABHA
      events/         → Event bus (Redis Streams)
      audit/          → Immutable audit log
      tenant/         → Branch-scoping middleware
      storage/        → File/image storage (S3-compatible)
```

**Why this is superior:**
- No Atom Feed polling — modules call each other directly or via in-process events
- One database — no sync issues, joins work across modules
- One auth system — no credential duplication
- One deployment — Docker Compose with backend + frontend + PostgreSQL + Redis
- One monitoring — single log stream, single APM trace

### 2.2 Why JSONB Over EAV (The Clinical Data Decision)

This is our **most important technical divergence** from OpenMRS.

**EAV (OpenMRS):**
```sql
-- Finding a patient's weight + blood pressure requires 2 separate rows + joins
SELECT o.value_numeric FROM obs o
JOIN concept c ON o.concept_id = c.concept_id
WHERE c.name = 'Weight' AND o.person_id = 123 AND o.encounter_id = 456;
```
- Each clinical observation = 1 row in a table that grows to millions
- Complex queries need N joins for N observations
- Reporting is painful (pivot everything)

**JSONB (Arogya Mitra):**
```sql
-- All observations in one read
SELECT form_data FROM consultation_observations
WHERE patient_id = 123 AND encounter_id = 456;

-- Result:
{
  "vitals": {"weight": 72.5, "bp_systolic": 120, "bp_diastolic": 80},
  "diagnosis": [{"code": "J06.9", "description": "Upper RTI", "type": "primary"}],
  "prescriptions": [{"drug": "Amoxicillin", "dose": "500mg", "frequency": "TDS", "days": 5}]
}
```

- All data for one encounter = 1 row
- PostgreSQL GIN indexes on JSONB give fast key-based queries
- JSON Schema validation ensures data quality
- Reporting can use `jsonb_path_query()` for structured extraction

### 2.3 Why Internal Event Bus (Not Atom Feeds)

| Bahmni Atom Feed | Arogya Mitra Event Bus |
|---|---|
| HTTP polling every N seconds | Redis Streams push-based |
| Separate databases per system | Single PostgreSQL |
| Failed events in `failed_events` table | Dead letter queue in Redis |
| Minutes of sync lag | Milliseconds |
| Complex cross-system debugging | Single trace ID across all modules |

---

## 3. Data Model Principles (Adopted from Both)

### From OpenMRS (keep):
1. **Immutable clinical records** — Never UPDATE clinical data; void + re-create
2. **Universal audit trail** — Every entity has `created_by`, `created_at`, `updated_by`, `updated_at`, `deleted_at`, `deleted_by`
3. **UUID as primary identifier** — All patient-facing IDs are UUIDs, not sequential integers
4. **Encounter-based grouping** — Clinical data is always attached to an encounter (visit + provider + timestamp)
5. **Concept standardization** — Use ICD-10, SNOMED CT, LOINC codes alongside local names

### From Bahmni (keep):
1. **Configurable forms** — UI forms defined by JSON config, not hardcoded components
2. **Offline-first consideration** — Design for intermittent connectivity
3. **Docker-first deployment** — Everything runs in containers
4. **Domain separation** — Even within a monolith, modules own their domain completely

### From Both (avoid):
1. **MySQL dependency** — We use PostgreSQL exclusively
2. **Java verbosity** — Python/FastAPI cuts boilerplate by 60-70%
3. **AngularJS** — Dead framework; React + TypeScript from day one
4. **Multi-database sync** — Single database, zero sync problems
5. **No branch awareness** — We add `branch_id` to every tenant-scoped table

---

## 4. Quality Engineering Standards (Synthesized)

OpenMRS has the best QE practices of the two. We adopt their spirit with modern tooling:

| Practice | OpenMRS (Java) | Arogya Mitra (Python) |
|---|---|---|
| Unit tests | JUnit 5 | **pytest** |
| Integration tests | Spring Test | **pytest + httpx** (TestClient) |
| Code coverage | Codecov | **pytest-cov** → Codecov |
| Static analysis | SonarCloud | **ruff** (linter + formatter) |
| Security scanning | Snyk | **pip-audit** + **bandit** |
| DB migrations | Liquibase | **Alembic** |
| API docs | OpenMRS REST docs | **FastAPI auto-OpenAPI** (built-in) |
| CI/CD | GitHub Actions | **GitHub Actions** |
| Containerization | Docker | **Docker + Docker Compose** |

---

## 5. What Neither System Has (Our Differentiation)

These are features that **neither OpenMRS nor Bahmni** provide, and represent our unique value:

| Feature | Gap | Arogya Mitra Solution |
|---|---|---|
| **Multi-branch architecture** | Both are single-site | Branch-scoped middleware, branch_id on all tables |
| **ABDM Integration** | Neither has it | Built-in ABHA enrollment, HIP/HIU, consent framework |
| **NHCX / PM-JAY claims** | Neither has it | Insurance gateway with HL7 FHIR claim bundles |
| **GST e-invoicing** | Not applicable | IRN generation via GST Portal API |
| **Statutory payroll** | Not in scope | PF/ESI/TDS with monthly return generation |
| **AI/CDSS** | Neither has it | Rule-based engine (Phase 2) + LLM-powered (Phase 7) |
| **Real-time dashboards** | No WebSocket support | Socket.io live queue boards, bed status, OT monitor |
| **Video consultation** | Not built-in | WebRTC/Jitsi integration for telemedicine |
| **Blood bank** | Not in Bahmni/OpenMRS | Full donor-stock-crossmatch-issue cycle |
| **DPDP Act 2023 compliance** | Not applicable to either | Data classification, consent ledger, right-to-erasure |
| **NLP for clinical notes** | Not available | Voice-to-structured-data pipeline (Phase 7) |

---

## 6. Summary: Our Competitive Position

```
OpenMRS + Bahmni = "Best open-source HMS available for India"
Arogya Mitra    = "OpenMRS quality + Bahmni scope + India compliance + AI + Modern stack"
```

We are building the system that Bahmni would be if it were:
1. Started today with modern Python
2. Designed for Indian regulatory requirements from day one
3. Built as a single codebase (not 4 stitched together)
4. Multi-branch aware
5. AI-ready
