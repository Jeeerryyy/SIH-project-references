
## 1. System Overview

A multi-branch, multi-specialty HMS is a single platform coordinating **patients, clinical staff, administration, finance, and logistics** across every branch and every department (OPD, IPD, OT, ICU, Lab, Radiology, Pharmacy, Blood Bank, Emergency). Four principles hold the whole system together:

- **One patient, one EMR** — regardless of branch
- **One hospital group, many branches** — centrally governed, locally operated
- **One family, linked profiles** — patients manage their own and their household's records
- **One appointment engine, two delivery modes** — in-person and video consultation, same pipeline

2026 hospital software has moved to **microservices architecture, HL7 FHIR R4 as the integration baseline, cloud-native or hybrid deployment, and an AI intelligence layer sitting across clinical and operational data** — not just OPD/IPD automation. This blueprint builds for that bar directly.

---

## 2. Multi-Branch Architecture

**Model:** Single centralized system, multi-branch aware — one codebase, one database, one shared patient master.

### Core Principles
- Every operational record (appointment, admission, invoice, staff, stock) tagged `branch_id`
- **Global Patient ID** — recognized instantly at any branch, full history pulled up
- **Branch-scoped roles** — clinical/support staff see only their branch's queue, beds, stock
- **Super Admin** — full cross-branch visibility; **Branch Admin** — full control within one branch only

### Cross-Branch Capabilities
1. Unified patient search across the group
2. Cross-branch appointment booking (any doctor, any branch, from one interface)
3. Inter-branch referral with EMR summary carried forward
4. Inter-branch inventory/pharmacy stock transfer
5. Centralized billing rollup + per-branch P&L
6. Shared staff directory, multiple branch assignments, separate schedules per branch
7. Centralized master data (drug formulary, test catalog, price lists) with branch-level overrides
8. Branch comparison dashboard (occupancy, revenue, satisfaction, TAT) for Super Admin

### Data Architecture
- **Recommended:** single PostgreSQL instance, `branch_id` foreign key everywhere, row-level security or app-layer filtering
- **Only at large scale** (50+ branches, or independent-uptime requirements): separate DB per branch + a central hub DB for patient master and sync
- Start single-DB — it keeps "one patient, one record" trivially true

### Technical Requirements
- `branch_id` scoping middleware on every query, auto-filtered unless Super Admin
- Branch-switcher UI for Super Admin / multi-branch staff
- Branch-aware notification content ("Your appointment is confirmed at [Branch], [Address]")
- Branch selector as a first-class field in booking, staffing, and inventory flows

---

## 3. Patient & Family Account Management

Real systems use **two complementary patterns** for family/multi-person access — build both:

### Pattern A — Guardian-Managed Family Group (for dependents who can't manage their own account)
- **Primary Account Holder** self-registers (phone/email + OTP)
- **Linked Dependents** — spouse, children, parents — each gets a full independent patient ID/EMR, accessed through the primary's login
- Used for minors and dependent elderly who cannot hold their own login
- A dependent can later **"graduate"** to their own independent login, carrying their EMR history with them

### Pattern B — Reciprocal Shared Access (for capable adults choosing to share)
- An adult patient owns their account outright and **grants viewing access** to chosen family members/caregivers — the pattern real hospital portals (e.g., shared-access settings in Canadian/US hospital portals) use for spouses, adult children, or decision-makers, with no cap on how many viewers can be added
- Access is granted, scoped, and revocable by the patient themselves — this is *not* the same as guardian control

Use **Pattern A for minors/dependent elderly** by default, and **offer Pattern B for any independent adult** who wants to loop family in voluntarily.

### Features
- "Add Family Member" flow: name, DOB, relationship, gender, optional ID proof
- Profile switcher — move between family members' dashboards from one login (support at least 6–10 profiles per account, matching what consumer family-health apps ship)
- Consolidated family calendar, consolidated or split billing (configurable)
- Per-member record: vaccination history (children), chronic condition tracking (elderly), allergy list, past surgeries
- Shared emergency contacts across the family group
- Per-member notification routing
- Family medical history flagged to doctors during consultation (hereditary/genetic context)
- **ICU/IPD family engagement layer** (optional, high-value differentiator): a bedside tablet/portal view for admitted patients where family can see care-team info, log preferences the ward staff should know (routine, comfort items), and request to help with simple bedside activities — modelled on hospital "Patient & Family Portal" programs used in ICUs to keep relatives engaged when visiting hours are restricted

### Compliance Note (India)
Under the DPDP Act 2023 framework, a **clinical establishment may process a minor's health data without separate parental consent to the extent necessary for the protection of the minor's health** — the guardian-managed model above is the access/UX layer; it doesn't override this clinical-necessity carve-out for actually rendering care.

### Database Additions
```
Family_Groups        (group_id, primary_account_id)
Family_Members        (member_id, group_id, patient_id, relationship, is_guardian_managed)
Shared_Access_Grants  (grant_id, patient_id, granted_to_user_id, scope, granted_at, revoked_at)
```
`Patients` stays standalone per individual — family linkage is a join layer, so each member's EMR remains portable and independently valid.

