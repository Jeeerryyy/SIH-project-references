# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 07. Portal UX & Screen-by-Screen Specification Dictionary

**Document Reference:** `MCCPHP-DOC-07-UX`  
**Total Portals:** 9 Dedicated, Role-Tailored Frontend Portals  
**Design System:** Maharashtra Gov Design System (MUI 6 + Custom Tokens + Inter & Noto Sans Devanagari)  
**Localization:** Full Native Triple-Language Support (मराठी प्राथमिक, हिंदी, English)

---

### 1. Master Portal Directory & Routing Matrix

```
┌──────────────────────────────────┬─────────────────────────────────────┬───────────────────────────────┐
│ Portal Name                      │ Domain / Route Prefix               │ Primary Target User           │
├──────────────────────────────────┼─────────────────────────────────────┼───────────────────────────────┤
│ 1. Citizen Health Portal         │ /citizen (citizen.mh.gov.in)        │ Patients, Families, Citizens  │
│ 2. Clinical EMR & OPD Portal     │ /clinical (clinical.mccphp.mh.gov)  │ Medical Officers, Specialists │
│ 3. Facility Admin Portal         │ /admin (admin.mccphp.mh.gov)        │ Medical Superintendents, RMOs │
│ 4. State SHOC Command Portal     │ /shoc (shoc.mccphp.mh.gov)          │ DHS, DHO, State Health Sec.  │
│ 5. ASHA/ANM Mobile PWA           │ /asha (asha.mccphp.mh.gov)          │ ASHA Workers, ANMs, MPWs      │
│ 6. Pharmacy & Drug Supply        │ /pharmacy (pharmacy.mccphp.mh.gov)  │ Pharmacists, Store Keepers    │
│ 7. Diagnostic & Lab Portal       │ /lab (lab.mccphp.mh.gov)            │ Lab Technicians, Pathologists │
│ 8. Telemedicine Hub Portal       │ /teleconsult (teleconsult.mccphp)   │ Tele-Specialists, CHO/HWCs    │
│ 9. Grievance & Audit Portal      │ /audit (audit.mccphp.mh.gov)        │ DPO, Vigilance, Audit Officers│
└──────────────────────────────────┴─────────────────────────────────────┴───────────────────────────────┘
```

---

### 2. Portal 1: Citizen Health Portal (`/citizen`)

#### Screen 1.1: Landing & Public Health Discovery (`/citizen/home`)
* **Header:** Government of Maharashtra Emblem + Department of Public Health Logo + Language Switcher (`मराठी | English | हिंदी`) + Login Button.
* **Hero Search Widget:** "जवळचे शासकीय रुग्णालय किंवा दवाखाना शोधा" (Find nearest Govt Hospital/Dispensary) with GPS auto-detect and specialty dropdown (स्त्रीरोग, बालरोग, नेत्ररोग, सामान्य चिकित्सा).
* **Live Emergency Banner:** Red banner showing 108 Ambulance button, 104 Health Helpline, Blood Bank stock ticker across district hospitals.
* **Quick Action Grid:**
  * 🏥 **दवाखाना / रुग्णालय शोधा** (Find Facilities)
  * 📅 **तपासणीची वेळ बुक करा** (Book OPD Slot)
  * 📄 **माझे आरोग्य रेकॉर्ड** (My Health Records / ABHA)
  * 💊 **औषध उपलब्धता तपासा** (Check Medicine Stock)
  * 🚨 **तातडीची मदत (१०८)** (Emergency 108 Call)

#### Screen 1.2: Citizen Authentication & ABHA Link (`/citizen/login`)
* **Tabs:** `[मोबाईल OTP ने लॉगिन करा]` / `[ABHA ID द्वारे लॉगिन करा]`.
* **Inputs:** 10-digit Mobile Number or 14-digit ABHA ID (`name@abdm`).
* **Action Buttons:** `[OTP पाठवा]` (Send OTP), `[नवीन ABHA खाते तयार करा]` (Create New ABHA).
* **Consent Banner:** Itemized DPDP Act notice in Marathi with checkbox before login verification.

#### Screen 1.3: Citizen Health Dashboard (`/citizen/dashboard`)
* **Patient Profile Card:** Full Name, UHID (`MH-2026-004291`), ABHA QR Code card download button.
* **Upcoming Visits Card:** Next scheduled appointment with facility name, doctor name, token number, live estimated wait time widget.
* **Active Prescriptions Card:** Current medications with interactive reminders, dosage schedule (`1-0-1`), and audio instructions in Marathi.
* **Recent Diagnostic Reports:** PDF download button with NABL accredited digital signature stamp.

