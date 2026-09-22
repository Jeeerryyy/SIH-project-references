# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 02. Database Schema & Data Architecture Specification

**Document Reference:** `MCCPHP-DOC-02-DB`  
**Engine:** PostgreSQL 16 Enterprise with `postgis`, `pgcrypto`, `pgvector`, `uuid-ossp`  
**Total Tables:** 58 Production Tables across 11 Functional Domains  
**Scale Target:** 125 Million Citizens, 2 Billion Encounters, 500 Million Prescriptions

---

### 1. Schema Overview & Domain Distribution

The database schema is structured into 11 strictly bounded relational domains:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MCCPHP DATABASE (58 TABLES)                       │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ 1. Core Identity & Auth  │ 2. Facility & Org Engine │ 3. Patient Master     │
│   - users                │   - facilities           │   - patients          │
│   - roles                │   - departments          │   - patient_identities│
│   - permissions          │   - wards                │   - family_memberships│
│   - role_permissions     │   - beds                 │   - patient_allergies │
│   - user_facility_assign │   - facility_services    │   - patient_vitals_log│
│   - user_sessions        │   - facility_rosters     │                       │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ 4. Queue & Encounters    │ 5. Clinical EMR & SOAP   │ 6. Pharmacy & Drug SC │
│   - appointment_slots    │   - encounters           │   - drug_catalogue    │
│   - appointments         │   - soap_notes           │   - facility_inventory│
│   - queue_tokens         │   - clinical_diagnoses   │   - prescriptions     │
│   - queue_counters       │   - clinical_orders      │   - rx_items          │
│   - triage_assessments   │   - care_plans           │   - drug_dispensations│
│                          │   - referrals            │   - stock_transfers   │
│                          │   - discharge_summaries  │   - drug_adverse_react│
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ 7. Diagnostic & Lab (LIS)│ 8. Telemedicine Engine   │ 9. ASHA & Community   │
│   - lab_test_catalogue   │   - teleconsult_sessions │   - households        │
│   - lab_orders           │   - teleconsult_notes    │   - field_surveys     │
│   - lab_specimens        │   - waiting_room_entries │   - anc_visits        │
│   - lab_results          │   - call_recordings_meta │   - pnc_visits        │
│   - radiology_studies    │                          │   - child_immunization│
│                          │                          │   - ncd_screenings    │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│ 10. IDSP Surveillance    │ 11. Security, Audit & DP │                       │
│   - syndromic_reports    │   - audit_logs (Part.)   │                       │
│   - disease_outbreaks    │   - consent_artifacts    │                       │
│   - outbreak_cases       │   - consent_access_logs  │                       │
│   - lab_pathogen_alerts  │   - dpdp_grievances      │                       │
│   - vector_surveillance  │   - system_configs       │                       │
│                          │   - data_export_jobs     │                       │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

---

### 2. Complete Master Table Definitions & DDL Specifications

#### Domain 1: Core Identity & RBAC (6 Tables)