---

## 4. Appointment Engine — In-Person & Video Consultation

One unified engine. Mode is chosen at booking time; EMR, billing, and notifications stay shared downstream.

### Booking Flow (Both Modes)
1. Select branch (in-person) or skip to "any available doctor" (video)
2. Select specialty → doctor → slot, tagged **In-Person**, **Video**, or **Either**
3. Select which family member profile the appointment is for
4. Confirm + pay → confirmation via SMS/WhatsApp/email

### In-Person Specific
- Token/queue tied to the branch's live display board
- Reception check-in on arrival advances the doctor's live queue
- Walk-ins slot into gaps in the pre-booked schedule automatically
- Self-check-in kiosk / QR-code check-in as an optional front-desk offload

### Video Consultation Specific
- Pre-consult intake form (symptoms, current medication, vitals)
- Virtual waiting room; video engine: Jitsi (self-hosted) or Agora/Twilio (paid, scale)
- In-call chat, file/report sharing, screen share; low-bandwidth audio-only fallback
- Optional recording, gated on explicit logged consent
- E-prescription auto-generated and pushed to the patient portal the moment the call ends
- No-show/missed-call handling → auto-reschedule or refund per policy
- Doctor can flag "in-person follow-up needed," auto-launching that booking flow

### India Telemedicine Compliance (Telemedicine Practice Guidelines, NMC 2020, as amended)
Build these directly into the video module — they are legal requirements, not nice-to-haves:
- Only a **Registered Medical Practitioner (RMP)** can conduct the consult; the doctor's registration number must be displayed and verifiable to the patient during the session
- Both parties must be identified at session start; patient age must be established
- **Teleconsultation for a minor is only permitted with an identified adult family member present on the call** — enforce this as a hard gate in the booking/join flow whenever the patient profile is a dependent under 18
- **Consent is implied when the patient initiates the booking**; if the *hospital/doctor* initiates the consult, explicit consent (recorded) is required before proceeding
- Certain drug schedules cannot be prescribed via teleconsultation alone — the e-prescription module must enforce this restriction list at the point of prescribing from a video encounter, not leave it to the doctor's memory

### Doctor-Side Control
- Separate weekly availability grids for in-person vs. video slots, per branch if multi-branch
- One-tap block of upcoming video slots if pulled into OT/emergency
- Today's queue visually distinguishes 🏥 in-person from 📹 video

