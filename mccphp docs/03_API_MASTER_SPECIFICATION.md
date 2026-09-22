# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 03. API Master Specification & Route Directory

**Document Reference:** `MCCPHP-DOC-03-API`  
**Protocol:** RESTful JSON over HTTPS (TLS 1.3), WebSocket (WSS), FHIR R4 Bundle Endpoints  
**Total Route Modules:** 40 Core Functional Controllers  
**Total Endpoints:** 250+ Production API Endpoints  
**Global Response Envelope:** Standardized `{ success: boolean, data: T, error?: { code, message, details }, meta?: { page, limit, total } }`

---

### 1. Global API Conventions & Standards

1. **Authentication Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
2. **Context Headers (6D Scope Injection):**
   * `X-Facility-ID: <UUID>` — Active facility context
   * `X-Department-ID: <UUID>` — Active clinical department context
   * `X-Access-Purpose: TREATMENT | EMERGENCY | AUDIT` — DPDP clinical reason
   * `X-Language: mr | hi | en` — Preferred response localization
3. **HTTP Status Code Baseline:**
   * `200 OK` / `201 Created` / `204 No Content`
   * `400 Bad Request` (Zod validation error array)
   * `401 Unauthorized` (Token expired or missing)
   * `403 Forbidden` (6D RBAC constraint violated)
   * `404 Not Found`
   * `409 Conflict` (Duplicate record / concurrency clash)
   * `422 Unprocessable Entity` (Clinical rule check failed)
   * `429 Too Many Requests` (Rate limit throttled)
   * `500 Internal Server Error` (Masked error with Sentry tracking ID)

---

### 2. Complete Master API Endpoint Directory

#### Group A: Authentication, Identity & RBAC (Routes 1–4)

```
[POST] /api/v1/auth/otp/send
  Summary: Send SMS/WhatsApp OTP for mobile login
  Body: { mobile: string, channel: 'SMS' | 'WHATSAPP' }
  Response: { success: true, data: { txnId: string, expiresInSeconds: 120 } }

[POST] /api/v1/auth/otp/verify
  Summary: Verify OTP and issue JWT access & refresh tokens
  Body: { mobile: string, txnId: string, otp: string }
  Response: { success: true, data: { accessToken: string, refreshToken: string, user: UserProfile } }

[POST] /api/v1/auth/password/login
  Summary: Staff login with username/password + 2FA
  Body: { mobileOrEmail: string, password: string, totpCode?: string }
  Response: { success: true, data: { accessToken: string, refreshToken: string, user: UserProfile } }

[POST] /api/v1/auth/refresh
  Summary: Rotate refresh token and issue new access token
  Body: { refreshToken: string }

[POST] /api/v1/auth/logout
  Summary: Invalidate session and revoke refresh token

[GET]  /api/v1/auth/me
  Summary: Get authenticated user profile, active facility assignments & permissions

[PUT]  /api/v1/auth/context/switch
  Summary: Switch active working facility/department context
  Body: { facilityId: string, departmentId?: string }
```

#### Group B: Patient Master Index (MPI) & Registrations (Routes 5–8)

```
[POST] /api/v1/patients/register
  Summary: Register new universal patient (Generates UHID)
  Scope: 'patient:register'
  Body: { firstName, middleName, lastName, dob, gender, mobile, district, taluka, village, address, abhaAddress? }
  Response: 201 Created { patient: PatientRecord, uhid: string }

[GET]  /api/v1/patients/search
  Summary: High-speed fuzzy search across UHID, Mobile, Name, ABHA
  Query: ?q=pawar&district=Pune&dob=1985-05-12&page=1&limit=20
  Engine: Meilisearch soundex matching

[GET]  /api/v1/patients/:id
  Summary: Get full longitudinal patient profile with identities, allergies, and chronic flags

[PUT]  /api/v1/patients/:id
  Summary: Update patient demographic info

[GET]  /api/v1/patients/:id/vitals/history
  Summary: Time-series vitals telemetry (BP, Sugar, Pulse, SpO2)
  Query: ?fromDate=2026-01-01&toDate=2026-09-01

[POST] /api/v1/patients/:id/vitals
  Summary: Record new vitals observation
  Body: { systolicBp, diastolicBp, heartRate, temperature, spo2, bloodGlucose, weightKg, heightCm }

[GET]  /api/v1/patients/:id/allergies
[POST] /api/v1/patients/:id/allergies
```

#### Group C: Facilities, Beds & Capacity (Routes 9–12)