```sql
-- 1. users: Master identity for all actors (Doctors, Staff, Administrators, Citizens)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name_en VARCHAR(255) NOT NULL,
    full_name_mr VARCHAR(255),
    gender VARCHAR(20) CHECK (gender IN ('MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED')),
    date_of_birth DATE,
    abha_address VARCHAR(100) UNIQUE,
    abha_number VARCHAR(17) UNIQUE,
    hpr_id VARCHAR(50) UNIQUE, -- Healthcare Professional Registry ID
    designation VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    two_factor_secret VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'mr' CHECK (preferred_language IN ('mr', 'hi', 'en')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. roles: System and customized clinical roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'DOCTOR', 'STAFF_NURSE', 'PHARMACIST', 'ASHA_WORKER', 'DHO'
    name_en VARCHAR(100) NOT NULL,
    name_mr VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. permissions: Granular atomic capabilities
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g. 'emr:write', 'prescription:sign', 'outbreak:declare'
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. role_permissions: Join table mapping roles to capabilities
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. user_facility_assignments: 6D Context binding user to health institutions
CREATE TABLE user_facility_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    valid_from DATE NOT NULL,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. user_sessions: Active refresh tokens & security telemetry
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 2: Health Facility & Administrative Hierarchy (6 Tables)

```sql
-- 7. facilities: Government & Empanelled health centers across Maharashtra
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hfr_id VARCHAR(50) UNIQUE, -- Health Facility Registry (HFR/NIN) code
    name_en VARCHAR(255) NOT NULL,
    name_mr VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50) NOT NULL CHECK (facility_type IN (
        'SUB_CENTRE', 'PRIMARY_HEALTH_CENTRE', 'COMMUNITY_HEALTH_CENTRE',
        'SUB_DISTRICT_HOSPITAL', 'DISTRICT_HOSPITAL', 'MEDICAL_COLLEGE_HOSPITAL',
        'URBAN_PHC', 'SUPER_SPECIALTY', 'MOBILE_MEDICAL_UNIT'
    )),
    division VARCHAR(100) NOT NULL, -- Konkan, Pune, Nashik, Aurangabad, Amravati, Nagpur
    district VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    village_town VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    address_text TEXT NOT NULL,
    location GEOMETRY(Point, 4326), -- PostGIS Spatial Coordinate (Longitude, Latitude)
    total_sanctioned_beds INTEGER DEFAULT 0,
    operational_icu_beds INTEGER DEFAULT 0,
    operational_oxygen_beds INTEGER DEFAULT 0,
    operational_general_beds INTEGER DEFAULT 0,
    is_teleconsult_hub BOOLEAN DEFAULT FALSE,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. departments: Specialized clinical units within a facility
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    name_en VARCHAR(100) NOT NULL, -- 'General Medicine', 'Pediatrics', 'Obstetrics & Gynecology'
    name_mr VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    floor_room VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(facility_id, code)
);

-- 9. wards: Inpatient hospital wards
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    ward_type VARCHAR(50) CHECK (ward_type IN ('MALE_GENERAL', 'FEMALE_GENERAL', 'PEDIATRIC', 'ICU', 'NICU', 'ISOLATION', 'LABOUR_ROOM')),
    total_beds INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 10. beds: Individual bed tracking & telemetry
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    bed_type VARCHAR(50) CHECK (bed_type IN ('REGULAR', 'OXYGEN', 'ICU_VENTILATOR', 'ICU_NON_VENTILATOR')),
    status VARCHAR(50) DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'BLOCKED')),
    current_patient_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(ward_id, bed_number)
);

-- 11. facility_services: Catalogue of clinical offerings (e.g. USG, X-Ray, Dialysis, Normal Delivery)
CREATE TABLE facility_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    service_code VARCHAR(50) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    operating_hours TEXT,
    UNIQUE(facility_id, service_code)
);

