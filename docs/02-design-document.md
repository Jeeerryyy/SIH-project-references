# Design Document

## Arogya Mitra — Master Unified Design System & UI Specification

> **Design Direction**: Inspired by the production design system in `mccphp/demo/patient-app.html` and `theme.css`.  
> **Aesthetic Philosophy**: **Clean, Polished, Scalable & Citizen-Accessible**.  
> **Multilingual Support**: Fully bilingual (English + Hindi Devanagari typography).

---

## 1. Overall Design Philosophy

The design system of **Arogya Mitra** combines **Enterprise Clinical Efficiency** with **Citizen & Frontline Simplicity**:
- **High-Density Workstations for Clinicians**: Dual/triple-pane layouts for doctors and billing operators to minimize clicks.
- **Card-Based, Tactile Interfaces for Citizens & Frontline Workers (ASHA/ANM/CHO)**: Large touch targets ($\ge 48\text{px}$), bold iconography, pastel visual cards, and plain-language labels.
- **Bilingual & Script-Optimized**: Native Devanagari typography rendering for Hindi alongside English.
- **Safety-First Color Coding**: Instant visual triage and critical clinical alerts (1-Tap Emergency SOS, allergy warnings, critical vitals).

---

## 2. Master Color Tokens & Palette

Derived directly from the verified design tokens in `theme.css`:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MASTER BRAND & CLINICAL PALETTE                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│  🏢 Navy Rail & Header Surfaces:                                                                 │
│  - Darkest Navy   : #0A1120  (Sidebar Rail / Canvas Dark)                                        │
│  - Navy Top Rail  : #0D1B2A  (Global App Top Header)                                             │
│  - Navy Primary   : #182544  (Primary Buttons / Modal Headers)                                   │
│                                                                                                  │
│  🔥 Vibrant Action Orange (Primary CTAs):                                                        │
│  - Orange Primary : #FF6A38  (Main Action Buttons / Highlights)                                  │
│  - Orange Hover   : #F05A28  (Active / Hover State)                                              │
│  - Orange Light   : #FFF2ED  (Badge / Card Backgrounds)                                          │
│  - Orange Border  : #FFD3C2  (Subtle Card Outlines)                                              │
│                                                                                                  │
│  💜 Royal Purple & Indigo (Telehealth, Passes, Consents):                                         │
│  - Purple Primary : #5438DC  (Telehealth Rooms / Digital Health Passes)                           │
│  - Purple Light   : #EBE8FD  (Consent & Permission Badges)                                       │
│                                                                                                  │
│  🌿 Mint Teal & Emerald (Health Status & Success):                                               │
│  - Teal Primary   : #06D6A0  (Active Patient Stable / Bed Vacant / Normal Vitals)                 │
│  - Teal Light     : #E6FAF5  (Positive Status Badges)                                            │
│                                                                                                  │
│  💙 Medical Blue (Clinical Navigation & Records):                                                │
│  - Blue Primary   : #2563EB  (Prescriptions / Medical Records / Fast Token QR)                    │
│  - Blue Light     : #EFF6FF  (Record Cards / Active Tab Surface)                                  │
│                                                                                                  │
│  🚨 Emergency Red & SOS (108 Ambulance / Critical Alarms):                                       │
│  - Red Primary    : #EF4444  (1-Tap Emergency SOS / Severe Allergy / Critical Vitals)            │
│  - Red Light      : #FEF2F2  (Emergency SOS Banners & Critical Modals)                           │
│                                                                                                  │
│  ⚠️ Warning Amber (Pending Triage / High-Risk Cohorts):                                          │
│  - Amber Primary  : #F59E0B  (High-Risk Pregnancy / Urgent Triage / Pending Referrals)            │
│  - Amber Light    : #FEF3C7  (High-Risk Alert Cards)                                             │
│                                                                                                  │
│  🖼️ Canvas & Neutral Surfaces:                                                                   │
│  - Main Canvas    : #DBE4EF  (Desktop Application Shell Background)                              │
│  - Card Surface   : #FFFFFF  (Crisp Pure White Content Cards)                                    │
│  - Subtle Surface : #F8FAFC  (Input Fields / Table Row Alternates)                               │
│  - Border Light   : #E2E8F0  (Crisp 1px Dividers)                                                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Typography Hierarchy

- **Primary Sans Font**: `'Inter', 'Noto Sans Devanagari', sans-serif` (Ensures crisp readability in both English and Hindi).
- **Monospace Font**: `'JetBrains Mono', Consolas, monospace` (For MRN, ABHA ID, Queue Tokens, Invoices, Dosages).