```
[GET]  /api/v1/facilities
  Summary: Discover health facilities with hierarchical filtering & geospatial radius
  Query: ?division=Pune&district=Satara&facilityType=PRIMARY_HEALTH_CENTRE&lat=18.5204&lng=73.8567&radiusKm=25

[GET]  /api/v1/facilities/:id
  Summary: Complete facility metadata, sanctioned beds, operational status, contact

[GET]  /api/v1/facilities/:id/departments
[GET]  /api/v1/facilities/:id/wards
[GET]  /api/v1/facilities/:id/beds/live
  Summary: Live real-time bed census (Total, Occupied, Oxygen, ICU, Cleaning)

[PUT]  /api/v1/facilities/:id/beds/:bedId/status
  Summary: Update single bed status (AVAILABLE, OCCUPIED, CLEANING)

[GET]  /api/v1/facilities/:id/roster/today
  Summary: Active on-duty doctors and nurses for current shift
```

#### Group D: Appointments, OPD Queue & Triage (Routes 13–16)

```
[GET]  /api/v1/appointments/slots
  Summary: Get available doctor/department appointment slots
  Query: ?facilityId=UUID&departmentId=UUID&date=2026-09-10

[POST] /api/v1/appointments/book
  Summary: Book citizen physical OPD or teleconsultation appointment
  Body: { patientId, facilityId, departmentId, doctorId?, slotId, appointmentType, chiefComplaint }

[GET]  /api/v1/appointments/my
  Summary: Get citizen's upcoming & historical appointments

[POST] /api/v1/queue/tokens/issue
  Summary: Issue OPD token at registration counter or kiosk
  Body: { patientId, facilityId, departmentId, priority: 'NORMAL' | 'PREGNANT_SENIOR' | 'EMERGENCY' }
  Response: { tokenNumber: 'OPD-MED-042', estimatedWaitMinutes: 25, currentServing: 'OPD-MED-035' }

[GET]  /api/v1/queue/live
  Summary: Live OPD queue board state for facility/department (Broadcast to display boards)
  Query: ?facilityId=UUID&departmentId=UUID

[POST] /api/v1/queue/tokens/:tokenId/call
  Summary: Doctor calls next patient token to consulting room
  Body: { counterId: UUID }

[POST] /api/v1/queue/tokens/:tokenId/triage
  Summary: Nurse records triage assessment
  Body: { triageCategory: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE', gcs: number, painScore: number, notes: string }

[POST] /api/v1/queue/tokens/:tokenId/complete
  Summary: Mark token consultation complete and route to Pharmacy / Lab queue
```

#### Group E: Clinical EMR, Encounters & Care Plans (Routes 17–21)

```
[POST] /api/v1/encounters/start
  Summary: Start clinical visit encounter (OPD/IPD/Emergency)
  Body: { patientId, facilityId, departmentId, encounterClass: 'OPD' }
  Response: { encounterId: UUID, encounterNumber: string }

[GET]  /api/v1/encounters/:id
  Summary: Full encounter details with SOAP notes, diagnoses, prescriptions, lab orders

[POST] /api/v1/encounters/:id/soap
  Summary: Save or update structured SOAP note
  Body: { subjectiveComplaints, hpi, objectiveFindings, assessmentSummary, planNotes }

[POST] /api/v1/encounters/:id/diagnoses
  Summary: Add ICD-10 / SNOMED coded diagnoses
  Body: { diagnoses: [{ icd10Code, icd10Display, snomedConceptId?, diagnosisType: 'FINAL', isNotifiable: boolean }] }

[POST] /api/v1/encounters/:id/sign
  Summary: Doctor signs encounter with digital certificate / eSign
  Body: { eSignPin?: string, certificateThumbprint?: string }

[POST] /api/v1/encounters/:id/referrals
  Summary: Create inter-facility tiered referral (PHC -> DH)
  Body: { targetFacilityId, targetSpecialty, reasonForReferral, clinicalSummary, arrangeTransport: boolean }

[POST] /api/v1/encounters/:id/discharge
  Summary: Generate and sign inpatient discharge summary
```

#### Group F: e-Prescriptions & Pharmacy Dispensation (Routes 22–25)

```
[GET]  /api/v1/pharmacy/drugs/catalogue
  Summary: Search Maharashtra Essential Drug List (EDL)
  Query: ?q=paracetamol&schedule=H&dosageForm=TABLET

[POST] /api/v1/prescriptions
  Summary: Generate new electronic prescription
  Body: {
    encounterId: UUID,
    items: [{ drugId: UUID, dosageInstructions: '1-0-1', frequency: 'TWICE_A_DAY', durationDays: 5, totalQuantity: 10, foodRelation: 'AFTER_FOOD' }]
  }

[GET]  /api/v1/prescriptions/:id
  Summary: Get prescription details + downloadable PDF URL

[GET]  /api/v1/pharmacy/inventory/stock
  Summary: Live stock on hand for pharmacy inventory
  Query: ?facilityId=UUID&lowStockOnly=true

[POST] /api/v1/pharmacy/dispense
  Summary: Pharmacist dispenses items and decrements batch inventory
  Body: { prescriptionId: UUID, items: [{ rxItemId: UUID, inventoryId: UUID, quantityDispensed: number }] }

[POST] /api/v1/pharmacy/transfers
  Summary: Request or approve inter-facility medicine stock transfer
```