-- 12. facility_rosters: Doctor and nurse duty shifts
CREATE TABLE facility_rosters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50) CHECK (shift_type IN ('MORNING', 'EVENING', 'NIGHT', 'EMERGENCY_ON_CALL')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 3: Patient Master Index (MPI) & Demographics (6 Tables)

```sql
-- 13. patients: Universal longitudinal patient profile
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uhid VARCHAR(50) UNIQUE NOT NULL, -- Universal Health ID (MH-YYYY-XXXXXXXX)
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN')),
    marital_status VARCHAR(20),
    primary_mobile VARCHAR(15) NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    home_address_text TEXT NOT NULL,
    district VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    village_town VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    assigned_asha_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_phc_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    bpl_card_number VARCHAR(50),
    is_tribal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. patient_identities: Secure multi-credential linkage (ABHA, Ration, PMJAY)
CREATE TABLE patient_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    identity_type VARCHAR(50) NOT NULL CHECK (identity_type IN ('ABHA_ID', 'ABHA_NUMBER', 'AADHAAR_VAULT_TOKEN', 'RATION_CARD', 'PMJAY_ID', 'VOTER_ID')),
    identity_value_hash VARCHAR(255) NOT NULL, -- SHA-256 masked hash
    encrypted_value TEXT NOT NULL, -- AES-256 encrypted payload
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(identity_type, identity_value_hash)
);

-- 15. family_memberships: Social demographic family unit grouping
CREATE TABLE family_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relationship_to_head VARCHAR(50) NOT NULL, -- 'HEAD', 'SPOUSE', 'SON', 'DAUGHTER', 'MOTHER', 'FATHER'
    is_head_of_family BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(household_id, patient_id)
);

-- 16. patient_allergies: Adverse drug reactions & clinical allergies
CREATE TABLE patient_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    allergen_type VARCHAR(50) CHECK (allergen_type IN ('DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER')),
    allergen_name VARCHAR(255) NOT NULL,
    reaction_description TEXT,
    severity VARCHAR(50) CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING')),
    diagnosed_at DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. patient_vitals_log: Time-series vitals telemetry
CREATE TABLE patient_vitals_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate_bpm INTEGER,
    pulse_rate_bpm INTEGER,
    temperature_fahrenheit NUMERIC(4, 1),
    spo2_percentage INTEGER,
    respiratory_rate_bpm INTEGER,
    blood_glucose_mg_dl INTEGER,
    weight_kg NUMERIC(5, 2),
    height_cm NUMERIC(5, 2),
    bmi NUMERIC(4, 1),
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 4: Queue, Appointments & Triage (5 Tables)

```sql
-- 18. appointment_slots: Doctor/Department OPD slot definitions
CREATE TABLE appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER NOT NULL DEFAULT 30,
    booked_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 19. appointments: Citizen & Referral bookings
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    slot_id UUID REFERENCES appointment_slots(id) ON DELETE SET NULL,
    appointment_type VARCHAR(50) CHECK (appointment_type IN ('PHYSICAL_OPD', 'TELECONSULTATION', 'SPECIALIST_REFERRAL', 'FOLLOW_UP')),
    status VARCHAR(50) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    chief_complaint TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 20. queue_tokens: Real-time multi-counter OPD queue engine
CREATE TABLE queue_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL, -- e.g. 'OPD-MED-042'
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL' CHECK (priority IN ('EMERGENCY', 'PREGNANT_OR_SENIOR', 'REFERRAL', 'NORMAL')),
    status VARCHAR(50) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_CONSULTATION', 'PHARMACY_QUEUE', 'LAB_QUEUE', 'COMPLETED', 'SKIPPED')),
    counter_id UUID REFERENCES queue_counters(id) ON DELETE SET NULL,
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 21. queue_counters: Physical room/booth stations
CREATE TABLE queue_counters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    counter_code VARCHAR(20) NOT NULL, -- 'ROOM-104', 'COUNTER-3'
    assigned_staff_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 22. triage_assessments: Emergency & OPD nursing triage
CREATE TABLE triage_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL REFERENCES queue_tokens(id) ON DELETE CASCADE,
    triage_category VARCHAR(50) CHECK (triage_category IN ('RED_RESUSCITATION', 'YELLOW_EMERGENT', 'GREEN_URGENT', 'BLUE_NON_URGENT')),
    glasgow_coma_scale INTEGER,
    pain_score INTEGER CHECK (pain_score BETWEEN 0 AND 10),
    is_pregnant BOOLEAN DEFAULT FALSE,
    triage_notes TEXT,
    triaged_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 5: Clinical EMR, Encounters & Care Pathways (7 Tables)

```sql
-- 23. encounters: Master clinical visit record (OPD, IPD, Emergency, Teleconsult)
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    primary_practitioner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    encounter_class VARCHAR(50) NOT NULL CHECK (encounter_class IN ('OPD', 'IPD', 'EMERGENCY', 'FIELD_VISIT', 'TELECONSULT')),
    status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED')),
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at TIMESTAMPTZ,
    district VARCHAR(100) NOT NULL, -- For horizontal partitioning & reporting
    fhir_bundle_json JSONB, -- Pre-compiled FHIR R4 Encounter bundle
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 24. soap_notes: Structured clinical consultation documentation
CREATE TABLE soap_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    subjective_complaints TEXT NOT NULL,
    history_of_present_illness TEXT,
    objective_findings TEXT,
    assessment_summary TEXT NOT NULL,
    plan_notes TEXT NOT NULL,
    doctor_digital_signature TEXT, -- Cryptographic eSign signature
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 25. clinical_diagnoses: ICD-10 & SNOMED-CT coded disease findings
CREATE TABLE clinical_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    icd10_code VARCHAR(20) NOT NULL,
    icd10_display VARCHAR(255) NOT NULL,
    snomed_concept_id VARCHAR(50),
    diagnosis_type VARCHAR(50) CHECK (diagnosis_type IN ('PROVISIONAL', 'DIFFERENTIAL', 'FINAL', 'SECONDARY')),
    is_notifiable_disease BOOLEAN DEFAULT FALSE NOT NULL, -- Flag for IDSP outbreak hook
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 26. clinical_orders: Physician orders for labs, radiology, and interventions
CREATE TABLE clinical_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    order_type VARCHAR(50) CHECK (order_type IN ('LAB_TEST', 'RADIOLOGY', 'PROCEDURE', 'DIET', 'NURSING_CARE')),
    order_code VARCHAR(50) NOT NULL,
    order_description TEXT NOT NULL,
    instructions TEXT,
    urgency VARCHAR(50) DEFAULT 'ROUTINE' CHECK (urgency IN ('STAT_IMMEDIATE', 'URGENT', 'ROUTINE')),
    status VARCHAR(50) DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 27. care_plans: Longitudinal management plans for chronic diseases (NCDs)
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL, -- 'Hypertension Stage 2 Control Plan'
    target_goals JSONB NOT NULL, -- [{"metric": "systolic_bp", "target": "< 130"}]
    dietary_instructions TEXT,
    activity_instructions TEXT,
    follow_up_interval_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 28. referrals: Inter-facility tiered care transfers (PHC -> CHC -> DH -> MCH)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    origin_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    origin_encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    target_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    target_specialty VARCHAR(100) NOT NULL,
    reason_for_referral TEXT NOT NULL,
    clinical_summary TEXT NOT NULL,
    transport_arranged BOOLEAN DEFAULT FALSE,
    ambulance_request_id VARCHAR(50), -- 108 dispatch ID
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'TRANSIT', 'ADMITTED', 'REJECTED', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 29. discharge_summaries: Inpatient discharge clinical certificates
CREATE TABLE discharge_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    admission_date TIMESTAMPTZ NOT NULL,
    discharge_date TIMESTAMPTZ NOT NULL,
    discharge_condition VARCHAR(50) CHECK (discharge_condition IN ('RECOVERED', 'IMPROVED', 'TRANSFERRED', 'AGAINST_MEDICAL_ADVICE', 'DECEASED')),
    course_in_hospital TEXT NOT NULL,
    discharge_medications JSONB NOT NULL,
    follow_up_instructions TEXT NOT NULL,
    authorized_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    digital_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 6: Pharmacy, e-Prescriptions & Supply Chain (7 Tables)

```sql
-- 30. drug_catalogue: Maharashtra Standard Essential Drug List (EDL)
CREATE TABLE drug_catalogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_code VARCHAR(50) UNIQUE NOT NULL, -- e-Aushadhi / NLEM code
    generic_name VARCHAR(255) NOT NULL,
    brand_name VARCHAR(255),
    dosage_form VARCHAR(50) NOT NULL CHECK (dosage_form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'INHALER', 'IV_FLUID')),
    strength VARCHAR(100) NOT NULL, -- '500mg', '10mg/ml'
    schedule_category VARCHAR(10) CHECK (schedule_category IN ('H', 'H1', 'X', 'GENERAL')),
    is_essential_drug BOOLEAN DEFAULT TRUE NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'UNIT',
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 31. facility_inventory: Stock on hand at specific hospital/PHC pharmacies
CREATE TABLE facility_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_catalogue(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER DEFAULT 50,
    cost_per_unit NUMERIC(10, 2) DEFAULT 0.00,
    storage_location VARCHAR(100),
    last_audited_at TIMESTAMPTZ,
    UNIQUE(facility_id, drug_id, batch_number)
);