---

### 3. Portal 2: Clinical EMR & OPD Station Portal (`/clinical`)

#### Screen 2.1: Doctor OPD Queue Station (`/clinical/opd-queue`)
* **Top Bar:** Facility Name (e.g. Aundh District Hospital, Pune) + Department (General Medicine) + Room No (Room 104) + Active Duty Shift.
* **Queue Grid (Left 40%):**
  * List of issued tokens with color-coded priority badges: 🔴 `EMERGENCY`, 🟡 `PREGNANT/SENIOR`, 🔵 `NORMAL`.
  * Status chips: `WAITING`, `CALLED`, `IN_CONSULTATION`.
  * Actions: `[पुढील रुग्ण बोलवा - CALL NEXT]`, `[पुन्हा पुकारा - RE-ANNOUNCE]`, `[SKIPPED]`.
* **Active Patient Summary Banner:** Patient Name, Age/Gender, UHID, Vitals Summary (BP: 130/85, Pulse: 78, SpO2: 98%, Temp: 98.6°F), Known Allergies (🔴 PENICILLIN).

#### Screen 2.2: Comprehensive Clinical Consultation & SOAP (`/clinical/consultation/:encounterId`)
* **Layout:** 3-Column Split Interface:
  * **Column 1 (Left 25%):** Longitudinal History Timeline (Past visits, past prescriptions, chronic diseases, lab graphs).
  * **Column 2 (Center 50%):** Structured SOAP & Clinical Entry:
    * *Subjective:* Chief Complaints (autocomplete dictionary), HPI text area.
    * *Objective:* Physical examination checkboxes + Vitals recording widget.
    * *Assessment:* ICD-10 / SNOMED CT search box (e.g., typing "dengue" auto-suggests `38362002 | Dengue fever`).
    * *Plan:* Clinical notes + Treatment pathway.
  * **Column 3 (Right 25%):** Orders & Actions:
    * *e-Prescription Builder:* Drug name autocomplete, dosage chips (`1-0-1`, `1-1-1`), duration days, food relation.
    * *Lab Orders:* Diagnostic test picker with pre-configured standard panels (`Fever Panel`, `ANC Profile`).
    * *Tiered Referral:* Hospital selector with specialty routing (PHC -> CHC -> DH).
* **Bottom Action Dock:**
  * `[आणीबाणी ऍक्सेस - BREAK GLASS]`
  * `[सेव्ह करा - SAVE DRAFT]`
  * `[स्वाक्षरी करून पूर्ण करा - SIGN & COMPLETE WITH eSIGN]`

---

### 4. Portal 3: Facility Admin & Hospital Superintendent Portal (`/admin`)

#### Screen 3.1: Executive Bed Census & Facility Telemetry (`/admin/bed-census`)
* **Metrics Cards:** Total Sanctioned Beds (500), Operational Beds (480), Occupied (412 - 85.8%), Available ICU Beds (4), Oxygen Beds Available (18).
* **Ward Map Visualizer:** Interactive grid of all wards (Male Medical, Female Surgical, ICU, Labour Ward). Each bed displayed as an interactive tile:
  * 🟢 Green: Available
  * 🔴 Red: Occupied (Shows Patient UHID, Admitted Date, Treating Doctor)
  * 🟡 Yellow: Housekeeping / Cleaning in progress
  * ⚪ Gray: Maintenance / Blocked

#### Screen 3.2: Duty Roster & Staff Shift Management (`/admin/roster`)
* **Calendar View:** Monthly/Weekly matrix of all doctors, medical officers, and staff nurses across departments.
* **Features:** 1-click shift allocation, emergency on-call assignment, auto-conflict detection for double shifts.

---

### 5. Portal 4: State SHOC Command & Epidemiological War Room (`/shoc`)

#### Screen 4.1: Maharashtra State Health Heatmap & Outbreak Telemetry (`/shoc/war-room`)
* **Full-Screen GIS Map (Leaflet/PostGIS):** 36 Districts of Maharashtra color-coded by real-time epidemiological threat index:
  * 🟢 Green: Normal Baseline
  * 🟡 Yellow: Elevated Syndromic Alerts (>20% above 30-day baseline)
  * 🔴 Red: Confirmed Outbreak Zone (Active containment protocols)
