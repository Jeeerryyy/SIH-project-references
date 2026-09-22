# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 11. AI/LLM Clinical Diagnostics, Smart Prescriptions & Central Health Locker Specification

**Document Reference:** `MCCPHP-DOC-11-AI-LOCKER`  
**Core Technologies:** Medical LLM Copilot (Gemini / Med-PaLM / OpenBioLLM), Clinical Decision Support System (CDSS), Universal ABHA/UHID Identity Grid, National DigiLocker Health Gateway  
**Compliance:** ICMR Standard Treatment Guidelines, ABDM PHR v3, DPDP Act 2023, NRCeS SNOMED-CT / LOINC

---

### 1. Executive Summary & Architecture Overview

MCCPHP natively integrates three revolutionary clinical capabilities:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               MCCPHP CENTRAL HEALTH ECOSYSTEM                                    │
├──────────────────────────────────┬──────────────────────────────────┬────────────────────────────┤
│   1. SMART AUTO-PRESCRIPTIONS    │   2. AI DIAGNOSTIC COPILOT (LLM) │   3. CENTRAL HEALTH LOCKER │
│   - Standard Protocol Templates  │   - Voice-to-SOAP (Marathi/Eng)  │   - Universal ABHA & UHID  │
│   - Drug-Drug Interaction (DDI)  │   - Differential Diagnosis Gen.  │   - Lifetime Health Vault  │
│   - Weight/Age Dose Calculation  │   - Lab & X-Ray AI Screening     │   - DigiLocker Issuer/Pull │
│   - Audio/Bilingual Instructions │   - ICMR Guidelines Validator    │   - QR Scan & Share Share  │
└──────────────────────────────────┴──────────────────────────────────┴────────────────────────────┘
```

---

### 2. Feature 1: Smart Auto-Prescriptions & Clinical Decision Support (CDSS)

The e-Prescription engine is not just a digital notepad; it is an active **Clinical Decision Support System**:

```
[ Doctor Selects Diagnosis: "Acute Uncomplicated Plasmodium Vivax Malaria" ]
                           │
                           ▼
[ Auto-Prescription Engine Applies National Drug Protocol (NVBDCP / ICMR) ]
   ├── Drug 1: Tab. Chloroquine 250mg (Auto-Calculates: 4 tabs stat, 2 tabs at 6h, 24h, 48h based on 62kg weight)
   ├── Drug 2: Tab. Primaquine 15mg (Auto-Calculates: 1 tab daily x 14 days)
   └── Drug 3: Tab. Paracetamol 500mg (SOS for fever > 100°F)
                           │
                           ▼