-- 32. prescriptions: Master e-prescription header
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    prescribed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    general_instructions TEXT,
    prescribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIALLY_DISPENSED', 'FULLY_DISPENSED', 'CANCELLED'))
);

-- 33. rx_items: Specific line items in a prescription
CREATE TABLE rx_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_catalogue(id) ON DELETE RESTRICT,
    dosage_instructions VARCHAR(100) NOT NULL, -- '1-0-1' (Morning-Afternoon-Night)
    frequency VARCHAR(50) NOT NULL, -- 'TWICE_A_DAY', 'ONCE_A_DAY', 'AS_NEEDED'
    duration_days INTEGER NOT NULL,
    total_quantity_prescribed INTEGER NOT NULL,
    food_relation VARCHAR(50) CHECK (food_relation IN ('BEFORE_FOOD', 'AFTER_FOOD', 'WITH_FOOD', 'EMPTY_STOMACH')),
    special_notes TEXT
);

-- 34. drug_dispensations: Records of pharmacist item distribution
CREATE TABLE drug_dispensations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
    rx_item_id UUID NOT NULL REFERENCES rx_items(id) ON DELETE RESTRICT,
    inventory_id UUID NOT NULL REFERENCES facility_inventory(id) ON DELETE RESTRICT,
    dispensed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity_dispensed INTEGER NOT NULL,
    dispensed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 35. stock_transfers: Inter-facility medicine movements (e.g. DH surplus to PHC)