| Typography Token | Font Size / Line Height | Weight | Application Examples |
|---|---|---|---|
| **Header Title** | 22px / 28px | ExtraBold (800) | App Hero Welcome, Branch Name |
| **Section Title** | 16px / 22px | Bold (700) | Card Titles, Ward Section Headers |
| **Token Monospace** | 24px / 28px | Black (900) Mono | `#TK-OPD-108`, `#REF-DH-2026` |
| **Body Primary** | 13px / 18px | SemiBold (600) | Patient Name, Vital Values, Menu Items |
| **Body Secondary** | 12px / 16px | Regular (400) | Clinical notes, descriptions, subtitles |
| **Micro Badge** | 10px / 14px | Bold (700) | `Active`, `High-Risk HRP`, `VoLTE 5G` |

---

## 4. Key UI Components & Design System Patterns

### 4.1 Top Global Navigation Header
```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Emblem] Arogya Mitra • Public Health Portal   [ 🌐 English (बदला) ]  [ 🚨 SOS (108) ]  [ User Profile ] │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
- Sticky dark navy header (`#0D1B2A`) with national/state branding, quick language switcher, and permanent emergency 1-tap SOS.

### 4.2 Active Queue Token Pass (Banner & Modal)
- Shows token number (`#TK-OPD-108`), facility name, doctor name, estimated wait time (`~15 mins`), and animated pulsating status indicator (`#06D6A0`).
- Features a **"View Pass / QR"** modal and an instant **"Join Live Doctor Video Room"** button for teleconsultations.

### 4.3 Horizontal Action Carousel Cards
Vibrant, pastel-accented interactive cards with distinct themes:
- 🔵 **Hospital Fast Token (Scan QR)** — Blue theme (`card-theme-scan-reg`)
- 🟢 **Share Records with Doctor** — Teal theme (`card-theme-scan-share`)
- 🟣 **Permissions & Consents** — Indigo theme (`card-theme-consent`)
- 🟡 **My Medical Records & Prescriptions** — Amber theme (`card-theme-records`)
- 🟠 **Family Health Cards** — Orange theme (`card-theme-family`)

### 4.4 1-Tap Emergency SOS (108) Component
- Prominent crimson button (`#EF4444`) with animated countdown timer (5 seconds).
- Instantly transmits GPS coordinates to the 108 ambulance dispatch and shows nearest hospital emergency contact numbers without requiring login.

### 4.5 Closed-Loop Referral Tracking Card
- Milestone stepper tracking: `Referral Created (PHC)` $\to$ `In-Transit / Ambulance Dispatched` $\to$ `Admitted at District Hospital` $\to$ `Discharged with Follow-Up to PHC`.
- Displays real-time bed and specialist availability at the receiving facility.

### 4.6 High-Risk Maternal & NCD Cohort Badge
- Color-coded risk cards with alert tags:
  - `[ High-Risk Pregnancy - Severe Anemia (Hb: 7.2 g/dL) - Amber ]`
  - `[ NCD Alert - Uncontrolled Hypertension (BP: 168/104 mmHg) - Red ]`
  - `[ Child Immunization Due - MR-1 Vaccine - Blue ]`

---

## 5. Complete Registry of Screens (18 Screens)