[ Real-Time Safety & Conflict Check Engine ]
   ├── Check 1: Allergy Matrix — Patient has NO known chloroquine allergy (Passed ✅)
   ├── Check 2: Drug-Drug Interaction — Checks with patient's chronic Amlodipine (Passed ✅)
   ├── Check 3: G6PD Deficiency Warning — Prompts doctor: "Confirm G6PD status before Primaquine" ⚠️
   └── Check 4: Stock Availability — Auto-checks PHC pharmacy inventory (Batch #PQ-2026 available ✅)
                           │
                           ▼
[ Automated Patient Output Generation ]
   ├── Printable Bilingual PDF in Marathi & English
   ├── Audio Dosage Voice-Note sent via WhatsApp in Marathi ("सकाळी १ गोळी आणि संध्याकाळी १ गोळी जेवणानंतर घ्या")
   └── Real-time Barcode generated for instant 1-click pharmacy dispensing
```

#### Key Capabilities:
1. **1-Click Standard Treatment Protocol (STG) Templates:** Over 200+ pre-built protocols for common diseases in Maharashtra (Dengue, Typhoid, URTI, Hypertension, Type-2 Diabetes, Tuberculosis DOTS, Antenatal IFA + Calcium).
2. **Pediatric & Geriatric Automatic Dose Calculators:** Automatically scales dosage according to child's weight in kilograms (`mg/kg/day` divided into doses) and flags contraindicated pediatric medicines.
3. **Multi-Drug Interaction & Duplicate Therapy Guards:** Prevents dangerous drug combinations (e.g. Sildenafil + Nitrates, Clopidogrel + Omeprazole, NSAID + ACE-inhibitor triple whammy) in real time.
4. **Bilingual Dosage Translation & Audio Instructions:** Converts medical shorthand (`1-0-1 tab pc x 5d`) into clean Marathi instructions ("सकाळी १ आणि रात्री १ गोळी जेवल्यानंतर ५ दिवस घ्या") with audio read-aloud for illiterate citizens.

---

### 3. Feature 2: AI & LLMs for Clinical Diagnostics & Voice-to-EMR

MCCPHP incorporates specialized clinical AI models running on private, secure state infrastructure:

```
                                [ CLINICAL ENCOUNTER ]
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
[ 1. Voice-to-SOAP EMR Copilot ]   [ 2. Differential Diagnostic AI ]   [ 3. Lab / Radiology AI Vision ]
  - Doctor speaks Marathi/English    - Ingests Chief Complaints,       - CBC Platelet Crash Alert
  - Transcribes & cleans noise        vitals, timeline & history       - Automated Chest X-Ray TB
  - Formats into structured SOAP     - Suggests Top 3 Differentials      Screening (CAD4TB aligned)
  - Auto-maps ICD-10 & SNOMED CT     - Highlights Red-Flag Warnings    - Anemia & Sepsis Risk Score
```

#### A. Voice-to-SOAP Multi-Lingual Dictation Engine
* Medical Officers can dictate patient notes in Marathi, Hindi, or English (or code-mixed medical speech: *"Patient la 3 divasapasun fever aahe, headache and body pain aahe, no cough"*).
* The LLM parses the stream into a clean clinical encounter:
  * **Subjective:** "3-day history of acute febrile illness accompanied by generalized headache and severe myalgia. Denies cough or respiratory distress."
  * **Objective:** Vitals extracted (Temp: 101.4°F, Pulse: 94 bpm).
  * **Assessment:** ICD-10: `R50.9 | Fever, unspecified`, Differential: `38362002 | Dengue fever`.
  * **Plan:** Ordered Dengue NS1 Antigen + CBC, symptomatic antipyretics.

#### B. Differential Diagnosis & Clinical Triage Copilot
* Assists rural MBBS doctors and Community Health Officers (CHOs) at remote Sub-Centres by analyzing complex symptom combinations against ICMR treatment protocols.
* Alerts on high-risk maternal symptoms (e.g. Swelling in feet + Headache in 3rd trimester -> Flags pre-eclampsia risk, auto-orders Urine Albumin and BP monitoring).

#### C. Automated Lab & Imaging AI Pre-Screening
* **Pathology LIS:** Real-time analysis of blood counts (flags critical platelet drops in Dengue or leukocytosis in bacterial sepsis).
* **Radiology (X-Ray / Sonography):** AI-assisted automated screening for Pulmonary Tuberculosis (PTB) and pneumonia consolidation on digital X-rays to speed up diagnosis in rural tribal hospitals.

---

### 4. Feature 3: Central Health Locker & Universal Patient ID ("DigiLocker for Health")

MCCPHP provides every citizen of Maharashtra with a **permanent, lifelong, universal digital health vault**:

```
                              [ CITIZEN UNIVERSAL HEALTH IDENTITY ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [ State UHID Number ]                                 [ National ABHA ID ]
           (e.g. MH-2026-004291)                                 (14-Digit & name@abdm)
                     │                                                     │
                     └──────────────────────────┬──────────────────────────┘
                                                ▼
                             [ MCCPHP LIFETIME HEALTH DATA GRID ]
                                                │
     ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
     ▼                  ▼                       ▼                       ▼                  ▼
[ PHC Clinic ]   [ District Hospital ]   [ Private Empanelled ]    [ Diagnostic Lab ]   [ Field ASHA ]
  OPD Visit Rx     IPD Discharge           Surgery Summary           Blood/X-Ray Rep     Vaccination
     │                  │                       │                       │                  │
     └──────────────────┴───────────────────────┼───────────────────────┴──────────────────┘
                                                ▼
                              [ CITIZEN PHR & DIGILOCKER VAULT ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
        [ Citizen Portal / PWA ]                              [ National DigiLocker App ]
      - View Full Lifetime Timeline                         - Official Verifiable Health Card
      - Download Bilingual PDFs                             - Universal Immunization Cert.
      - 1-Click QR Code Record Share                        - Digital Inpatient Discharge Card
      - Time-Bound OTP Consent Access                       - Legally Valid under IT Act 2000
```

#### How the Central Health Locker Works in Practice:

1. **One Single Universal ID:**
   * Whether a patient visits a remote Sub-Centre in Gadchiroli, a District Hospital in Satara, or KEM Hospital in Mumbai, their entire history is linked to their **UHID** and **ABHA ID**.
2. **Instant Doctor Access on Consent:**
   * When the patient visits a new doctor, the doctor scans the patient's QR code or sends a 6-digit consent OTP.
   * Instantly, the doctor sees the patient's **complete chronological timeline**: past surgeries, active medications, chronic conditions (Diabetes/Hypertension), blood group, and life-threatening allergies.
   * Eliminates the need for patients to carry heavy bags of old paper prescriptions, films, and reports.
3. **National DigiLocker Synchronization:**
   * All official health documents generated in MCCPHP (UHID Digital Health Cards, Child Immunization Certificates, COVID/Routine Vaccination Records, and Hospital Discharge Summaries) are automatically pushed to the citizen's **Government of India DigiLocker** account.
   * Citizens can access their medical documents from the official DigiLocker app on any smartphone.
4. **Privacy & Data Ownership (DPDP Act 2023):**
   * The citizen owns 100% of their data.
   * They can lock sensitive records (e.g. psychiatric consults or reproductive health records), view an audit trail of every doctor who accessed their file, and revoke doctor access with a single tap.