CREATE TABLE stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    to_facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    drug_id UUID NOT NULL REFERENCES drug_catalogue(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'IN_TRANSIT' CHECK (status IN ('REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'REJECTED')),
    initiated_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 36. drug_adverse_reactions: Pharmacovigilance reporting
CREATE TABLE drug_adverse_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES drug_catalogue(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reaction_symptoms TEXT NOT NULL,
    severity VARCHAR(50) CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'FATAL')),
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 7: Diagnostic & Laboratory (LIS) (5 Tables)

```sql
-- 37. lab_test_catalogue: Standard diagnostic panel and test directory
CREATE TABLE lab_test_catalogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'CBC', 'WIDAL', 'MALARIA_RPR', 'LFT'
    loinc_code VARCHAR(50), -- Universal LOINC mapping
    test_name VARCHAR(255) NOT NULL,
    sample_type VARCHAR(50) NOT NULL CHECK (sample_type IN ('WHOLE_BLOOD', 'SERUM', 'PLASMA', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF')),
    normal_range_min NUMERIC(10, 3),
    normal_range_max NUMERIC(10, 3),
    reference_unit VARCHAR(50),
    turnaround_time_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 38. lab_orders: Diagnostic test requests
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    ordered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    test_id UUID NOT NULL REFERENCES lab_test_catalogue(id) ON DELETE RESTRICT,
    priority VARCHAR(50) DEFAULT 'ROUTINE' CHECK (priority IN ('STAT', 'URGENT', 'ROUTINE')),
    status VARCHAR(50) DEFAULT 'ORDERED' CHECK (status IN ('ORDERED', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULT_READY', 'VERIFIED', 'CANCELLED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 39. lab_specimens: Physical biological sample tracking & barcodes
CREATE TABLE lab_specimens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode_id VARCHAR(100) UNIQUE NOT NULL,
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    collected_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    specimen_condition VARCHAR(50) DEFAULT 'SATISFACTORY' CHECK (specimen_condition IN ('SATISFACTORY', 'HEMOLYZED', 'LIPEMIC', 'INSUFFICIENT_VOLUME', 'CLOTTED'))
);

-- 40. lab_results: Quantitative and qualitative test findings
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID UNIQUE NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    measured_numeric_value NUMERIC(10, 3),
    measured_text_value TEXT,
    is_abnormal BOOLEAN DEFAULT FALSE NOT NULL,
    is_critical_panic_value BOOLEAN DEFAULT FALSE NOT NULL, -- Automatic alert trigger
    technician_notes TEXT,
    performed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 41. radiology_studies: Imaging orders (X-Ray, Sonography, CT) & DICOM links
CREATE TABLE radiology_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_instance_uid VARCHAR(128) UNIQUE NOT NULL,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    modality VARCHAR(20) CHECK (modality IN ('XR', 'US', 'CT', 'MR', 'ECG')),
    body_part VARCHAR(100) NOT NULL,
    radiologist_impression TEXT,
    dicom_storage_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

#### Domain 8: Telemedicine & Specialist Consult (4 Tables)

```sql
-- 42. teleconsult_sessions: LiveKit video and audio sessions
CREATE TABLE teleconsult_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_room_name VARCHAR(100) UNIQUE NOT NULL,
    encounter_id UUID UNIQUE NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    community_chw_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ASHA/CHO present on site
    status VARCHAR(50) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CONNECTED', 'DISCONNECTED', 'COMPLETED', 'FAILED')),
    scheduled_start TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    call_quality_rating INTEGER CHECK (call_quality_rating BETWEEN 1 AND 5)
);

-- 43. teleconsult_notes: Real-time collaborative clinical observation
CREATE TABLE teleconsult_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teleconsult_sessions(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 44. waiting_room_entries: Virtual queue for remote specialist consultation
CREATE TABLE waiting_room_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES teleconsult_sessions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    joined_waiting_room_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    device_check_passed BOOLEAN DEFAULT FALSE,
    estimated_wait_minutes INTEGER DEFAULT 15
);

-- 45. call_recordings_meta: Secure audit metadata of archived consults
CREATE TABLE call_recordings_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID UNIQUE NOT NULL REFERENCES teleconsult_sessions(id) ON DELETE CASCADE,
    storage_bucket_url TEXT NOT NULL,
    encryption_iv VARCHAR(255) NOT NULL,
    recorded_duration_seconds INTEGER NOT NULL,
    is_consent_recorded BOOLEAN DEFAULT TRUE NOT NULL
);
```

#### Domain 9: ASHA, ANM & Community Field Health (6 Tables)

```sql
-- 46. households: Village and urban slum household family registries
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_number VARCHAR(50) UNIQUE NOT NULL,
    assigned_asha_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    village_town VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    head_of_family_name VARCHAR(255) NOT NULL,
    total_members INTEGER NOT NULL DEFAULT 1,
    location GEOMETRY(Point, 4326),
    sanitation_facility BOOLEAN DEFAULT TRUE,
    drinking_water_source VARCHAR(100),
    is_bpl BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 47. field_surveys: General periodic community health rounds
