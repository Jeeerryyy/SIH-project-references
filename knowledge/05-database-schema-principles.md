# Database Schema Principles — Lessons from OpenMRS + Bahmni

> Core database design decisions for Arogya Mitra, derived from studying both reference systems.

---

## 1. PostgreSQL as the Single Database

**OpenMRS uses:** MySQL (primary), PostgreSQL (community-supported)
**Bahmni uses:** MySQL (OpenMRS) + PostgreSQL (Odoo) + Separate DB (OpenELIS)

**We use:** PostgreSQL 16+ exclusively

**Why PostgreSQL over MySQL for a healthcare system:**

| Feature | PostgreSQL | MySQL |
|---|---|---|
| JSONB with GIN indexing | ✅ Native, fast | ❌ JSON type exists, no GIN |
| Table partitioning | ✅ Declarative partitioning | ⚠️ Limited |
| Row-Level Security (RLS) | ✅ Native policies | ❌ Not available |
| UUID native type | ✅ `uuid` type | ⚠️ Stored as BINARY(16) or CHAR(36) |
| Full-text search | ✅ `tsvector` + GIN | ⚠️ FULLTEXT index (basic) |
| Recursive CTEs | ✅ Full support | ✅ Supported |
| Listen/Notify | ✅ Built-in pub/sub | ❌ Not available |
| HIPAA / healthcare compliance | ✅ Widely used in healthcare | ✅ Widely used |

---

## 2. Schema Organization (Multi-Schema within Single DB)

Instead of Bahmni's multi-database approach, we use **PostgreSQL schemas** for logical module isolation:

```sql
-- One database, multiple schemas
CREATE SCHEMA core;          -- patients, encounters, staff, branches
CREATE SCHEMA clinical;      -- observations, diagnoses, prescriptions, vitals
CREATE SCHEMA scheduling;    -- appointments, ot_scheduling, queue
CREATE SCHEMA lab;           -- lab_orders, samples, results, panels
CREATE SCHEMA pharmacy;      -- drugs, dispensing, inventory, purchase_orders
CREATE SCHEMA billing;       -- bills, bill_items, payments, insurance_claims
CREATE SCHEMA radiology;     -- imaging_orders, reports, pacs_links
CREATE SCHEMA ipd;           -- admissions, beds, nursing_notes, diet_charts
CREATE SCHEMA hr;            -- staff_details, attendance, payroll, leaves
CREATE SCHEMA inventory;     -- items, stock_movements, purchase_orders
CREATE SCHEMA admin;         -- branches, departments, roles, permissions
CREATE SCHEMA audit;         -- audit_logs (partitioned by month)
CREATE SCHEMA abdm;          -- abha_registrations, consent_artifacts, hip_links
```

