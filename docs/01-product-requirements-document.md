# Product Requirements Document (PRD)

## Arogya Mitra — Enterprise Multi-Branch Hospital Management & Public Health Platform

---

## 1. Product Overview

**Arogya Mitra** is a next-generation, cloud/edge-hybrid Hospital Management System (HMS), Electronic Medical Record (EMR), and Public Health Network platform. It bridges the gap between **tertiary/district hospitals** and **rural primary care spokes (Sub-Centres / Ayushman Arogya Mandir, Primary Health Centres, and Community Health Centres)** across India.

The platform unifies tertiary multi-specialty clinical workflows (IPD, Operation Theatre, LIS, FEFO Pharmacy, Billing, GST e-Invoicing, and PM-JAY/NHCX claims) with **rural frontline public health outreach** (Assisted Teleconsultation, Closed-Loop Referral Tracking, High-Risk Maternal & Child tracking, NCD 30+ screening, and dedicated ASHA/ANM/CHO interfaces).

---

## 2. Problem Statement

Rural and underserved communities in India face severe barriers to healthcare access and quality:
1. **Travel Distance & Specialist Shortages**: Rural patients travel 50–100 km to district hospitals for minor specialist consultations.
2. **Fragmented Care & Dropped Referrals**: Patients moving between Sub-Centres, PHCs, and District Hospitals carry loose paper slips; up to 60% of referrals are lost without loop closure.
3. **High-Risk Patient Drop-offs**: Maternal (ANC/PNC), pediatric immunization, and chronic NCD (hypertension, diabetes) patients lack automated tracking.
4. **Constrained Frontline Health Workers (FLHW)**: ASHAs, ANMs, and CHOs are burdened with manual paper registers and lack simple digital tools to conduct assisted teleconsultations.
5. **Language & Literacy Barriers**: Rural citizens and frontline workers need intuitive bilingual (English + Hindi) and audio/visual interfaces.
6. **Medicine & Diagnostic Blindspots**: Rural health centres experience chronic stockouts without real-time district-wide inventory visibility.

---

## 3. Target Users & Personas

| Role / Persona | Operational Level | Primary Responsibilities & Module Access |
|---|---|---|
| **Community Health Officer (CHO)** | Sub-Centre / Ayushman Arogya Mandir (AAM) | Primary screening, assisted teleconsultation with DH specialists, point-of-care diagnostics, and medicine dispensing. |
| **ANM / ASHA Worker** | Village / Field Outreach | Maternal ANC/PNC tracking, child immunization, village NCD 30+ screening, and community follow-up. |
| **Medical Officer (MO)** | Primary Health Centre (PHC) | General outpatient consultations, digital prescription (Rx), lab sample routing, and specialist referral creation. |
| **Specialist / Doctor** | Community Health Centre (CHC) / District Hospital (DH) | OPD consultations, assisted tele-hub consultations, surgical procedures (OT), IPD rounds, and referral acceptance. |
| **Staff Nurse** | CHC / District Hospital (IPD) | Inpatient bed management, vital rounds, electronic Medication Administration Record (e-MAR), and pre/post-op care. |
| **Lab Technician / Pathologist** | PHC / District Public Health Lab (DPHL) | Sample collection, barcoding, analyzer interfacing, and multi-tier lab report validation. |
| **Pharmacist** | PHC / CHC / District Hospital | Batch-wise stock ledger, automated First-Expiry-First-Out (FEFO) dispensing, and district stockout alerts. |
| **Billing & TPA Coordinator** | District Hospital / Network Hub | Consolidated billing, GST e-invoicing (IRN), PM-JAY / NHCX cashless claim pre-auth and settlement. |
| **District Health Officer / Medical Director** | District / State HQ | Real-time public health monitoring, referral completion rates, disease hotspots, and NABH indicators. |
| **Citizen / Patient** | Rural / Urban Public | Accessing digital health locker records, booking live queue tokens, 1-tap emergency SOS (108), and ABHA consent. |

---

## 4. Core Features

### 4.1 Tiered Public Health Hierarchy & Multi-Branch Architecture
- Hierarchical facility model: **Sub-Centre (AAM) $\to$ PHC $\to$ CHC $\to$ District Hospital (Apex Hub)**.
- Unified Master Patient Index (EMPI) with national **ABDM (ABHA M1/M2/M3)** demographic auto-fill and longitudinal health records.

### 4.2 Assisted Teleconsultation Engine (Spoke-to-Hub)
- Frontline worker (CHO/ANM) initiates an assisted WebRTC high-definition video call from the Sub-Centre tablet to the District Hospital Tele-Hub.
- Specialist reviews live vitals, conducts the virtual consultation, and issues a digital prescription that **instantly prints / dispenses at the rural Sub-Centre**.

### 4.3 Closed-Loop Referral Tracking & 108 Emergency Escalation
- Digital referral tokens linking referring facility (PHC/Sub-Centre) to receiving facility (CHC/DH) with real-time specialist & bed availability.
- **108 Emergency Escalation**: Red-flag emergencies (post-partum hemorrhage, severe trauma, snakebite) dispatch an instant alert to the 108 ambulance network and pre-alert the destination emergency trauma team.
- **Reverse Loop Closure**: When the patient is discharged from the District Hospital, an automated reverse discharge summary and follow-up plan are routed back to the referring CHO's dashboard.

### 4.4 High-Risk Maternal, Child & NCD Tracking Cohorts
- **Maternal Health (RCH)**: 4-visit Antenatal Care (ANC) scheduler with automated High-Risk Pregnancy (HRP) red-flagging.
- **Child Health & Immunization**: National Immunization Schedule (NIS) tracking with automated due-date alerts for BCG, Pentavalent, OPV, and MR.
- **NCD 30+ Screening**: Community screening for Hypertension (BP $\ge 140/90$), Diabetes (RBS $\ge 140$), and early cancer detection with scheduled follow-ups.