CREATE TABLE field_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    surveyor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    survey_date DATE NOT NULL,
    survey_payload JSONB NOT NULL,
    sync_status VARCHAR(50) DEFAULT 'SYNCED' CHECK (sync_status IN ('LOCAL_SAVED', 'SYNCED', 'CONFLICT_RESOLVED')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 48. anc_visits: Antenatal care tracking for pregnant mothers
CREATE TABLE anc_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    asha_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_number INTEGER NOT NULL CHECK (visit_number BETWEEN 1 AND 8),
    gestational_age_weeks INTEGER NOT NULL,
    fundal_height_cm NUMERIC(4, 1),
    fetal_heart_rate_bpm INTEGER,
    hemoglobin_g_dl NUMERIC(4, 1),
    urine_albumin VARCHAR(20),
    iron_folic_acid_tablets_given INTEGER DEFAULT 0,
    is_high_risk_pregnancy BOOLEAN DEFAULT FALSE NOT NULL,
    high_risk_reasons TEXT[],
    visit_date DATE NOT NULL
);

-- 49. pnc_visits: Postnatal care tracking for new mothers & newborns
CREATE TABLE pnc_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    asha_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_day_post_delivery INTEGER NOT NULL, -- Day 1, 3, 7, 14, 21, 28, 42
    maternal_temperature NUMERIC(4, 1),
    excessive_bleeding BOOLEAN DEFAULT FALSE,
    baby_weight_kg NUMERIC(4, 2),
    baby_sucking_well BOOLEAN DEFAULT TRUE,
    baby_jaundice_observed BOOLEAN DEFAULT FALSE,
    visit_date DATE NOT NULL
);

