# Design Patterns & Anti-Patterns Extracted from Reference Systems

> Actionable patterns we MUST adopt and anti-patterns we MUST avoid, derived from studying OpenMRS and Bahmni codebases.

---

## PART A: Patterns to Adopt

---

### Pattern 1: Encounter-Based Clinical Data Grouping

**Source:** OpenMRS core data model

**The pattern:** Every piece of clinical data (vitals, notes, diagnosis, prescriptions) is attached to an **Encounter** — which represents "one interaction between a patient and a provider at a specific time in a specific location."

```python
# Our adaptation in SQLAlchemy
class Encounter(Base):
    __tablename__ = "encounters"
    
    id = Column(UUID, primary_key=True, default=uuid4)
    patient_id = Column(UUID, ForeignKey("patients.id"), nullable=False)
    provider_id = Column(UUID, ForeignKey("staff.id"), nullable=False)
    branch_id = Column(UUID, ForeignKey("branches.id"), nullable=False)  # Multi-branch!
    encounter_type = Column(String)  # OPD, IPD_ROUND, EMERGENCY, TELECONSULT
    encounter_datetime = Column(DateTime(timezone=True), nullable=False)
    form_data = Column(JSONB)  # All clinical observations as structured JSON
    
    # Audit fields (from OpenMRS pattern)
    created_by = Column(UUID, ForeignKey("staff.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    voided = Column(Boolean, default=False)
    voided_by = Column(UUID, ForeignKey("staff.id"), nullable=True)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    void_reason = Column(String, nullable=True)
```

**Why:** This ensures that clinical data is never "floating" — it always has context (who, when, where, why).

---

### Pattern 2: Soft Delete + Void Pattern for Clinical Records

**Source:** OpenMRS — `voided`, `voided_by`, `date_voided`, `void_reason` on every clinical entity

**The pattern:** Clinical data is NEVER hard-deleted. Instead:
1. The original record is marked `voided = True`
2. A reason is recorded (`void_reason`)
3. A new corrected record is created
4. The audit log captures the full before/after diff

```python
# Our adaptation
class SoftDeleteMixin:
    """Applied to ALL clinical entities"""
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    deleted_by = Column(UUID, nullable=True)
    delete_reason = Column(String, nullable=True)
    
    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None

class AuditMixin:
    """Applied to ALL entities"""
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(UUID, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    updated_by = Column(UUID, nullable=True)
```

**Why:** Medical-legal requirement. Clinical records cannot be deleted — they must be traceable forever.

---

### Pattern 3: Configuration-Driven Forms (Not Hardcoded)

**Source:** OpenMRS `htmlformentry` module + Bahmni form configuration

**The pattern:** Clinical forms are NOT hardcoded React components per specialty. Instead:
1. A **JSON Schema** defines the form structure (fields, types, validations, conditional logic)
2. A **generic form renderer** reads the schema and builds the UI
3. Hospitals can add/modify forms without code changes

```json
{
  "specialty": "cardiology",
  "version": "1.0",
  "sections": [
    {
      "title": "Cardiac Examination",
      "fields": [
        {
          "name": "ejection_fraction",
          "type": "number",
          "label": "Ejection Fraction (%)",
          "min": 0,
          "max": 100,
          "required": true,
          "unit": "%"
        },
        {
          "name": "rhythm",
          "type": "select",
          "label": "Rhythm",
          "options": ["Normal Sinus", "Atrial Fibrillation", "SVT", "VT", "Other"],
          "required": true
        },
        {
          "name": "murmur",
          "type": "multi-select",
          "label": "Murmurs",
          "options": ["None", "Systolic", "Diastolic", "Continuous"],
          "conditional": {
            "show_if": {"field": "rhythm", "not_equals": "Normal Sinus"}
          }
        }
      ]
    }
  ]
}
```

**Why:** India has 30+ medical specialties. Hardcoding forms = 30+ separate React pages. JSON Schema = 30 config files + 1 renderer.

---

### Pattern 4: Service-Layer Interface Abstraction

**Source:** OpenMRS — every service has a Java interface + implementation

**The pattern:** Business logic lives in service classes that implement an abstract contract. This enables:
- Unit testing with mocks
- Swapping implementations (e.g., mock billing service for tests)
- Clear API boundaries between modules

```python
# Our adaptation using Python Protocol
from typing import Protocol

class PatientService(Protocol):
    async def register(self, data: PatientCreate) -> Patient: ...
    async def search(self, query: str, branch_id: UUID) -> list[Patient]: ...
    async def get_by_abha(self, abha_id: str) -> Patient | None: ...

class PatientServiceImpl:
    """Concrete implementation"""
    def __init__(self, db: AsyncSession, event_bus: EventBus):
        self.db = db
        self.event_bus = event_bus
    
    async def register(self, data: PatientCreate) -> Patient:
        patient = Patient(**data.model_dump())
        self.db.add(patient)
        await self.db.flush()
        await self.event_bus.publish("patient.registered", patient.id)
        return patient
```

---

### Pattern 5: Event-Driven Cross-Module Communication