| Screen ID | Screen Name | Role / Persona | Layout & Purpose |
|---|---|---|---|
| `SCR-00` | **Login & 1-Tap SOS Welcome** | All Citizens / Staff | Mobile/ABHA login, English/Hindi selector, and zero-login emergency 108 SOS. |
| `SCR-01` | **Citizen Health Dashboard** | Patient / Caregiver | Active token pass, 5 action carousel cards, vitals summary, and recent prescriptions. |
| `SCR-02` | **Frontline Worker (ASHA/ANM/CHO) Portal** | ASHA, ANM, CHO | Tablet-friendly village register, ANC/PNC tracker, NCD screening checklist, assisted teleconsult launch. |
| `SCR-03` | **Assisted Teleconsultation Room** | CHO, Doctor, Patient | High-definition WebRTC video grid, live vitals telemetry sidebar, and real-time digital Rx viewer. |
| `SCR-04` | **Closed-Loop Referral Gateway** | CHO, MO, Specialist | Inward/Outward referral tracking, real-time DH bed status, and reverse discharge note routing. |
| `SCR-05` | **High-Risk Maternal & Child (RCH) Console** | ANM, CHO, Gynaecologist | 4-visit ANC scheduler, High-Risk Pregnancy red-flags, and child immunization due-date tracker. |
| `SCR-06` | **NCD 30+ Community Screening Console** | ASHA, CHO, MO | Village-level screening for Hypertension, Diabetes, and early cancer detection. |
| `SCR-07` | **Reception & Fast-Track ABHA Triage** | Receptionist, Triage Nurse | 1-scan ABHA QR registration, triage categorization (Red/Yellow/Green), and token generation. |
| `SCR-08` | **OPD Appointment & Live Queue Board** | Front Desk, Waiting Lounge | Real-time TV display board with bilingual audio chime announcements. |
| `SCR-09` | **Doctor OPD Consultation Workspace** | Clinician / Specialist | High-density EMR workspace: vitals, dynamic JSON specialty forms, ICD-10 search, and digital Rx. |
| `SCR-10` | **IPD Bed Matrix & Ward Layout Visualizer** | Ward Nurse, Inpatient MO | 2D interactive floor map of beds (*Vacant, Occupied, Housekeeping, ICU*). |
| `SCR-11` | **Nursing Station & e-MAR Console** | Staff Nurse | Timed medication administration record, vital signs charting, and nurse shift handovers. |
| `SCR-12` | **Operation Theatre (OT) & WHO Checklist** | Surgeon, Anesthetist | Surgical slot booking, mandatory digital WHO Surgical Safety Checklist, and anesthesia logs. |
| `SCR-13` | **Laboratory (LIS) & District Sample Routing** | Lab Tech, Pathologist | Sample accessioning, barcoding, automated analyzer flags, and multi-tier report signing. |
| `SCR-14` | **Pharmacy Counter & Auto-FEFO Dispenser** | Pharmacist | Batch allocation by nearest expiry (FEFO), allergy check, and district-wide stock search. |
| `SCR-15` | **Billing Desk & GST E-Invoicing Console** | Billing Clerk | Consolidated itemized billing, GST IRN generation, and UPI dynamic QR payments. |
| `SCR-16` | **PM-JAY / NHCX Insurance Claims Gateway** | TPA Coordinator | Cashless pre-auth submission, digital evidence bundling, and claim status tracking. |
| `SCR-17` | **Public Health MIS & Executive Analytics** | CMO, Medical Director | District disease heatmaps, referral closure rates, stockout alerts, and NABH indicators. |

---

## 6. Bilingual User Journeys (English + Hindi)

### 6.1 Assisted Teleconsultation Journey (Sub-Centre $\to$ District Hospital)
```
1. Rural Patient visits Sub-Centre with severe abdominal pain
2. CHO opens Arogya Mitra Tablet (in हिन्दी) → Searches patient by ABHA QR / Mobile
3. CHO records Vitals (BP: 130/85, Pulse: 94, Temp: 101.4°F)
4. CHO taps "विशेषज्ञ डॉक्टर से वीडियो कॉल (Start Assisted Teleconsult)"
5. District Hospital Tele-Hub Specialist receives incoming alert → Joins WebRTC call
6. Specialist reviews live vitals, talks to patient via CHO, and inputs Diagnosis & Rx
7. Specialist clicks "प्रिस्क्रिप्शन जारी करें (Submit Rx)"
8. Digital Prescription appears immediately on CHO's tablet → CHO dispenses medicines from Sub-Centre stock
```

### 6.2 Closed-Loop Emergency Referral Journey
```
1. PHC Doctor identifies High-Risk Pregnancy (Severe Pre-Eclampsia, BP: 170/110)
2. Doctor clicks "Refer to District Hospital" → System checks live ICU/Obstetric bed availability
3. System generates Referral Token (#REF-DH-409) + Triggers 108 Emergency Ambulance Dispatch
4. District Hospital Emergency Triage receives pre-arrival alert with patient's clinical summary
5. Patient arrives at DH → Specialist scans QR → Admits to Obstetric ICU
6. Post-delivery discharge: DH Specialist submits discharge summary
7. System automatically sends a reverse follow-up alert to the patient's village ASHA & PHC Doctor
```

---

## 7. Component States & Responsive Standard

- **Device Simulator & Expanded Modes**:
  - **Smartphone Shell Simulator** (as seen in `patient-app.html` with mobile status bar, battery pill, and navigation drawer) for citizen and frontline worker views.
  - **Desktop Expanded View** (high-density multi-pane layout) for clinician workstations and hospital administrative dashboards.
- **Empty States**: Friendly bilingual illustrations with direct CTA buttons (e.g., *"कोई सक्रिय अपॉइंटमेंट नहीं है / No active appointments [ + Book Now ]"*).
- **Loading States**: Shimmering skeleton cards matching exact card dimensions (zero disruptive full-page spinners).
- **Error States**: Inline red field borders with clear explanatory messages and non-blocking toast notifications.