-- 50. child_immunization: Universal Immunization Program (UIP) logs
CREATE TABLE child_immunization (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_code VARCHAR(50) NOT NULL, -- 'BCG', 'OPV-0', 'PENTAVALENT-1', 'ROTA-1', 'MR-1'
    dose_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    administered_date DATE,
    administered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    batch_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GIVEN', 'MISSED', 'REFUSED'))
);

-- 51. ncd_screenings: Population-based screening for Non-Communicable Diseases (CBAC)
CREATE TABLE ncd_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    screened_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cbac_score INTEGER NOT NULL,
    random_blood_sugar_mg_dl INTEGER,
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    oral_cancer_suspected BOOLEAN DEFAULT FALSE,
    breast_cancer_suspected BOOLEAN DEFAULT FALSE,
    cervical_cancer_suspected BOOLEAN DEFAULT FALSE,
    referred_to_phc BOOLEAN DEFAULT FALSE,
    screening_date DATE NOT NULL
);
```

#### Domain 10: IDSP Epidemiological Disease Surveillance (5 Tables)

```sql
-- 52. syndromic_reports: Early warning syndromic signals from field & OPD
CREATE TABLE syndromic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syndrome_type VARCHAR(100) NOT NULL CHECK (syndrome_type IN (
        'ACUTE_FEBRILE_ILLNESS', 'ACUTE_DIARRHEAL_DISEASE', 'ACUTE_RESPIRATORY_INFECTION',
        'FEVER_WITH_RASH', 'JAUNDICE_CLUSTER', 'UNUSUAL_MORTALITY_EVENT'
    )),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    case_count INTEGER DEFAULT 1 NOT NULL,
    location GEOMETRY(Point, 4326),
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 53. disease_outbreaks: Confirmed epidemic clusters declared by DHO/IDSP
CREATE TABLE disease_outbreaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbreak_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'OUTBREAK-2026-PUNE-DENGUE-01'
    disease_name VARCHAR(255) NOT NULL,
    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    taluka VARCHAR(100) NOT NULL,
    affected_radius_meters INTEGER NOT NULL DEFAULT 1000,
    epicenter_location GEOMETRY(Point, 4326) NOT NULL,
    total_confirmed_cases INTEGER DEFAULT 0 NOT NULL,
    total_fatalities INTEGER DEFAULT 0 NOT NULL,
    alert_level VARCHAR(50) DEFAULT 'YELLOW' CHECK (alert_level IN ('GREEN_NORMAL', 'YELLOW_WATCH', 'ORANGE_ALERT', 'RED_EMERGENCY')),
    declared_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at TIMESTAMPTZ
);