**Benefits:**
- `pg_dump` can backup individual schemas
- Permissions can be set per-schema
- No naming collisions between modules
- Logical grouping for developers
- Cross-schema joins still work (it's one database)

---

## 3. Core Table Design Patterns

### 3.1 Base Model (Every Table Inherits This)

```python
class BaseModel(Base):
    """Every table in the system inherits these columns"""
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)  # Soft delete
    deleted_by = Column(UUID(as_uuid=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Every query automatically filters: WHERE deleted_at IS NULL AND is_active = TRUE
```

### 3.2 Branch-Scoped Model (Multi-Tenant Tables)

```python
class BranchScopedModel(BaseModel):
    """Tables that are branch-specific"""
    __abstract__ = True
    
    branch_id = Column(UUID(as_uuid=True), ForeignKey("admin.branches.id"), nullable=False, index=True)
    
    # RLS policy ensures queries only see rows for the user's branch
```

### 3.3 Clinical Observation Storage (JSONB, Not EAV)

```sql
-- OpenMRS style (EAV) - WE DO NOT DO THIS
CREATE TABLE obs (
    obs_id INT PRIMARY KEY,
    person_id INT REFERENCES person(person_id),
    concept_id INT REFERENCES concept(concept_id),
    encounter_id INT REFERENCES encounter(encounter_id),
    value_numeric DOUBLE,
    value_text TEXT,
    value_datetime TIMESTAMP,
    -- ... 15+ columns for different value types
);

-- Arogya Mitra style (JSONB) - OUR APPROACH
CREATE TABLE clinical.encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES core.patients(id),
    provider_id UUID NOT NULL REFERENCES core.staff(id),
    branch_id UUID NOT NULL REFERENCES admin.branches(id),
    encounter_type VARCHAR(50) NOT NULL, -- 'OPD', 'IPD_ROUND', 'EMERGENCY'
    encounter_datetime TIMESTAMPTZ NOT NULL,
    
    -- All clinical data in structured JSONB
    vitals JSONB,           -- {"bp_sys": 120, "bp_dia": 80, "pulse": 72, "temp": 98.6, "spo2": 98}
    chief_complaints JSONB, -- [{"complaint": "Chest pain", "duration": "2 days", "severity": "moderate"}]
    examination JSONB,      -- Form data per specialty (validated against JSON Schema)
    diagnosis JSONB,        -- [{"icd10": "I25.1", "description": "Atherosclerotic heart disease", "type": "primary"}]
    prescriptions JSONB,    -- [{"drug_id": "uuid", "name": "Aspirin", "dose": "75mg", "route": "Oral", "frequency": "OD"}]
    procedures JSONB,       -- [{"cpt": "93000", "description": "ECG", "findings": "Normal sinus rhythm"}]
    plan JSONB,             -- {"follow_up_days": 7, "investigations": ["CBC", "Lipid Profile"], "referrals": []}
    
    -- Audit (OpenMRS pattern)
    voided BOOLEAN DEFAULT FALSE,
    voided_by UUID REFERENCES core.staff(id),
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES core.staff(id)
);

-- GIN indexes for fast JSONB queries
CREATE INDEX idx_encounters_vitals ON clinical.encounters USING GIN (vitals);
CREATE INDEX idx_encounters_diagnosis ON clinical.encounters USING GIN (diagnosis);
CREATE INDEX idx_encounters_patient ON clinical.encounters (patient_id, encounter_datetime DESC);
CREATE INDEX idx_encounters_branch ON clinical.encounters (branch_id, encounter_datetime DESC);
```

---

## 4. Key Tables (Core Schema)

### 4.1 Patients

```sql
CREATE TABLE core.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn VARCHAR(30) UNIQUE NOT NULL,     -- "AGYM-DEL-2026-000001"
    abha_id VARCHAR(20) UNIQUE,          -- ABDM 14-digit ABHA number
    abha_address VARCHAR(100),           -- user@abdm handle
    
    -- Demographics
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL,         -- 'male', 'female', 'other'
    blood_group VARCHAR(5),
    
    -- Contact (encrypted at rest)
    phone_primary VARCHAR(15) NOT NULL,
    phone_secondary VARCHAR(15),
    email VARCHAR(255),
    
    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    pin_code VARCHAR(10),
    
    -- Identity (encrypted)
    aadhaar_hash VARCHAR(64),            -- SHA-256 hash only (DPDP Act)
    
    -- Photo
    photo_url TEXT,
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(15),
    emergency_contact_relation VARCHAR(50),
    
    -- Insurance
    insurance_provider VARCHAR(200),
    insurance_policy_number VARCHAR(50),
    pmjay_id VARCHAR(30),               -- PM-JAY beneficiary ID
    
    -- System
    registration_branch_id UUID NOT NULL REFERENCES admin.branches(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMPTZ,
    updated_by UUID,
    deleted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- NOTE: patients table does NOT have branch_id filter
-- Patients are visible across ALL branches (they may visit multiple hospitals)
-- Encounters, appointments, bills ARE branch-scoped
```

---

## 5. Audit Log Design (From OpenMRS, Improved)

**OpenMRS approach:** Per-entity audit columns (`creator`, `changed_by`, etc.)
**Our approach:** Per-entity audit columns + **centralized audit log table**

```sql
CREATE TABLE audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Who
    user_id UUID NOT NULL,
    user_role VARCHAR(50),
    user_ip INET,
    
    -- What
    entity_type VARCHAR(100) NOT NULL,  -- 'patient', 'encounter', 'bill'
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,        -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
    
    -- Change details
    before_state JSONB,                 -- Full entity state before change
    after_state JSONB,                  -- Full entity state after change
    diff JSONB,                         -- Only the changed fields
    
    -- Context
    branch_id UUID,
    module VARCHAR(50),                 -- 'clinical', 'billing', 'pharmacy'
    endpoint VARCHAR(255),              -- '/api/v1/patients/{id}'
    request_id UUID                     -- Correlation ID for tracing
) PARTITION BY RANGE (timestamp);

-- Monthly partitions for performance
CREATE TABLE audit.audit_logs_2026_01 PARTITION OF audit.audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- ... create partitions dynamically via Alembic migration or cron
```

**Why partitioned:** Audit logs grow massively. Partitioning by month allows:
- Fast queries on recent data
- Easy archival of old partitions
- `DROP` old partitions without vacuuming

---

## 6. Migration Strategy (Alembic)

**OpenMRS uses:** Liquibase (XML-based)
**We use:** Alembic (Python-native, integrates with SQLAlchemy)

```
backend/
  alembic/
    versions/
      001_initial_schema.py
      002_add_pharmacy_tables.py
      003_add_insurance_claims.py
    env.py
  alembic.ini
```

**Rules (from OpenMRS best practices):**
1. Never edit a committed migration
2. Each migration is reversible (has `downgrade()`)
3. Migration file names include timestamp + description
4. Test migrations on a fresh database AND on a populated database
5. Data migrations are separate files from schema migrations