### 4.5 Dual Appointment & Live Queue Token Engine
- In-person OPD token generation and live TV queue display boards with audio announcements.
- Instant 1-tap hospital check-in via ABHA QR code scanning.

### 4.6 Specialty Clinical EMR (Dynamic JSON-Schema)
- Pre-configured dynamic JSON Schema templates for General Medicine, Cardiology, Orthopedics, Pediatrics, OB/GYN, Ophthalmology, and Dermatology.
- ICD-10 diagnosis selector & digital Rx with rule-based Drug-Drug Interaction (DDI) alerts.

### 4.7 Inpatient Department (IPD), Wards & Operation Theatre (OT)
- 2D interactive ward bed matrix visualizer (*Occupied, Vacant, Housekeeping, ICU*).
- Nursing e-MAR (Medication Administration Record) and fluid balance charts.
- Operation Theatre (OT) scheduling with mandatory digital **WHO Surgical Safety Checklist** (*Sign In, Time Out, Sign Out*).

### 4.8 Laboratory (LIS) & District Diagnostic Routing
- Complete test directory (Biochemistry, Hematology, Microbiology, Pathology).
- Hub-and-Spoke sample accessioning: Blood drawn at rural PHC spoke $\to$ barcoded transport $\to$ processed at District Lab $\to$ results synced back digitally in $<24$ hours.

### 4.9 Pharmacy Supply Chain & Automated FEFO Dispensing
- Central and branch drug catalogs with generic names, brand names, and HSN codes.
- Automated **First-Expiry-First-Out (FEFO)** batch allocation to eliminate expired medicine wastage.
- District-wide drug availability visibility to prevent stockouts across PHCs and CHCs.

### 4.10 Billing, GST E-Invoicing & PM-JAY / NHCX Gateway
- Itemized OPD/IPD billing with multi-mode payments (Cash, Card, UPI Dynamic QR).
- Automated NIC GST E-Invoice generation (64-character IRN and cryptographic QR code).
- Paperless cashless pre-authorization and claim submission via **NHCX FHIR Claim** bundles.

### 4.11 Multilingual (English + Hindi) & 1-Tap Emergency SOS
- Instant top-bar language toggle (`English` $\leftrightarrow$ `हिन्दी`) across all clinical, administrative, and patient screens.
- **1-Tap Emergency SOS**: Immediate 108 ambulance dispatch and nearest emergency facility locator accessible without login.

---

## 5. User Stories

1. **CHO at Sub-Centre**: *"As a Community Health Officer in a rural wellness centre, I want to conduct an assisted video teleconsultation with a pediatrician at the District Hospital so that a child with respiratory distress receives expert care without traveling 60 km."*
2. **ASHA Worker in Village**: *"As an ASHA worker, I want a simplified Hindi mobile checklist to record ANC checkups and receive high-risk alerts so that pregnant mothers with severe anemia are referred to the hospital in time."*
3. **Medical Officer at PHC**: *"As a PHC Doctor, I want to create a digital referral token with pre-attached lab results to the District Hospital and receive an automated discharge summary when my patient returns."*
4. **Specialist at District Hospital**: *"As a district surgeon, I want a single unified dashboard to accept incoming rural referrals, schedule OT slots with WHO safety checklists, and monitor post-op ward beds."*
5. **Rural Patient**: *"As a village resident, I want to scan a counter QR code at the PHC to get my checkup token in Hindi, and view my prescriptions and lab reports on my phone."*

---

## 6. MVP Scope (Release 1.0)

- [x] Multi-Tier Hierarchy (Sub-Centre, PHC, CHC, District Hospital) & RBAC (Superadmin, Doctor, Nurse, CHO, ANM, ASHA, Pharmacist, Billing).
- [x] English + Hindi Multilingual UI with instant language toggle.
- [x] Patient Registration & Master Index with ABHA M1 QR verification.
- [x] Assisted Teleconsultation Engine (Spoke-to-Hub WebRTC video + digital Rx).
- [x] Closed-Loop Referral Tracking with tracking tokens and reverse feedback loop.
- [x] High-Risk Cohorts: Maternal ANC/HRP, Child Immunization, and NCD 30+ Screening.
- [x] OPD Appointments & Live Token Queue Board with audio cue.
- [x] Clinical EMR: Encounters, Vitals, ICD-10 Diagnoses, Digital Rx, Dynamic JSON Specialty Forms.
- [x] Basic LIS & Sample Accessioning.
- [x] Pharmacy Inventory with automated FEFO batch allocation.
- [x] IPD Bed Visualizer & Nursing e-MAR.
- [x] Billing Desk with UPI QR & GST Invoicing.
- [x] 1-Tap Emergency SOS (108 Ambulance dispatch integration).

---

## 7. Success Criteria & KPIs

| KPI Metric | Baseline / Legacy State | Arogya Mitra Target |
|---|---|---|
| **Rural Specialist Access Latency** | 3 – 7 days (travel required) | **$\le 15$ minutes** (via Assisted Teleconsult) |
| **Referral Completion & Loop Closure** | $< 35\%$ completed | **$\ge 85\%$ tracked & closed** |
| **High-Risk Pregnancy (HRP) Detection** | Often late (3rd trimester) | **$\ge 90\%$ detected in 1st/2nd trimester** |
| **Patient Registration Time** | 4 – 6 minutes | **$\le 30$ seconds** (with ABHA QR) |
| **Pharmacy Expired Stock Loss** | 3% – 5% annually | **$< 0.2\%$ annually** (via auto-FEFO) |
| **NHCX Claim Pre-Auth Turnaround** | 7 – 14 days | **$< 24$ hours** |
