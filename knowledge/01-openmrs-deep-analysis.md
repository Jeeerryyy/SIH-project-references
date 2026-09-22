# OpenMRS — Deep Architecture Analysis

> Source: [github.com/openmrs](https://github.com/openmrs) | 500K+ LOC | Java | 20+ years | 6000+ implementations worldwide

---

## 1. What OpenMRS Actually Is

OpenMRS is **not** a hospital management system — it is a **medical records platform**. It provides the clinical data engine (EMR) and a module system, but it does **not** ship billing, pharmacy inventory, HR, OT scheduling, or supply chain out of the box. Those come from modules or from wrapping systems like Bahmni.

**Key insight for Arogya Mitra:** OpenMRS solves **one problem extremely well** (flexible clinical data capture) and relies on others for the rest. Our HMS needs to be self-contained.

---

## 2. Architecture

### 2.1 Backend — Java Spring Modular Monolith

```
openmrs-core/
├── api/          → Core business logic, services, domain model (THE heart)
├── web/          → REST API layer, controllers, filters
├── webapp/       → WAR packaging for Tomcat/Jetty deployment
├── test/         → Test infrastructure and utilities
└── tools/        → Developer tooling, build helpers
```

**Layering pattern:**
```
Controller (REST) → Service (business logic) → DAO (data access) → Hibernate → MySQL/PostgreSQL
```

- Every service is **interface-based** with a default implementation
- Services are Spring-managed beans, injected via DI
- **AOP interceptors** handle authorization checks transparently
- Database access via **Hibernate ORM** with **Liquibase** for migrations

### 2.2 Frontend — OpenMRS 3.0 (O3) Microfrontend Architecture

The modern frontend (O3) is a **radical departure** from the backend:

```
openmrs-esm-core/           → App Shell (Single SPA router)
openmrs-esm-patient-chart/  → Patient chart microfrontend
openmrs-esm-home/           → Home dashboard microfrontend
openmrs-esm-patient-management/ → Registration, search
```

**Key patterns:**
- **Single SPA** as the microfrontend router
- **Webpack Module Federation** for runtime module loading
- **Extension/Slot system** — modules register UI components into named slots
- **Carbon Design System** (IBM) for consistent UI
- **React + TypeScript** throughout
- **Configuration-first** — each module declares config schema, implementers customize via JSON

**Key insight for Arogya Mitra:** The microfrontend approach is overkill for our initial build. But the **extension/slot concept** and **configuration-first design** are gold — we should adopt the principle (configurable panels per role) without the infrastructure overhead of Single SPA.

---

## 3. The Concept Dictionary + Obs Pattern (THE Killer Design)

This is OpenMRS's **single most important architectural decision** and the reason it scales to thousands of implementations across wildly different clinical settings.

### 3.1 The Problem It Solves

A cardiology visit needs `ejection_fraction`, `ecg_findings`. An obstetrics visit needs `lmp`, `edd`, `gravida`. If you add a column per clinical field, you get:
- Schema migrations every time a hospital adds a department
- 500+ columns in a `visits` table
- Unmanageable

### 3.2 The Solution: Entity-Attribute-Value (EAV) with a Concept Dictionary

```sql
-- The Concept Dictionary (the "what can be recorded" catalog)
concepts:
  concept_id | name                  | datatype    | class
  1          | "Weight"              | Numeric     | Finding
  2          | "Blood Pressure"      | Numeric     | Finding  
  3          | "Ejection Fraction"   | Numeric     | Finding
  4          | "LMP Date"            | Date        | Finding

-- The Obs table (the "what WAS recorded" store)
obs:
  obs_id | person_id | concept_id | value_numeric | value_datetime | encounter_id
  101    | patient_1 | 1          | 72.5          | NULL           | enc_1
  102    | patient_1 | 3          | 55            | NULL           | enc_1
  103    | patient_2 | 4          | NULL          | 2026-01-15     | enc_2
```

### 3.3 Why This Matters

- **Adding a new clinical field = adding a row to `concepts`, not a migration**
- Obs records are **hierarchical** — a parent obs can group child obs (e.g., "Vital Signs" containing BP, pulse, temp)
- Obs records are **immutable** — corrections void the old record and create a new one (audit trail)
- The concept dictionary can use **standardized vocabularies** (SNOMED CT, LOINC, ICD-10)

### 3.4 What We Adopt for Arogya Mitra

Our blueprint (§7) already specifies this exact pattern but with a modern twist:
```
Specialty_Templates     → JSON Schema per specialty (equivalent to concept sets)
Consultation_Form_Data  → JSONB form values per visit (equivalent to obs groups)
```

**Our advantage:** We use **JSONB** instead of EAV rows. This gives us:
- Same flexibility (schema-less clinical data)
- Better query performance (PostgreSQL JSONB indexing vs EAV joins)
- Easier form rendering (JSON Schema → React form, no concept-to-widget mapping layer)
- Less complexity (no concept dictionary management system needed)

**What we lose:** Standardized vocabulary enforcement at the DB level. We compensate with form-level validation and code-list references.

---

## 4. Module System

OpenMRS modules are **OSGi-like JAR packages** that:
- Contain their own Liquibase migrations
- Register their own Spring beans
- Expose their own REST endpoints under `/ws/rest/v1/`
- Can hook into core services via **extension points**
- Are loaded/unloaded at runtime without restart

**Key modules in the ecosystem:**
| Module | Purpose |
|---|---|
| `webservices.rest` | REST API for the entire platform |
| `fhir2` | FHIR R4 endpoints |
| `reporting` | Report definitions and execution |
| `htmlformentry` | Form builder (closest to our template engine) |
| `appointmentscheduling` | Appointment slots and booking |
| `orderentry` | Lab/drug/radiology orders |

**Key insight for Arogya Mitra:** We don't need runtime module loading. Our "modular monolith" achieves the same isolation via **folder boundaries + event bus** (§15 of blueprint). Simpler, same result.

---

## 5. Code Quality Assessment

### Strengths
- **Excellent test coverage** — Codecov badge, Sonar quality gate, Snyk security scanning on every PR
- **Clear layering** — Service → DAO → Hibernate is religiously enforced
- **Interface-first** — Every service has an interface, enabling mocking and future swapping
- **Audit trail built-in** — Every mutable entity has `creator`, `date_created`, `changed_by`, `date_changed`, `voided`, `voided_by`, `date_voided`, `void_reason`
- **Liquibase migrations** — Schema changes are versioned, timestamped, never edited after merge
- **20 years of battle-testing** — Edge cases are handled that no greenfield project would think of

### Weaknesses
- **Java verbosity** — Massive boilerplate (getters/setters/builders). Our Python/FastAPI stack eliminates this
- **MySQL-centric** — Core was built for MySQL; PostgreSQL support came later and has quirks
- **EAV performance** — The `obs` table becomes a bottleneck at scale (millions of rows with many joins). Our JSONB approach avoids this
- **Legacy frontend** — The AngularJS legacy UI coexists with O3 React, creating confusion
- **Complex deployment** — Requires Tomcat/Jetty, MySQL, multiple module JARs. Our Docker Compose approach is simpler
- **No billing/finance** — Not built for revenue cycle management at all. This is a Bahmni/Odoo bolt-on

---

## 6. Patterns to Adopt

| Pattern | OpenMRS Implementation | Arogya Mitra Adaptation |
|---|---|---|
| Concept-driven forms | Concept Dictionary + htmlformentry | JSON Schema templates in `specialty_templates` table |
| Immutable clinical records | Obs voiding (never delete) | `deleted_at` soft delete + `audit_logs` with before/after JSONB |
| Interface-first services | Java interfaces for all services | Python ABCs / Protocol classes for service layer |
| Extension points | Module extension points | Event bus (`packages/event-bus`) for cross-module triggers |
| REST + FHIR dual API | `/ws/rest/v1/` + `/ws/fhir2/R4/` | `/api/v1/` (REST) + FHIR R4 via `modules/abdm-integration` |
| Audit trail on entities | `creator`, `changed_by`, `voided` columns | `audit_logs` partitioned table with full JSONB diff |
| Configuration-first | O3 module config schemas | Role-based panel config, branch-level overrides |

---

## 7. Patterns to Avoid

| Anti-pattern | Why OpenMRS has it | Why we skip it |
|---|---|---|
| EAV for clinical data | Pre-dates JSONB; needed MySQL compatibility | JSONB gives same flexibility with better performance |
| Runtime module loading | Needed for community plugin ecosystem | We control all modules; compile-time is simpler |
| Hibernate + DAO layer | Java convention circa 2004 | SQLAlchemy with repository pattern is lighter |
| OSGi-like classloading | Module isolation for untrusted plugins | Our modules are trusted; folder boundaries suffice |
| MySQL-first | Historical choice | PostgreSQL from day one (UUID, JSONB, partitioning) |
