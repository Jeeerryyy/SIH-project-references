# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 05. ABDM & FHIR R4 Interoperability Master Specification

**Document Reference:** `MCCPHP-DOC-05-ABDM`  
**National Standard:** Ayushman Bharat Digital Mission (ABDM) v3 APIs, NRCeS India FHIR R4 Profiles  
**Milestone Coverage:** M1 (ABHA Creation & Verification), M2 (HIP Data Provider), M3 (HIU Data Consumer)  
**Terminology Standards:** SNOMED CT (Clinical Findings & Procedures), LOINC (Laboratory & Diagnostic), ICD-10 (Diseases)

---

### 1. ABDM Milestone Architecture Overview

MCCPHP integrates directly with the National Health Authority (NHA) Gateway as both a **Health Information Provider (HIP)** and **Health Information User (HIU)**:

```
                            ┌────────────────────────────────────────┐
                            │          NHA ABDM GATEWAY v3           │
                            └───────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       [ ABDM Milestone 1: M1 ]                                      [ ABDM Milestone 2 & 3: M2 / M3 ]
   - ABHA Creation (Aadhaar/Mobile)                              - Health Information Provider (HIP)
   - ABHA Verification & Demographics                            - Care Context Linking (OPD/IPD)
   - Scan & Share Token Generation                               - Health Information User (HIU)
   - HFR / HPR Registry Linking                                  - Consent Artifacts & FHIR R4 Bundles
```

---

### 2. Milestone 1 (M1): ABHA Creation, Verification & Token Sharing

#### A. Flow 1: Aadhaar OTP-Based ABHA Creation
```
[ Citizen Portal / Kiosk ]          [ MCCPHP Backend ]               [ ABDM NHA Gateway ]
          │                                 │                                 │
          ├──── Enter Aadhaar Number ──────►├──── POST /v3/aadhaar/otp ──────►│
          │                                 │                                 ├──── SMS OTP to Aadhaar Mobile
          │◄─── TxnId & OTP Prompt ─────────┼◄─── 200 OK (txnId) ─────────────┤
          │                                 │                                 │
          ├──── Enter 6-digit OTP ─────────►├──── POST /v3/aadhaar/verify ───►│
          │                                 │                                 ├──── Verify biometric/OTP
          │                                 │◄─── KYC Profile + ABHA No ──────┤
          │◄─── Display Digital ABHA Card ──┼──── Link UHID with ABHA ────────┤
```

#### B. Flow 2: OPD "Scan & Share" QR Code Token Generation
1. Facility entrance displays dedicated NHA/MCCPHP Counter QR code.
2. Citizen scans QR code via any ABDM PHR app (e.g. ABHA App, Aarogya Setu, Paytm, Eka Care).
3. Citizen shares profile token with the facility counter.
4. MCCPHP Queue System receives the token via webhook, auto-populates the registration screen, and issues an OPD Token (`OPD-MED-042`) in **< 10 seconds**, eliminating physical paperwork.

---

### 3. Milestone 2 (M2): Health Information Provider (HIP)

MCCPHP serves as an authorized HIP for all government and empanelled facilities in Maharashtra:

1. **Care Context Discovery:** When a patient visits a PHC/DH, an automated care context is created:
   * Format: `CareContextId: "ENCOUNTER-<UUID>"`, `Display: "OPD Visit - Dr. Patil (General Medicine) - 08 Sep 2026"`
2. **Care Context Linking:** Link notification sent to NHA Gateway via `POST /v3/links/link/on-add-contexts`.
3. **Data Transfer on Consent:**
   * When another hospital requests records via an approved Consent Artifact, MCCPHP extracts the clinical encounter.
   * Generates a standard **NRCeS FHIR R4 Bundle**.
   * Encrypts the payload using **Diffie-Hellman Key Exchange (ECDH)** with `AES-256-GCM` and transmits directly to the requesting HIU.

---

### 4. Milestone 3 (M3): Health Information User (HIU)

When a patient is referred to a District Hospital or specialist:

1. **Consent Request Initiation:** Doctor clicks `[REQUEST HISTORICAL ABDM RECORDS]` in Clinical Portal.
2. **Patient Authorization:** Push notification sent to patient's ABHA PHR app. Patient approves specific date range and document types (e.g., last 12 months' Prescriptions and Lab Reports).
3. **Encrypted Ingestion:** MCCPHP HIU service receives the encrypted data stream, computes shared secret via session public keys, decrypts the FHIR R4 bundles, and renders a consolidated **Longitudinal Health Timeline** inside the doctor's EMR interface.

---

### 5. FHIR R4 Bundle Master Mapping Specifications

Every clinical record in MCCPHP maps to an NRCeS-compliant FHIR R4 JSON Bundle. Below are the structural specifications for core record types:

#### A. OPD e-Prescription (`Bundle: type = document`)
```json
{
  "resourceType": "Bundle",
  "id": "rx-bundle-7e4a1b2c",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2026-09-08T04:15:00Z",
    "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/PrescriptionRecord"]
  },
  "type": "document",
  "entry": [
    {
      "fullUrl": "Composition/rx-comp-01",
      "resource": {
        "resourceType": "Composition",
        "id": "rx-comp-01",
        "status": "final",
        "type": {
          "coding": [{
            "system": "http://snomed.info/sct",
            "code": "440545006",
            "display": "Prescription record"
          }]
        },
        "subject": { "reference": "Patient/uhid-mh-2026-004291", "display": "Ramesh Pawar" },
        "date": "2026-09-08T04:15:00Z",
        "author": [{ "reference": "Practitioner/hpr-91-8472-1092", "display": "Dr. Ananya Deshmukh" }],
        "title": "Prescription Record"
      }
    },
    {
      "fullUrl": "MedicationRequest/med-req-01",
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "med-req-01",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [{
            "system": "http://snomed.info/sct",
            "code": "387517004",
            "display": "Paracetamol 500mg tablet"
          }]
        },
        "subject": { "reference": "Patient/uhid-mh-2026-004291" },
        "dosageInstruction": [{
          "text": "1 tablet twice daily after food for 5 days",
          "timing": { "repeat": { "frequency": 2, "period": 1, "periodUnit": "d" } }
        }]
      }
    }
  ]
}
```

#### B. Diagnostic Laboratory Report (`Bundle: type = document`)
* **Composition Code:** SNOMED `721981007` (Diagnostic Report Record).
* **Observation Profile:** Uses LOINC coding:
  * `718-7` — Hemoglobin [Mass/volume] in Blood
  * `4544-3` — Hematocrit [Volume Fraction] of Blood
  * `6690-2` — Leukocytes [#/volume] in Blood
  * `777-3` — Platelets [#/volume] in Blood

---

### 6. NRCeS Terminology & Coding Validation Standards

| Domain | Coding System | Standard URI / Namespace | Example Code |
|---|---|---|---|
| **Disease Diagnoses** | ICD-10 / SNOMED CT | `http://hl7.org/fhir/sid/icd-10` / `http://snomed.info/sct` | `A09` (Gastroenteritis), `38362002` (Dengue) |
| **Medicines & Drugs** | SNOMED CT & NLEM | `http://snomed.info/sct` | `387517004` (Paracetamol 500mg) |
| **Lab Tests** | LOINC | `http://loinc.org` | `718-7` (Hemoglobin) |
| **Vital Signs** | LOINC / SNOMED CT | `http://loinc.org` | `8480-6` (Systolic BP), `8462-4` (Diastolic BP) |
| **Vaccines / Immunization** | SNOMED CT / UIP | `http://snomed.info/sct` | `866244005` (BCG vaccine) |
| **Facility Identification** | HFR / NIN | `https://facility.abdm.gov.in` | `IN271000104` (Aundh District Hospital Pune) |
| **Practitioner Identification**| HPR | `https://hpr.abdm.gov.in` | `91-8472-1092-4410` (HPR ID) |