-- 54. outbreak_cases: Mapping individual encounters to outbreak events
CREATE TABLE outbreak_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbreak_id UUID NOT NULL REFERENCES disease_outbreaks(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    confirmation_method VARCHAR(100), -- 'RT-PCR', 'ELISA', 'CLINICAL_CRITERIA'
    is_fatal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 55. lab_pathogen_alerts: Positive sentinel alerts triggered by laboratory machines
CREATE TABLE lab_pathogen_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    pathogen_identified VARCHAR(255) NOT NULL, -- 'Vibrio cholerae', 'Dengue NS1 Antigen', 'Mycobacterium tuberculosis'
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 56. vector_surveillance: Mosquito larval density (Breteau index, Container index)
CREATE TABLE vector_surveillance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
    village_town VARCHAR(100) NOT NULL,
    survey_date DATE NOT NULL,
    containers_inspected INTEGER NOT NULL,
    containers_positive INTEGER NOT NULL,
    breteau_index NUMERIC(5, 2) NOT NULL,
    larvicidal_action_taken BOOLEAN DEFAULT TRUE
);
```

#### Domain 11: Security, Audit, DPDP Act & Data Protection (6 Tables)

```sql
-- 57. audit_logs: Cryptographically chained immutable audit records (Partitioned)
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    action VARCHAR(100) NOT NULL, -- 'PATIENT_RECORD_VIEW', 'PRESCRIPTION_CREATE', 'BREAK_GLASS_ACCESS'
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    access_purpose VARCHAR(100) NOT NULL, -- 'TREATMENT', 'EMERGENCY', 'EPIDEMIOLOGY_AUDIT'
    previous_hash VARCHAR(64) NOT NULL, -- Chained SHA-256 HMAC
    current_hash VARCHAR(64) NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Monthly partition examples:
CREATE TABLE audit_logs_2026_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- 58. consent_artifacts: DPDP Act 2023 / ABDM Electronic Consent Artifacts
CREATE TABLE consent_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id VARCHAR(100) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    consent_manager_id VARCHAR(100) NOT NULL,
    purpose_code VARCHAR(50) NOT NULL,
    date_range_from TIMESTAMPTZ NOT NULL,
    date_range_to TIMESTAMPTZ NOT NULL,
    health_info_types TEXT[] NOT NULL, -- ['Prescription', 'DiagnosticReport', 'DischargeSummary']
    status VARCHAR(50) DEFAULT 'GRANTED' CHECK (status IN ('REQUESTED', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED')),
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    signature_payload TEXT NOT NULL
);

-- 59. dpdp_grievances: Citizen privacy complaints under DPDP Act 2023
CREATE TABLE dpdp_grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    grievance_type VARCHAR(100) CHECK (grievance_type IN ('DATA_CORRECTION', 'DATA_ERASURE', 'UNAUTHORIZED_ACCESS', 'CONSENT_WITHDRAWAL_FAILURE')),
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'REJECTED')),
    assigned_dpo_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Data Protection Officer
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 60. system_configs: Dynamic government policy & feature flags
CREATE TABLE system_configs (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

### 3. Performance Tuning, Indexing & Connection Pooling

1. **Spatial Indexes:**
   * `CREATE INDEX idx_facilities_location ON facilities USING GIST(location);`
   * `CREATE INDEX idx_outbreaks_epicenter ON disease_outbreaks USING GIST(epicenter_location);`

2. **Composite Indexes for High-Velocity Queries:**
   * `CREATE INDEX idx_queue_tokens_facility_status ON queue_tokens(facility_id, status, priority);`
   * `CREATE INDEX idx_encounters_patient_started ON encounters(patient_id, started_at DESC);`
   * `CREATE INDEX idx_prescriptions_encounter ON prescriptions(encounter_id);`
   * `CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id, status);`

3. **Connection Pooling Architecture:**
   * **PgBouncer** in `transaction` pooling mode.
   * Max database connections: 500 (backing up to 10,000 application-level client connections).
   * Connection pool size per Node instance: `15–20`.