#### Group G: Diagnostic & Laboratory (LIS) (Routes 26–29)

```
[GET]  /api/v1/labs/catalogue
  Summary: Search diagnostic tests and reference ranges

[POST] /api/v1/labs/orders
  Summary: Place lab diagnostic order for encounter
  Body: { encounterId, patientId, testIds: UUID[], priority: 'STAT' | 'ROUTINE' }

[POST] /api/v1/labs/specimens/collect
  Summary: Record sample collection and assign barcode
  Body: { labOrderId: UUID, barcodeId: string, specimenCondition: 'SATISFACTORY' }

[POST] /api/v1/labs/results/enter
  Summary: Lab technician enters measured values
  Body: { labOrderId: UUID, numericValue?: number, textValue?: string, isAbnormal: boolean, isCritical: boolean }

[POST] /api/v1/labs/results/:id/verify
  Summary: Pathologist verifies and approves lab report

[GET]  /api/v1/labs/orders/:id/report.pdf
  Summary: Stream standardized lab report PDF with QR code verification
```

#### Group H: Telemedicine & Remote Consultation (Routes 30–33)

```
[POST] /api/v1/teleconsult/sessions/create
  Summary: Initialize remote consultation room
  Body: { encounterId, patientId, doctorId }
  Response: { sessionRoomName: string, livekitWsUrl: string }

[POST] /api/v1/teleconsult/sessions/:roomName/token
  Summary: Generate authenticated LiveKit RTC token for participant
  Body: { participantType: 'DOCTOR' | 'PATIENT' | 'CHO' }
  Response: { token: string }

[POST] /api/v1/teleconsult/waiting-room/join
  Summary: Patient joins virtual waiting room and runs device mic/camera check

[POST] /api/v1/teleconsult/sessions/:roomName/end
  Summary: End call session, record duration, and transition to prescription
```

#### Group I: ASHA, ANM & Offline Field Health (Routes 34–36)

```
[POST] /api/v1/field/households
  Summary: Register village household & family members

[GET]  /api/v1/field/households/my-village
  Summary: Download all assigned households for offline IndexedDB sync

[POST] /api/v1/field/sync/batch
  Summary: Ingest offline mutation batch from ASHA mobile PWA
  Body: {
    syncBatchId: UUID,
    clientTimestamp: ISO8601,
    mutations: [
      { entity: 'anc_visit', action: 'CREATE', data: { ... } },
      { entity: 'child_immunization', action: 'UPDATE', data: { ... } },
      { entity: 'ncd_screening', action: 'CREATE', data: { ... } }
    ]
  }
  Response: { successCount: number, conflictCount: number, serverResolutions: [] }

[POST] /api/v1/field/anc
[POST] /api/v1/field/pnc
[POST] /api/v1/field/immunizations
[POST] /api/v1/field/ncd
```

#### Group J: IDSP Disease Surveillance & War Room (Routes 37–38)

```
[GET]  /api/v1/surveillance/hotspots
  Summary: Get real-time geospatial disease outbreak clusters across Maharashtra
  Query: ?division=Pune&syndrome=ACUTE_FEBRILE_ILLNESS&timeframeDays=7

[POST] /api/v1/surveillance/syndromic-report
  Summary: Submit early warning syndromic signal from field or clinic

[POST] /api/v1/surveillance/outbreaks/declare
  Summary: DHO/State declares official epidemic outbreak
  Body: { diseaseName, district, taluka, epicenterLat, epicenterLng, affectedRadiusMeters, alertLevel }

[GET]  /api/v1/surveillance/shoc/kpis
  Summary: High-level State Health Operations Center (SHOC) telemetry
```

#### Group K: ABDM, Interoperability & DPDP (Routes 39–40)

```
[POST] /api/v1/abdm/v3/registration/aadhaar/generate-otp
[POST] /api/v1/abdm/v3/registration/aadhaar/verify-otp
[GET]  /api/v1/abdm/v3/profile/share
[POST] /api/v1/abdm/v3/consent/requests
[POST] /api/v1/abdm/v3/hip/notify
[GET]  /api/v1/fhir/r4/Bundle/:id
[POST] /api/v1/dpdp/grievances
```