**Source:** Bahmni Atom Feed pattern (improved)

**The pattern:** Modules don't call each other directly. Instead, they publish events and subscribe to events.

```python
# Our adaptation: Redis Streams-based event bus
class EventBus:
    async def publish(self, event_type: str, payload: dict):
        """Publish event to Redis Stream"""
        await self.redis.xadd(f"events:{event_type}", payload)
    
    async def subscribe(self, event_type: str, handler: Callable):
        """Subscribe to event type"""
        # Consumer group reads from stream

# Usage: Lab module subscribes to order events
@event_bus.on("order.lab.created")
async def handle_lab_order(event):
    """Auto-create sample collection task when a lab order is placed"""
    await create_sample_task(event["order_id"])

# Usage: Billing module subscribes to discharge events
@event_bus.on("ipd.discharge.completed")
async def handle_discharge_billing(event):
    """Generate final bill when patient is discharged"""
    await generate_final_bill(event["admission_id"])
```

**Bahmni's version (Atom Feed):** HTTP polling, separate databases, minutes of lag
**Our version (Redis Streams):** Push-based, same process, millisecond delivery

---

### Pattern 6: Branch-Scoped Data Isolation

**Source:** Gap in both OpenMRS and Bahmni (our innovation)

**The pattern:** Every tenant-scoped query automatically includes `branch_id` filtering.

```python
# Middleware that injects branch_id into every DB query
class BranchScopeMiddleware:
    async def __call__(self, request, call_next):
        branch_id = get_branch_from_jwt(request)
        request.state.branch_id = branch_id
        # SQLAlchemy event listener adds WHERE branch_id = X to all queries
        return await call_next(request)

# Model mixin
class BranchScopedMixin:
    branch_id = Column(UUID, ForeignKey("branches.id"), nullable=False, index=True)

# Tables that get this mixin: appointments, encounters, bills, beds, inventory_items, staff_assignments, etc.
# Tables that DON'T: patients (visible across branches), drugs (master catalog), ICD codes (global)
```

---

### Pattern 7: UUID + Human-Readable ID Dual Identification

**Source:** OpenMRS uses both `person_id` (internal) and identifiers like MRN

**The pattern:** Internal operations use UUIDs. Patient-facing / label-printing uses human-readable IDs.

```python
class Patient(Base):
    id = Column(UUID, primary_key=True, default=uuid4)       # Internal
    mrn = Column(String, unique=True, index=True)             # Human: "AGYM-DEL-2026-000001"
    abha_id = Column(String, unique=True, nullable=True)      # National: 14-digit ABHA

# MRN format: {SYSTEM_PREFIX}-{BRANCH_CODE}-{YEAR}-{SEQUENCE}
# "AGYM-DEL-2026-000001" → Arogya Mitra, Delhi branch, 2026, patient #1
```

---

## PART B: Anti-Patterns to Avoid

---

### Anti-Pattern 1: EAV for Clinical Data Storage
**Source:** OpenMRS `obs` table
**Problem:** N observations = N rows + N joins for queries
**Our alternative:** JSONB with JSON Schema validation

### Anti-Pattern 2: Multi-Database Architecture
**Source:** Bahmni (MySQL for OpenMRS + PostgreSQL for Odoo + separate DB for OpenELIS)
**Problem:** No cross-system joins, sync lag, backup complexity
**Our alternative:** Single PostgreSQL with schema-level module isolation

### Anti-Pattern 3: HTTP Polling for Internal Events
**Source:** Bahmni Atom Feed
**Problem:** Latency, complexity, failure tracking across systems
**Our alternative:** In-process Redis Streams

### Anti-Pattern 4: Runtime Module Loading
**Source:** OpenMRS OSGi-like module system
**Problem:** Classloading nightmares, startup order dependencies, hard to debug
**Our alternative:** Import-time module registration; all modules loaded at startup

### Anti-Pattern 5: Framework-Level Abstraction Over Database
**Source:** OpenMRS Hibernate HQL queries that abstract away SQL
**Problem:** Lost control over query performance; N+1 queries hidden by lazy loading
**Our alternative:** SQLAlchemy with explicit queries; `selectinload()` for relations; raw SQL for reports

### Anti-Pattern 6: AngularJS / Untyped Frontend
**Source:** Bahmni Apps
**Problem:** No type safety, hard to refactor, AngularJS is dead
**Our alternative:** React + TypeScript + Component library from day one

---

## PART C: Quality Checklist (Pre-Commit for Every Module)

Derived from OpenMRS's CI pipeline:

```yaml
# .github/workflows/ci.yml principles
quality_gates:
  - ruff check .                    # Linting (replaces flake8+isort+black)
  - ruff format --check .           # Formatting
  - mypy --strict app/              # Type checking
  - pytest --cov=app --cov-fail-under=80  # Unit tests with 80% coverage minimum
  - bandit -r app/                  # Security scan
  - pip-audit                       # Dependency vulnerability scan
  - alembic check                   # Migration state verification
  - openapi-diff                    # API backward compatibility check
```