### Shared Backend Logic
- Single `Appointments` table: `mode` enum (`in_person`/`video`), `branch_id` (nullable for pure video, still records doctor's home branch)
- Both modes feed the same EMR, billing pipeline, and notification engine

---

## 5. AI & Intelligence Layer

This is now a baseline expectation of a "full" HMS in 2026, not an add-on — build it as a layer that reads from the same core data rather than a bolt-on tool.

- **Ambient clinical documentation** — doctor speaks naturally during consult; AI drafts structured notes/SOAP format for the doctor to review and approve, cutting after-hours charting
- **Predictive bed & census forecasting** — models admission trends, discharge timing, and seasonal patterns to forecast inpatient census and ED volume days ahead, so staffing and overflow protocols are proactive rather than reactive
- **AI-assisted OR scheduling** — models procedure-duration variability, surgeon patterns, sterilization turnaround, and downstream ICU capacity to reduce OT gaps and overtime
- **Clinical Decision Support (CDSS)** — drug interaction and dosage checking is table stakes; the modern layer adds risk-trajectory prediction from the patient's longitudinal record (e.g., early sepsis/deterioration flagging), with **context-aware alerting** so doctors aren't drowned in low-value pop-ups (a well-documented failure mode of older, rule-only CDSS)
- **Imaging second-read** — AI flags suspected anomalies in radiology images as a second layer of review feeding into the RIS/PACS worklist, prioritizing high-risk studies — augments the radiologist, doesn't replace sign-off
- **Supply chain/inventory forecasting** — predicts consumable and drug demand from historical consumption + seasonal patterns, feeding the reorder-level logic in Pharmacy/Inventory
- **Conversational AI / triage chatbot** — patient-portal chat for symptom intake, appointment mode suggestion (video vs. in-person), and FAQ handling before reaching a human
- **Remote Patient Monitoring (RPM) ingestion** — pipeline for connected devices/wearables (BP cuffs, glucometers, pulse oximeters) to feed vitals into the EMR between visits, for chronic-condition follow-up — a fast-growing category, particularly for post-discharge and elderly care
- **AI billing/coding assist** — flags coding errors and claim-denial risk before submission to insurers/NHCX

Build each of these as a service that **reads from the core EMR/operational database** rather than a silo — the value is in feeding real hospital data into the model, not running a chatbot next to the HMS.

---

## 6. Roles, Panels, Functions & Features

### 6.1 Super Admin
**Panel:** Platform/Group Admin
**Features:** branch creation & branch-admin assignment; cross-branch dashboards; RBAC matrix editor; central master data (formulary, test catalog, specialty list, base pricing) with branch-override capability; global settings (tax, hours, holidays); system-wide audit logs; license/subscription management; backup/restore & data export.

### 6.2 Branch Admin
**Panel:** Branch Operations Dashboard
**Features:** branch staff onboarding + roster; department/bed configuration; leave & attendance approval (branch-scoped); branch KPIs; branch-level price overrides within Super Admin bounds; notice board; branch-scoped complaint resolution.

### 6.3 Doctor Panel
**Panel:** Doctor/Consultant Dashboard
**Features:** today's queue (OPD + IPD + video, mode-tagged); full EMR access group-wide; e-prescription with drug-interaction/allergy warnings and telemedicine drug-schedule enforcement; lab/radiology/procedure ordering; separate in-person/video availability calendars; video join + in-call tools + post-call e-prescription; admission notes & AI-assisted discharge summary; OT booking request; inter-branch referral with EMR summary attached; digital signature; CDSS risk alerts on the patient timeline; revenue/consult self-dashboard.

### 6.4 Nurse / Ward Staff Panel
**Panel:** Nursing Station
**Features:** assigned patient list per ward/shift; vitals entry with trend charts and early-warning scoring; Medication Administration Record (MAR); nursing notes & care plan; bed transfer/discharge-readiness flagging; critical-vitals escalation to doctor; shift handover notes; ICU family-engagement portal access for admitted patients.

### 6.5 Receptionist / Front Desk Panel
**Panel:** OPD Registration & Front Desk
**Features:** new patient registration or instant group-wide recognition; family member registration under an existing account; appointment booking/rescheduling (in-person + video, any doctor, any branch); token/queue management with live display board; self-check-in kiosk support; IPD admission initiation; registration/advance billing; group-wide patient search; SMS/WhatsApp confirmations & reminders.

### 6.6 Patient Panel
**Panel:** Patient Portal / Mobile App
**Features:** book/cancel/reschedule (in-person or video); family profile switcher (Pattern A) and shared-access grants (Pattern B); per-member EMR access with downloadable PDFs; consolidated/split family billing and online payment; join video consult from the portal; ABHA linking; conversational AI chat for symptom intake/FAQ; feedback/rating; health & vaccination reminders; ambulance request button; RPM device data view.

### 6.7 Pharmacist Panel
**Panel:** Pharmacy Management
**Features:** incoming e-prescription queue; dispense with auto stock deduction; low-stock/near-expiry/expired-batch alerts; FEFO batch/lot tracking; drug-interaction/allergy warnings at dispense; inter-branch transfer requests; AI-forecasted reorder points; GST-compliant sales/returns billing; consumption reports.

### 6.8 Lab Technician Panel
**Panel:** Laboratory Information System (LIS)
**Features:** incoming orders with STAT flag, any branch/mode; sample collection with barcode tracking; result entry (manual or instrument interface); reference-range abnormal flagging; digitally signed PDF reports auto-pushed to doctor + patient; test catalog/pricing; TAT dashboard; linkage to blood bank transfusion-reaction investigation.

### 6.9 Radiology Panel
**Panel:** Radiology/Imaging (RIS + PACS)
**Features:** order queue (X-ray/CT/MRI/USG) with scheduling; PACS/DICOM storage-retrieval (Orthanc or equivalent); AI second-read flagging on the worklist; radiologist reporting templates; report approval & EMR push; equipment scheduling calendar.

### 6.10 Billing / Accounts / Cashier Panel
**Panel:** Finance & Billing
**Features:** consolidated invoicing across OPD/IPD/pharmacy/lab/OT; multi-mode payment (cash/card/UPI/insurance); IPD advance/deposit management; refund & discount approval workflow; GST-compliant invoicing; daily reconciliation/shift-close; branch-wise and group-wide revenue reports; per-patient or per-family outstanding-dues tracking; AI claim-denial risk flagging before submission.

### 6.11 Inventory / Store Manager Panel
**Panel:** Central Stores & Inventory
**Features:** consumables/surgical-item/linen stock in-out; supplier & PO management; reorder alerts (AI-forecasted); asset register cross-linked to the CMMS; inter-branch transfer requests; branch/department consumption analytics.

### 6.12 HR & Payroll Panel
**Panel:** Human Resources
**Features:** employee records with license/credential expiry tracking; multi-branch staff assignment; roster & attendance (Aadhaar-based biometric attendance where mandated — see §12); leave workflow; payroll processing; performance records; recruitment/onboarding checklist.

### 6.13 Insurance / TPA / Government Scheme Desk
**Panel:** Insurance & Cashless Desk
This desk now runs **two parallel claim pipelines** — private insurance and the government PM-JAY scheme — and both are increasingly API-driven rather than manual portals:

**Private insurance/TPA (via NHCX):**
- Coverage-eligibility check before treatment
- Pre-authorization and predetermination-of-benefit requests submitted digitally
- Standardized claim submission in NHCX format instead of insurer-specific portals
- Real-time claim-status tracking; cashless settlement is regulator-mandated within **3 hours of discharge authorization**, so the desk's workflow should be built to hit that clock, not just log it
- Insurer-wise outstanding-claims dashboard

**Government scheme (PM-JAY/Ayushman Bharat):**
- Beneficiary verification against the **Beneficiary Identification System (BIS)**
- Claim filing through the **Hospital Transaction Management System (TMS)** workflow: pre-authorization → treatment → claim submission → payment tracking
- Grievance logging aligned to the scheme's **Grievance Management System (GMS)**
- A dedicated **Ayushman Mitra** desk role for beneficiary assistance, matching how empanelled hospitals actually staff this function
- Document upload (policy/ID/medical-necessity forms) for both pipelines

### 6.14 OT (Operation Theatre) Manager Panel
**Panel:** OT Scheduling & Perioperative Management
**Features:**
- OT slot booking with surgeon/room/equipment resource allocation; block scheduling by surgeon or department; waitlist for unconfirmed cases; block-conflict warnings
- **WHO Surgical Safety Checklist enforcement** at Sign In, Time Out, and Sign Out — the system should not let the case progress without each checkpoint completed
- Pre-operative assessment documentation and consent capture
- Intra-operative surgical and anaesthesia documentation, syncable with anaesthesia workstation/patient monitor data where hardware integration exists
- **Implant tracking with device serial numbers** for full traceability
- Blood transfusion log during surgery, linked to the Blood Bank module
- **Post-operative recovery scoring (e.g., Aldrete score)** for PACU monitoring
- Coordination with the **Central Sterile Supplies Unit (CSSU)** for instrument turnaround
- "Big Board" live view of patient location/status across the OT complex
- OT utilization analytics and AI-assisted case-sequencing suggestions

### 6.15 Ambulance / Emergency Panel
**Panel:** Emergency & Ambulance Dispatch
**Features:** GPS fleet tracking with live map; **nearest-available-vehicle auto-assignment** on dispatch request; route optimization against live traffic; geo-fencing and driver-behavior monitoring; dispatch queue from patient app/call center; nearest-branch routing logic; emergency fast-track registration (bypasses normal queue); ETA push to the receiving branch so the team is ready on arrival; trip log & billing.

### 6.16 Blood Bank Panel
**Panel:** Blood Bank Management
Runs under some of the strictest regulatory requirements in the hospital — **Drugs and Cosmetics Act** rules for blood products, **NACO (National AIDS Control Organisation)** testing guidelines, and **CDSCO** licensing.
**Features:**
- Donor registration, medical-history screening, and donor deferral management
- Blood collection with **bag-number as the primary traceability identifier**
- Mandatory pre-issue testing for HIV, HBsAg, HCV, malaria, and syphilis on every unit
- **Component separation** tracking — whole blood, PCV, FFP, platelets, cryoprecipitate
- Cross-match and issue-to-patient workflow, linked to the OT and IPD modules
- Temperature-monitored storage tracking and expiry/wastage reporting
- Transfusion reaction recording, linked to the LIS for investigation and to incident reporting for quality management
- **Blood donation camp management**
- Inter-branch emergency requisition alerts
- Auto-generated **NACO-format compliance reports**

### 6.17 Housekeeping / Biomedical Maintenance (CMMS) Panel
**Panel:** Facility & Equipment Maintenance
**Features:**
- Room/ward cleaning task assignment and bed-turnover status feeding the Bed Management module
- **Asset registry** — every biomedical and facility asset in one register, QR/RFID-tagged, with condition scoring and full history
- **Preventive Maintenance (PM) scheduling** at calendar or usage intervals
- Full **work-order lifecycle**: creation → assignment → execution → e-signed sign-off, timestamped for audit
- **Calibration records** for measurement-critical devices (infusion pumps, monitors)
- Life-safety inspection tracking (fire doors, sprinkler valves) where applicable
- Vendor/AMC (annual maintenance contract) tracking
- **CapEx forecasting** — rolling multi-year replacement modelling from condition data instead of guesswork
- Breakdown ticketing with downtime tracking

### 6.18 Medical Superintendent / Department Head Panel
**Panel:** Clinical Governance Dashboard
**Features:** department-wise patient load, occupancy, and outcome stats (readmission rate, infection rate); doctor performance and patient-satisfaction metrics; clinical audit and NABH quality-indicator tracking; incident/adverse-event reporting; approval authority for high-value procedures/discounts; Patient-Reported Outcome Measures (PROM) tracking for accredited outcome reporting.

### 6.19 Call Center / Telemedicine Coordinator Panel
**Panel:** Patient Engagement Desk
**Features:** phone-booking logging across any branch/mode; post-discharge follow-up call scheduling; video consultation scheduling and link distribution; feedback collection calls; health-checkup-package and corporate-wellness outreach calls.

---

## 7. Full Module Index — The Complete System

Everything above, as one flat inventory. This is the full system — build order is an engineering decision you make, not something baked into the module list itself.

**Core Clinical**
1. Patient Registration & Master Index (multi-branch, family-linked) · 2. OPD Management · 3. IPD / Admission-Discharge-Transfer · 4. EMR/EHR Core · 5. e-Prescription & Drug Database · 6. Nursing Station / MAR · 7. Vitals & Early Warning Score · 8. Bed & Ward Management · 9. OT Scheduling & Perioperative Documentation · 10. Anaesthesia Records · 11. ICU/Critical Care Monitoring · 12. AI-Assisted Discharge Summary Generator · 13. Referral Management (internal & external) · 14. Multi-Specialty Case Review / Second Opinion Board

**Diagnostics**
15. Laboratory Information System (LIS) · 16. Radiology Information System (RIS) + PACS · 17. Pathology Reporting · 18. Point-of-Care Testing Integration

**Pharmacy & Supply Chain**
19. Pharmacy Dispensing · 20. Drug Inventory & Batch/Expiry (FEFO) · 21. Central Stores / Non-Pharmacy Inventory · 22. Purchase Order & Vendor Management · 23. Biomedical Equipment CMMS · 24. Asset Registry & QR/RFID Tracking

**Blood Bank**
25. Donor Registration & Screening · 26. Collection, Component Separation & NACO-Mandated Testing · 27. Cross-Match & Issue · 28. Blood Camp Management · 29. Transfusion Reaction Reporting

**Patient & Family Experience**
30. Patient Portal / Mobile App · 31. Family Account & Dependent Management (Pattern A) · 32. Shared-Access Record Grants (Pattern B) · 33. ICU/IPD Family Engagement Portal · 34. Appointment Booking Engine (in-person + video) · 35. Video Consultation Platform · 36. Feedback & NPS Surveys · 37. Health & Vaccination Reminders

**Billing, Insurance & Government Schemes**
38. Consolidated OPD/IPD/Pharmacy/Lab Billing · 39. GST-Compliant Invoicing · 40. Private Insurance/TPA Desk + NHCX Integration · 41. PM-JAY Desk (BIS/TMS/GMS, Ayushman Mitra workflow) · 42. Corporate Empanelment & Health-Checkup Packages · 43. Revenue Cycle Management & Denial Tracking

**Workforce**
44. HR & Staff Records · 45. Shift Roster & Attendance · 46. Payroll · 47. Credential/License Expiry Tracking

**Emergency & Logistics**
48. Emergency/Casualty Fast-Track Registration · 49. Ambulance Dispatch & GPS Tracking · 50. Housekeeping & Bed-Turnover Tracking

**Governance, Compliance & Intelligence**
51. Role-Based Access Control & Audit Trail · 52. ABDM Consent Manager (HIP/HIU, FHIR R4 bundling) · 53. NABH Quality Indicator & Incident Reporting · 54. Clinical Decision Support (interactions, dosage, risk alerts) · 55. AI Layer (ambient documentation, predictive census, imaging second-read, chatbot triage, RPM ingestion) · 56. Business Intelligence / MIS Dashboards (branch + group-wide) · 57. Notification Engine (SMS/WhatsApp/Email/Push) · 58. Document Management & Digital Consent Signing · 59. Inter-Branch Referral & Transfer Sync · 60. Multi-Branch Master Data & Price Governance

---

## 8. Database Entities (High-Level ER Overview)

```
Branches (branch_id, name, address, contact)
Users (staff, login, role_id, branch_assignments[])
Roles & Permissions
Patients (demographics, ABHA_id, emergency_contact)
Family_Groups / Family_Members / Shared_Access_Grants
Departments / Specialties (branch_id where relevant)
Doctors (linked to Users + Department + branch_assignments[])
Appointments (patient_id, doctor_id, branch_id, mode, slot, status)
Video_Sessions (appointment_id, join_link, recording_consent, recording_url)
Admissions/IPD (patient_id, bed_id, branch_id, admit_date, discharge_date)
Beds/Wards (ward_type, status, department_id, branch_id)
Prescriptions (visit_id, drug list, dosage, telemedicine_restricted_flag)
LabOrders / LabResults
RadiologyOrders / RadiologyReports
OTBookings (surgeon_id, room_id, branch_id, schedule, team)
OT_SafetyChecklist (booking_id, sign_in, time_out, sign_out, completed_by)
OT_Implants (booking_id, device_serial, manufacturer)
Pharmacy_Stock / Pharmacy_Sales (branch_id)
Inventory_Items / Purchase_Orders / Suppliers (branch_id)
CMMS_Assets (asset_id, branch_id, qr_tag, condition_score, calibration_due)
CMMS_WorkOrders (asset_id, type, status, assigned_to, signed_off_at)
Inter_Branch_Transfers (item_id, from_branch, to_branch, status)
Inter_Branch_Referrals (patient_id, from_doctor, to_doctor, from_branch, to_branch, emr_summary)
Billing_Invoices / Payments
Insurance_Claims (patient_id, insurer, nhcx_ref, status, submitted_at)
PMJAY_Claims (patient_id, bis_beneficiary_id, tms_claim_id, status)
BloodBank_Donors / BloodBank_Units (bag_number, component, test_results, expiry)
BloodBank_Camps
Ambulance_Trips (branch_id, gps_log, dispatch_time, arrival_time)
HR_Attendance / Payroll
ABDM_ConsentArtifacts (patient_id, purpose, scope, granted_at, expires_at, revoked_at)
Notifications_Log
Audit_Logs (retained per DPDP/CERT-In minimums — see §12)
```

Use a **relational DB** (PostgreSQL/MySQL) — HMS data is highly relational with strict transactional-integrity needs (billing, bed allocation, stock deduction, cross-branch transfers, blood-unit traceability). Avoid document DBs as the primary store.

---

## 9. Suggested Tech Stack

| Layer | Recommendation | Notes |
|---|---|---|
| Frontend | React (Next.js) + Tailwind + shadcn/ui | Panel-based routing, role- and branch-guarded pages |
| Backend | Node.js/Express **or** FastAPI (Python) | REST or tRPC; pick what your team ships fastest in |
| Database | PostgreSQL, single instance, `branch_id` scoped | Relational integrity for billing/beds/stock/transfers |
| ORM | Prisma (Node) / SQLAlchemy (Python) | |
| Auth | JWT via HttpOnly cookies + RBAC + branch-scope middleware | 2FA for Admin/Doctor roles |
| FHIR layer | HAPI FHIR server or equivalent FHIR R4 module | Required for ABDM HIP/HIU participation |
| Real-time | Socket.io | Live queue, bed status, OT Big Board, per-branch channels |
| File storage | Cloudinary / S3-compatible | Reports, scanned docs, DPDP-compliant encryption at rest |
| PDF generation | Puppeteer / react-pdf | Prescriptions, bills, discharge summaries |
| Payments | Razorpay | UPI/card/insurance settlement, family wallet support |
| WhatsApp/SMS | WATI / Gupshup / MSG91 | Appointment & report notifications |
| Video consult | Jitsi (self-hosted) or Agora/Twilio | Jitsi for cost control; Agora/Twilio for guaranteed reliability at scale |
| DICOM/PACS | Orthanc (open-source) | If building radiology imaging in-house |
| CMMS/IoT | RTLS/QR tagging + a lightweight asset service | Can start as a module inside the main app; graduate to IoT sensor ingestion later |
| AI layer | Hosted LLM API (for ambient documentation, chat triage) + a forecasting service (for census/inventory prediction) | Keep this layer reading from the core DB, not siloed |
| Hosting | AWS/DigitalOcean (VPS), horizontally scalable | Single DB, multiple app instances behind a load balancer |

---

## 10. Integrations Required

- Payment gateway (Razorpay/PayU) — family/multi-member billing support
- SMS & WhatsApp Business API
- Email service (SendGrid/SES)
- **ABDM APIs** — HFR (Health Facility Registry) and HPR (Healthcare Professionals Registry) registration, HIP/HIU record exchange, ABHA linking per family member
- **NHCX** — coverage eligibility, pre-auth, predetermination, standardized claim submission
- **PM-JAY** — BIS beneficiary lookup, TMS claim workflow, GMS grievance logging
- Lab machine interfaces (HL7/ASTM) for automated result import
- PACS/DICOM viewer (radiology)
- Video calling SDK (Jitsi/Agora/Twilio)
- GPS/mapping API for ambulance dispatch and route optimization
- **CERT-In incident reporting channel** — for the mandatory breach-reporting workflow (see §12)
- Government reporting APIs where applicable (disease surveillance, etc.)

---

## 11. Reference Landscape — Products & Open-Source Worth Studying

Since you're starting to code, these are worth actually opening, not just knowing by name:

- **Bahmni (built on OpenMRS)** — open-source, India-deployed hospital system with a genuinely usable OT scheduling module (calendar + list views, block scheduling, utilization metrics) you can read the real source of on GitHub. The single best reference for seeing how an OT/IPD module is actually implemented, not just described.
- **Epic, Oracle Health (formerly Cerner), MEDITECH Expanse, NextGen Healthcare** — the global enterprise tier; study their patient-portal and analytics UX even though their scale is far beyond a first build.
- **India HMIS/ERP vendors** (OneCity, MocDoc, Aarogya by Dataman, Sanjeevani ERP, and others) — most now market themselves explicitly by ABDM milestone (M1/M2/M3) and NABH-readiness; their marketing pages double as a checklist of what Indian hospitals actually expect in an RFP.
- **RAKT** — a India-focused blood-bank-specific product, useful as a narrow reference for that one module's workflow (NBTC-guideline aligned).

---

## 12. Compliance & Security — India Context

This section is the difference between a system that works and one that actually gets a hospital empanelled and accredited.

### ABDM (Ayushman Bharat Digital Mission)
- Register the facility in the **Health Facility Registry (HFR)** and practitioners in the **Healthcare Professionals Registry (HPR)** — required before any ABDM data exchange
- Your system must implement both **HIP (Health Information Provider)** and **HIU (Health Information User)** roles — sharing records you hold, and requesting records from elsewhere — both gated by patient consent
- Certification runs through **M1 → M2 → M3 milestones**: M1 covers ABHA creation/verification; M2 covers care-context linking (a visit/admission attaches to the patient's ABHA); M3 covers advanced data-sharing/ecosystem integrations including structured claims exchange
- Every consultation, prescription, and report must be serviceable as an **HL7 FHIR R4 bundle** — a hospital that registers in the HFR but can't produce a valid FHIR bundle is only half onboarded
- Consent is a structured, auditable artifact (purpose, scope, time window, specific requester) — not a checkbox — and must be revocable by the patient
- **HIP registration is now a prerequisite for state insurance empanelment** under Ayushman Bharat/PM-JAY, CGHS, and ECHS — this is not optional if the hospital wants scheme patients

### NABH (National Accreditation Board for Hospitals & Healthcare Providers)
- **6th Edition standards** (effective January 1, 2025) shifted from process-compliance to **outcomes-focused** assessment — readmission rates, infection rates, and Patient-Reported Outcome Measures now carry real weight, alongside expanded cybersecurity and sustainability standards
- Separate **NABH Digital Health Accreditation/Certification** program specifically assesses HIS/EMR integration, clinical workflows, telemedicine, cybersecurity, and data management — with published test cases HIS/EMR vendors can validate against, and certification valid for 2 years before reassessment
- Design the EMR/governance layer to capture and audit each stage of the patient journey (OPD → discharge) from day one — retrofitting outcome tracking after launch is much harder than building it in

### NMC HMIS Mandate (Teaching/Medical College Hospitals)
- The National Medical Commission mandates ABDM-enabled HMIS, **Aadhaar-Enabled Biometric Attendance System (AEBAS)**, and CCTV integration for all medical colleges and their attached hospitals — if this system will ever sit under a teaching hospital, plan for biometric attendance integration in the HR module, not just roster software

### PM-JAY / NHCX (Insurance & Government Schemes)
- PM-JAY's IT backbone has three parts your Insurance panel should mirror: **BIS** (beneficiary lookup), **TMS** (the actual claim transaction workflow), and **GMS** (grievances) — plus a hospital-side **Ayushman Mitra** desk role
- **NHCX** standardizes private-insurer claims the same way — coverage check, pre-auth, predetermination, and claim submission in one machine-readable format instead of per-insurer portals — and IRDAI now mandates **cashless claim settlement within 3 hours of discharge authorization**, so this isn't just an integration nicety, it's a compliance clock

### DPDP Act 2023 (+ DPDP Rules 2025)
- Every hospital is a **Data Fiduciary** for patient data — this is a legal duty, not a policy statement
- Consent must be **explicit, itemized, and in plain language** — no blanket "I agree to terms" checkbox covering everything
- Mandatory technical safeguards: **encryption, multi-factor authentication, role-based access control, audit logging retained for at least one year, and annual vulnerability assessments (VAPT)** — and any third-party processor (cloud host, EMR SaaS vendor) must contractually commit to the same standards
- A clinical establishment **may process a minor's health data without separate parental consent to the extent necessary for protecting the minor's health** — a narrow, clinical-necessity carve-out, not a general exemption
- Patients have enforceable rights to access, correct, and request erasure of their data
- Penalties for serious contraventions run **up to ₹250 crore** — this is a board-level risk, not a footnote
- Digitally-created or scanned records are only legally admissible as evidence under the **Bharatiya Sakshya Adhiniyam (BSA) 2023** if generated in the regular course of business and accompanied by the required authenticity certification — relevant to how your document-management and e-signature/consent modules generate and store records

### CERT-In (Cybersecurity Incident Reporting)
- Cyber incidents (data breaches, unauthorized access, website defacement, and a defined list of other categories) must be reported to CERT-In **within 6 hours** of detection — build an internal incident-detection-to-reporting workflow that can actually meet that clock, since it is far tighter than the 72-hour norm used in the US/EU
- System logs must be retained (and stored within India) — align this with the DPDP one-year audit-log minimum rather than running two separate retention policies

### Blood Bank Regulatory Layer
- Governed by the **Drugs and Cosmetics Act**, **CDSCO** licensing, and **NACO** guidelines — every unit tested for HIV/HBsAg/HCV/malaria/syphilis before issue, every transfusion reaction investigated and reported, full traceability by bag number

### General Security Baseline
- Encryption at rest and in transit
- Strict RBAC scoped by both role and branch
- Guardian-vs-dependent access rules enforced, including re-consent when a dependent turns 18 and claims their own account
- Session timeout and 2FA for high-privilege roles
- Regular automated backups and a documented disaster-recovery plan

---

## 13. Non-Functional Requirements

- **Uptime**: target 99.9% — one outage affects every branch on a shared system
- **Scalability**: single-DB architecture should comfortably scale from 2–3 branches to dozens without re-architecture
- **Responsiveness**: reception/nursing panels optimized for speed on tablets/desktops in fast-paced settings
- **Multilingual**: English + Hindi/Marathi (regional) for patient-facing panels
- **Print-friendly**: prescriptions, bills, and reports need clean printable layouts
- **Video call resilience**: graceful degradation to audio-only on poor bandwidth
- **Offline resilience**: local caching at reception for network drops
- **Data retention**: align to Indian medical council norms (typically 3 years OPD, longer for major procedures) and the DPDP/CERT-In log-retention minimums, as one policy rather than several conflicting ones

---

## 14. Pre-Coding Checklist

- [ ] Finalize which specialties each branch runs (affects department/EMR field customization per branch)
- [ ] Confirm single-DB, `branch_id`-scoped architecture vs. separate-DB-per-branch
- [ ] Draft the RBAC permission matrix (role × panel × action × branch scope) before writing auth middleware
- [ ] Decide the family account model in detail — guardian-managed groups (Pattern A), reciprocal shared-access grants (Pattern B), or both from day one
- [ ] Decide video engine: Jitsi (self-hosted, cheaper) vs. Agora/Twilio (paid, more reliable) — affects infra cost immediately
- [ ] Decide FHIR server approach (HAPI FHIR vs. a managed ABDM-integration partner) — this decision shapes your database design, not just an API layer bolted on later
- [ ] Map out ABDM M1/M2/M3 scope and timeline, and NABH Digital Health Accreditation intent, before finalizing the EMR schema
- [ ] Decide NHCX and PM-JAY (BIS/TMS/GMS) integration approach — direct API integration vs. an empanelled ABDM/NHCX partner
- [ ] Set up dev/staging/prod environments early
- [ ] Choose WhatsApp/SMS provider and get API access sorted (approval lead time matters)
- [ ] Build the CERT-In 6-hour incident-reporting workflow and the DPDP consent/audit-log design together — they share the same logging backbone
- [ ] Confirm Telemedicine Practice Guidelines compliance (RMP display, minor-with-guardian gate, consent logging, prescription-schedule restriction) before enabling video consultation for real patients

---

## Sources Consulted

- [NABH — Digital Health Standards & Accreditation Programme](https://nabh.co/programmes/digital-health-accreditation-programme/)
- [NABH 6th Edition — Key Changes](https://thedoctorpreneuracademy.com/?p=8596)
- [ABDM HIP Integration 2026 — FHIR R4, ABHA, NABH 6th Edition (dev.to)](https://dev.to/mr_manushukla/abdm-hip-integration-in-2026-fhir-r4-abha-linking-and-nabh-6th-edition-readiness-50i4)
- [ABDM Integration Checklist 2026 — M1/M2/M3 (Qualysec)](https://qualysec.com/abdm-integration-checklist/)
- [National Health Claims Exchange — Wikipedia](https://en.wikipedia.org/wiki/National_Health_Claims_Exchange)
- [NHCX Features & IRDAI 3-Hour Cashless Rule](https://vajiramandravi.com/current-affairs/national-health-claim-exchange-nhcx/)
- [Ayushman Bharat PM-JAY — IT System Overview (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8760668)
- [DPDP Act 2023 & Healthcare — Sectoral Impact (Tsaaro)](https://tsaaro.com/blogs/privacy-and-healthcare-the-impact-of-the-dpdp-act-2023-and-india%E2%80%99s-sectoral-healthcare-regulations)
- [DPDP Act — Health Data Practical Guide (AMLegals)](https://amlegals.com/health-data-and-the-dpdp-act-a-practical-guide/)
- [CERT-In 6-Hour Reporting Rule (SS Rana)](https://ssrana.in/articles/mandatory-reporting-cyber-security-incidents-india/)
- [Telemedicine Practice Guidelines — India (IBA)](https://www.ibanet.org/article/15234243-b534-45f6-b303-4919cfe9a2dc)
- [OT Management Software — WHO Checklist, Implant Tracking (OneCity)](https://onecity.co.in/hospital-operation-theatre-software)
- [Blood Bank Software — NACO/CDSCO Compliance (OneCity)](https://onecity.co.in/blood-bank-software-bangalore)
- [Bahmni OT Scheduling Module (Open Source)](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/676069378/Operation+Theatre+Scheduling)
- [Healthcare CMMS Features 2026 (Oxmaint)](https://oxmaint.com/industries/healthcare/healthcare-cmms-software-features-benefits-2026)
- [Best Hospital Management Systems 2026 — Landscape Overview](https://wpreset.com/best-hospital-management-systems-in-2026/)
