# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 04. Security, 6D RBAC & Legal Compliance Specification

**Document Reference:** `MCCPHP-DOC-04-SEC`  
**Regulatory Standards:** DPDP Act 2023, DISHA, ABDM Security Architecture, STQC Guidelines, ISO 27001:2022  
**Threat Model:** Zero-Trust Perimeter, Role & Context-Based Multi-Dimensional Access Control  
**Audit Integrity:** Cryptographic Tamper-Evident SHA-256 HMAC Chaining with WORM Storage

---

### 1. The 6-Dimensional (6D) Authorization Matrix

Traditional RBAC (e.g. `role: 'DOCTOR'`) is completely inadequate for state-scale healthcare where doctor privileges depend on location, active shifts, patient consent, and clinical justification. MCCPHP implements **6D Contextual Authorization**:

```
                  ┌─────────────────────────────────────────┐
                  │          6D AUTHORIZATION ENGINE        │
                  └────────────────────┬────────────────────┘
                                       │
        ┌──────────────┬───────────────┼───────────────┬──────────────┐
        ▼              ▼               ▼               ▼              ▼
   1. WHO         2. WHERE        3. WHAT         4. WHOSE       5. WHEN & 6. WHY
 (Actor & HPR)  (Facility/Ward) (Action/Perm)   (Patient/Rec)   (Shift & Purpose)
```

| Dimension | Attribute Name | Enforcement Mechanism & Source |
|---|---|---|
| **1. WHO** | `actor_id`, `role_code`, `hpr_id` | Verified from signed JWT claims and active user status in database |
| **2. WHERE** | `facility_id`, `department_id`, `ward_id` | Validated against `user_facility_assignments` and active duty assignment |
| **3. WHAT** | `permission_code` (e.g. `emr:write`, `rx:dispense`) | Mapped via `role_permissions` join table and scope guard middleware |
| **4. WHOSE** | `patient_id`, `consent_artifact_id` | Validated against active OPD token / admitted IPD bed / valid ABDM consent |
| **5. WHEN** | `shift_validity`, `time_window` | Checked against `facility_rosters` (e.g., cannot edit EMR off-shift without supervisor override) |
| **6. WHY** | `access_purpose` (`TREATMENT`, `EMERGENCY`, `AUDIT`) | Injected via `X-Access-Purpose` header; audited with forensic accountability |

---

### 2. Emergency "Break-Glass" Access Protocol

When an unconscious trauma patient or acute emergency arrives without prior consent or outside normal assignment boundaries:

1. **Trigger Condition:** Clinician clicks `[BREAK-GLASS: EMERGENCY ACCESS]` button on clinical portal.
2. **Mandatory Input:** Clinician must select clinical rationale (e.g., `UNCONSCIOUS_TRAUMA`, `ACUTE_ANAPHYLAXIS`, `CARDIAC_ARREST`) and type a mandatory 50+ character clinical summary.
3. **Instant Action:**
   * Full historical longitudinal records, allergies, and blood group are immediately unlocked for **2 hours**.
   * High-priority forensic audit log generated with `action: 'BREAK_GLASS_ACCESS'`.
   * Automated SMS/WhatsApp alert sent instantly to the Facility Medical Superintendent (MS) and District Health Officer (DHO).
   * Post-emergency review queue item created for institutional Clinical Audit Committee.

---

### 3. DPDP Act 2023 (Digital Personal Data Protection) Compliance Framework

MCCPHP operates as a **Significant Data Fiduciary (SDF)** under India's DPDP Act 2023:

```
                                 [ CITIZEN / DATA PRINCIPAL ]
                                               │
                         ┌─────────────────────┴─────────────────────┐
                         ▼                                           ▼
             [ Multilingual Consent Notice ]            [ Data Principal Rights Engine ]
             (22 Languages including Marathi)            - Right to Access & Summary
                         │                               - Right to Correction / Update
                         ▼                               - Right to Erasure (Nominal data)
              [ Consent Manager (ABDM) ]                 - Right to Nominate Heir
                         │                               - Grievance Redressal (30-day SLA)
                         ▼                                           │
             [ Purpose Limitation Guard ] ◄──────────────────────────┘
             (Access limited to TREATMENT)
```

1. **Consent Notice Requirements (Section 5):**
   * Itemized notice presented in **Marathi (मराठी)**, Hindi, and English before data processing.
   * Clear specification of what health data is collected, for what purpose, and how to withdraw consent.