* **Outbreak Cluster Card (Sidebar):**
  * Auto-detected clusters: "Dengue Outbreak Cluster: Haveli Taluka, Pune (14 cases in 48 hrs within 800m radius)".
  * Actions: `[DECLARE CONTAINMENT ZONE]`, `[DISPATCH RAPID RESPONSE TEAM - RRT]`, `[NOTIFY DHO]`.
* **State KPI Tickers:**
  * Daily OPD Footfall across State: 184,290 patients
  * High-Risk Pregnancies under active tracking: 14,210 mothers
  * State Essential Medicine Stock Health: 94.2% (No district stockouts)

---

### 6. Portal 5: ASHA / ANM Mobile PWA (`/asha`)

#### Screen 5.1: Village Household Roster & Offline Sync Dashboard (`/asha/home`)
* **Header:** Assigned Village (e.g., वडगाव, ता. हवेली) + ASHA Name + Live Sync Status Indicator (🟢 सर्व डेटा सिंक आहे).
* **Grid Buttons (Large Touch Targets for Mobile):**
  * 🏠 **कुटुंब सर्वेक्षण** (Household Surveys)
  * 🤰 **गरोदर माता तपासणी (ANC)** (Antenatal Care)
  * 👶 **बाळ व माता काळजी (PNC)** (Postnatal Care)
  * 💉 **लसीकरण नोंद** (Child Immunization)
  * 🩺 **असांसर्गिक रोग तपासणी (NCD/CBAC)** (NCD Screening)
  * 📦 **माझे औषध किट** (ASHA Medicine Kit Stock)

#### Screen 5.2: ANC Visit Form (Offline-First) (`/asha/anc/new`)
* **Inputs:** Patient Selector, Visit Number (1–8), Gestational Age, BP, Weight, Hemoglobin (g/dL), Urine Albumin strip test result.
* **High-Risk Auto-Alert:** If BP > 140/90 or Hb < 8 g/dL, UI flashes red alert: "धोकादायक गरोदरपण! तात्काळ प्राथमिक आरोग्य केंद्रात (PHC) पाठवा" (High Risk Pregnancy! Immediately refer to PHC) with 1-click PHC referral dispatch.

---

### 7. Portal 6: Pharmacy & Drug Inventory Portal (`/pharmacy`)

#### Screen 7.1: Real-Time OPD Dispensation Station (`/pharmacy/dispense`)
* **Search / Scan:** Barcode scanner input or Prescription Token input (`RX-2026-9042`).
* **Prescription Review:** Shows doctor's prescribed items, required quantity, and real-time inventory batch match.
* **Action:** 1-click `[सर्व औषधे वितरित करा - DISPENSE ALL]` -> Automatically decrements batch inventory and prints bilingual Marathi/English dosage label.

---

### 8. Portal 7: Diagnostic Laboratory Portal (`/lab`)

#### Screen 8.1: Specimen Ingestion & Result Entry (`/lab/results`)
* **Barcode Scan:** Scan blood/urine tube barcode (`LAB-SPEC-9021`).
* **Test Grid:** Pre-populates test parameters (e.g. Hemoglobin, TLC, Platelet count).
* **Panic Value Highlighter:** If Platelets < 20,000, value glows in pulsing red with automated SMS alert to the treating physician.

---

### 9. Portal 8: Telemedicine & Specialist Hub (`/teleconsult`)

#### Screen 9.1: Specialist Video Consultation Room (`/teleconsult/room/:sessionId`)
* **Video Layout:** Full WebRTC HD video (LiveKit) connecting District Specialist with rural PHC/Sub-Centre CHO and Patient.
* **Integrated EMR Drawer:** Specialist reviews live vitals, past history, and types e-Prescription directly during the video call without leaving the screen.

---

### 10. Portal 9: Grievance Redressal & Legal Compliance Portal (`/audit`)

#### Screen 10.1: DPDP Compliance & Tamper Audit Dashboard (`/audit/dashboard`)
* **Audit Chaining Verifier:** Cryptographic hash integrity checker showing 100% chain validity over 50M+ logged transactions.
* **Grievance Ticket Queue:** Citizen data correction and erasure requests with countdown SLA timer (Statutory 30 days, Internal target 7 days).