2. **Data Principal Rights & Automation:**
   * **Right to Access Summary (Section 11):** Citizen can download their full health dossier via Citizen Portal in standardized PDF / JSON format.
   * **Right to Correction & Erasure (Section 12):** Self-service demographic update requests with ASHA/PHC verification workflows.
   * **Right of Grievance Redressal (Section 13):** Built-in Data Protection Officer (DPO) ticketing system with an enforceable **7-day resolution target** (well inside the statutory limit).

3. **Data Breach Incident Response Protocol (Section 8(6)):**
   * Any detected PII exposure triggers an automated P1 incident runbook.
   * Mandatory notification sent to the **Data Protection Board of India (DPBI)** and affected citizens within **72 hours** of confirmation.

---

### 4. Cryptographic Tamper-Evident Audit Chaining

All clinical, identity, and administrative actions are saved to an append-only log using **SHA-256 HMAC Chained Hashing**:

```
[ Log Entry N - 1 ]               [ Log Entry N ]                    [ Log Entry N + 1 ]
┌─────────────────────────┐       ┌─────────────────────────┐        ┌─────────────────────────┐
│ Actor: Dr. Patil        │       │ Actor: Dr. Kulkarni     │        │ Actor: Nurse Deshmukh   │
│ Action: EMR_VIEW        │       │ Action: RX_SIGN         │        │ Action: MED_DISPENSE    │
│ PrevHash: 0x9a8f...     │       │ PrevHash: 0x3b1c... ────┼───────►│ PrevHash: 0x7e4a...     │
│ Hash: 0x3b1c... ────────┼──────►│ Hash: 0x7e4a...         │        │ Hash: 0xf12d...         │
└─────────────────────────┘       └─────────────────────────┘        └─────────────────────────┘
```

1. **Hash Calculation Algorithm:**
   $$\text{CurrentHash} = \text{HMAC-SHA256}\Big(\text{PreviousHash} + \text{ActorID} + \text{Action} + \text{ResourceID} + \text{Timestamp} + \text{Purpose}, \text{MasterVaultKey}\Big)$$
2. **WORM Storage:** Logs are batched and streamed every 60 minutes to Write-Once-Read-Many (WORM) immutable S3 / MinIO object storage with Object Lock enabled for **10 years** compliance.

---

### 5. Column-Level Encryption for Sensitive Health Information (SHI)

To prevent database administrator snooping or data leak during SQL dumps:

| Field Name | Storage Method | Encryption Standard | Key Management |
|---|---|---|---|
| `users.password_hash` | Irreversible Salted Hash | Argon2id (Memory 64MB, Iterations 3) | N/A |
| `users.abha_number` | Reversible Column Encryption | AES-256-GCM (Random IV per record) | HashiCorp Vault Transit Engine |
| `patient_identities.encrypted_value` | Encrypted JSON Blob | AES-256-GCM | KMS Key (Rotated annually) |
| `soap_notes.subjective_complaints` | Encrypted Text | AES-256-GCM | Envelope encryption with facility key |
| `prescriptions.rx_items` | Database Column Encryption | AES-256-GCM | Platform Master Key |

---

### 6. STQC Security Audit & Vulnerability Mitigation Matrix

| Vulnerability Category | Risk Level | MCCPHP Production Mitigation |
|---|---|---|
| **SQL Injection (SQLi)** | Critical | 100% Parameterized queries via Prisma ORM + Strict Zod validation schemas. Zero string interpolation. |
| **Broken Object Level Auth (BOLA)** | Critical | 6D Scope Guard middleware verifies that `patient_id` or `encounter_id` belongs to the requesting actor's active facility/consent. |
| **Cross-Site Scripting (XSS)** | High | DOMPurify on all rich text inputs + Strict Content Security Policy (CSP) headers: `default-src 'self'; script-src 'self'`. |
| **Broken Authentication** | High | Short-lived JWT (15 mins) + Rotating Refresh Tokens stored in `HttpOnly`, `Secure`, `SameSite=Strict` cookies. |
| **DDoS / Brute Force** | High | Redis-backed Token Bucket rate limiting (100 req/min per IP, 5 req/min on OTP endpoints) + Cloudflare Enterprise WAF. |
| **Sensitive Data Exposure** | High | TLS 1.3 only, HSTS (`max-age=31536000; includeSubDomains; preload`), PII masking on logs (Aadhaar shows only `XXXX-XXXX-1234`). |
