# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 12. CDSS Engine, Structured SOAP Clinical Framework & Local/Edge Offline AI Specification

**Document Reference:** `MCCPHP-DOC-12-CDSS-SOAP-EDGE`  
**Target Environments:** Tertiary Hospitals, Rural PHCs, Remote Tribal Sub-Centres (HWCs), and Offline ASHA Tablets  
**Clinical Standards:** HL7 FHIR R4 Clinical Impression & Composition, WHO/ICMR Standard Treatment Workflows, SNOMED CT, ICD-10, LOINC  
**AI Runtime:** Hybrid Cloud LLM + Local Edge Quantized AI (ONNX Runtime Web, WebGPU, Local WASM CDSS)

---

### 1. Architectural Overview: The 4-Tier CDSS & Clinical Intelligence Grid

MCCPHP implements a **4-Tier Clinical Decision Support System (CDSS)** that functions both online in cloud mode and offline in remote field mode:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MCCPHP 4-TIER CDSS ARCHITECTURE                                     │
├────────────────────────────────┬────────────────────────────────┬──────────────────────────────────────┤
│ TIER 1: DETERMINISTIC GUARDS   │ TIER 2: PROTOCOL ENGINES       │ TIER 3: EARLY WARNING SCORES (EWS)   │
│ - Drug-Drug Interactions (DDI) │ - ICMR / NVBDCP Standard Tx    │ - NEWS2 (National Early Warning)     │
│ - Severe Allergy Contraindic.  │ - National Health Prog. (NTEP) │ - qSOFA (Quick Sepsis Assessment)    │
│ - Weight/eGFR Dose Limits      │ - Maternal High-Risk Pathways  │ - MEWS (Modified Early Obstetric)    │
├────────────────────────────────┴────────────────────────────────┴──────────────────────────────────────┤
│ TIER 4: AI/LLM DIAGNOSTIC COPILOT & VOICE SOAP TRANSCRIPTION (Online Cloud + Local Offline Edge)       │
│ - Cloud Mode: Multilingual Medical LLM (Differential Diagnosis, Report Interpretation, ICD-10 Mapping) │
│ - Edge Offline Mode: ONNX / WASM Quantized Models running directly on browser/device with ZERO internet│
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Comprehensive Structured SOAP Clinical Documentation Framework

Every clinical interaction (OPD, IPD, Emergency, Telemedicine, or Field Camp) is anchored in the international **SOAP (Subjective, Objective, Assessment, Plan)** standard:

```
                         ┌─────────────────────────────────────────┐
                         │       STRUCTURED SOAP CLINICAL EMR      │
                         └────────────────────┬────────────────────┘
                                              │
         ┌───────────────────┬────────────────┴───────────────────┬───────────────────┐
         ▼                   ▼                                    ▼                   ▼
    SUBJECTIVE           OBJECTIVE                            ASSESSMENT             PLAN
  - Chief Complaints   - Vitals Telemetry (IoT / Manual)   - ICD-10 Diagnoses   - e-Prescription (CDSS)
  - History (HPI)      - Physical Exam Checklists          - SNOMED CT Findings - Lab / Imaging Orders
  - Past Medical Hx    - Lab & Diagnostic Reports          - Risk Stratification- Diet & Lifestyle
  - Allergies & Meds   - Point-of-Care Blood/Urine Tests   - Differential List  - Tiered Referral / F/up
```

#### Detailed SOAP Module Breakdown:

```typescript
export interface StructuredSOAPEncounter {
  encounterId: string;
  uhid: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  
  // 1. SUBJECTIVE (रुग्णाची लक्षणे व तक्रारी)
  subjective: {
    chiefComplaints: Array<{
      symptom: string; // e.g. "ताप (Fever)", "खोकला (Cough)"
      durationValue: number;
      durationUnit: 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS';
      severity: 'MILD' | 'MODERATE' | 'SEVERE';
    }>;
    historyOfPresentIllness: string;
    pastMedicalHistory: string[]; // ["Hypertension x 5 yrs", "Type 2 Diabetes"]
    surgicalHistory?: string;
    familyHistory?: string;
    knownAllergies: Array<{ allergen: string; severity: 'MILD' | 'SEVERE' | 'ANAPHYLAXIS' }>;
    currentMedications: Array<{ drugName: string; dosage: string }>;
  };

  // 2. OBJECTIVE (वैद्यकीय तपासणी व निरीक्षणे)
  objective: {
    vitals: {
      systolicBpMmHg: number;
      diastolicBpMmHg: number;
      pulseBpm: number;
      temperatureFahrenheit: number;
      spo2Percent: number;
      respiratoryRateBpm: number;
      bloodGlucoseMgDl?: number;
      weightKg: number;
      heightCm: number;
      bmi: number;
    };
    generalExamination: {
      pallor: boolean;
      icterus: boolean;
      cyanosis: boolean;
      clubbing: boolean;
      lymphadenopathy: boolean;
      edema: boolean;
    };
    systemicExamination: {
      respiratorySystemFindings?: string; // "Bilateral air entry equal, clear"
      cardiovascularFindings?: string;    // "S1 S2 heard, no murmurs"
      perAbdomenFindings?: string;        // "Soft, non-tender, no organomegaly"
      centralNervousSystem?: string;      // "Conscious, oriented to time, place, person"
    };
    diagnosticReportsAttached: Array<{ reportType: string; summaryFindings: string }>;
  };

  // 3. ASSESSMENT (रोग निदान व विश्लेषण)
  assessment: {
    primaryDiagnosis: {
      icd10Code: string; // e.g. "A90"
      icd10Display: string; // "Dengue fever [classical dengue]"
      snomedConceptId?: string; // "38362002"
      certainty: 'CONFIRMED' | 'PROVISIONAL' | 'SUSPECTED';
    };
    differentialDiagnoses: Array<{ icd10Code: string; icd10Display: string; likelihood: 'HIGH' | 'MEDIUM' | 'LOW' }>;
    comorbidities: string[];
    clinicalRiskScore: {
      scoreType: 'NEWS2' | 'MEWS' | 'qSOFA' | 'CBAC';
      calculatedScore: number;
      riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_CRITICAL_RISK';
    };
    notifiableDiseaseAlert: boolean; // Triggers instant IDSP surveillance hook
  };

  // 4. PLAN (उपचार योजना व कृती)
  plan: {
    medications: Array<{
      drugId: string;
      genericName: string;
      dosageInstructions: string; // "1-0-1"
      frequency: string; // "TWICE_A_DAY"
      durationDays: number;
      totalQuantity: number;
      foodRelation: 'AFTER_FOOD' | 'BEFORE_FOOD';
      marathiInstructionText: string; // "सकाळी १ आणि रात्री १ गोळी जेवणानंतर घ्या"
    }>;
    diagnosticOrders: Array<{ testCode: string; testName: string; priority: 'STAT' | 'ROUTINE' }>;
    dietaryAndLifestyleAdvice: string;
    referralDetails?: {
      targetFacilityId: string;
      targetFacilityName: string;
      referralSpecialty: string;
      urgency: 'EMERGENCY_AMBULANCE' | 'ROUTINE_SPECIALIST';
      clinicalReason: string;
    };
    followUpDate?: string; // "2026-09-15"
    doctorDigitalSignature: string; // Cryptographic Bharat eSign / PKCS#11 hash
  };
}
```

---

### 3. Clinical Decision Support System (CDSS) Rules & Alerting Matrix

When the clinician interacts with the SOAP interface, the **CDSS Engine** runs asynchronous background validation across several safety dimensions:

| CDSS Safety Dimension | Trigger Condition | Real-Time CDSS Action | Severity Level |
|---|---|---|---|
| **Drug-Allergy Clash** | Doctor prescribes `Amoxicillin` to patient with recorded `Penicillin Allergy` | **Hard Stop Modal:** "घातक ऍलर्जी इशारा! रुग्णाला पेनिसिलिन ऍलर्जी आहे. तात्काळ औषध बदला." Requires explicit override reason to proceed. | 🔴 CRITICAL (Hard Stop) |
| **Dangerous Drug-Drug Interaction (DDI)** | Doctor prescribes `Tab. Warfarin` while patient is on `Tab. Aspirin` | **Warning Alert:** "रक्तस्रावाचा उच्च धोका (High Bleeding Risk)! Warfarin + Aspirin combination detected." | 🟠 HIGH WARNING |
| **Pediatric Weight Overdose** | Doctor enters adult dose of `Syrup Paracetamol` for a 12kg toddler | **Auto-Correction Prompt:** "वजनानुसार शिफारस केलेले प्रमाण: 180mg (15mg/kg). आपण प्रविष्ट केलेले प्रमाण जास्त आहे." | 🟠 HIGH WARNING |
| **Renal Impairment Warning** | Doctor prescribes `Metformin` or `Gentamicin` to patient with Serum Creatinine > 2.5 mg/dL | **Dose Adjustment Advice:** "मूत्रपिंड कार्य मंदावले आहे (Impaired Renal Function). डोस 50% कमी करा किंवा औषध बदला." | 🟡 MEDIUM CAUTION |
| **Maternal Sepsis / Pre-eclampsia Alert** | Pregnant mother's vitals: BP > 150/100 mmHg + Albumin in urine | **Instant Referral Dispatch:** "धोकादायक उच्च रक्तदाब! Pre-eclampsia संशयित. तत्काळ उपजिल्हा/जिल्हा रुग्णालयात पाठवा." | 🔴 CRITICAL ACTION |
| **Dengue Platelet Crash Alert** | Lab reports Platelets < 20,000 / $\mu$L | **SMS & Push Alert:** Treating doctor and Blood Bank notified instantly for platelet concentrate arrangement. | 🔴 CRITICAL ALERT |

---

### 4. Offline & Local Edge AI Models (Zero-Internet Remote Operations)

In remote tribal regions of Maharashtra (e.g. Gadchiroli, Nandurbar, Melghat forests) where internet connectivity is completely unavailable:

```
                                [ ASHA TABLET / PHC LAPTOP (OFFLINE) ]
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                ▼                                 ▼                                 ▼
   [ 1. In-Browser WASM CDSS ]        [ 2. Quantized Edge LLM / Vision ]   [ 3. Dexie.js Local Vector DB ]
   - Deterministic drug safety rules   - ONNX Runtime Web / WebGPU          - Fast offline patient fuzzy lookup
   - Pediatric dosing math formulas    - Local Respiratory Sound / X-Ray    - ICD-10 & SNOMED search index
   - Clinical risk score calculations    anomaly detector                   - Marathi voice vocabulary cache
   - Zero internet dependency          - Sub-second local inference         - Zero internet dependency
```

#### A. In-Browser WebAssembly (WASM) CDSS Engine
* The core safety algorithms (DDI, allergy checks, dosage scaling, NEWS2 scoring) are compiled into a lightweight **WebAssembly binary (~1.2 MB)**.
* Stored permanently inside the PWA Cache.
* Runs on the client device in **< 5 milliseconds** with zero server round-trip, guaranteeing 100% CDSS protection even on airplane mode.

#### B. Local On-Device AI Models via ONNX Runtime Web & WebGPU
1. **ASHA Offline Child Pneumonia Breath Counter & Chest Indrawing AI:**
   * ASHA opens camera/microphone in offline PWA.
   * Lightweight quantized vision/audio model (MobileNetV4 / EdgeSpeech) counts breaths per minute and flags rapid breathing (Tachypnea) conforming to IMNCI guidelines.
2. **Offline Voice-to-Text Clinical Transcription:**
   * Local quantized Whisper-Tiny / IndicASR model running via WebAssembly in the browser.
   * Transcribes Marathi and English medical terms offline, saving time for doctors during busy village health camps.
3. **Local Vector Search on Device:**
   * Embedded SQLite/IndexedDB vector store allows doctors to search 50,000+ medical terms and ICD-10 codes instantly offline with typo-tolerant fuzzy matching.

---

### 5. Automated Conversion of SOAP Notes to ABDM FHIR R4 Bundles

When the clinician clicks **[SIGN & COMPLETE WITH eSIGN]**, the platform automatically compiles the completed SOAP note into an official **FHIR R4 Composition & Encounter Bundle**:

* `Subjective` -> Maps to FHIR `Condition` (Chief Complaint) + `AllergyIntolerance` + `FamilyMemberHistory`.
* `Objective` -> Maps to FHIR `Observation` resources (coded with LOINC for vitals & lab values).
* `Assessment` -> Maps to FHIR `DiagnosticReport` + `Condition` (ICD-10/SNOMED CT primary & secondary diagnoses).
* `Plan` -> Maps to FHIR `MedicationRequest` (Prescription) + `ServiceRequest` (Lab/Radiology orders) + `CarePlan`.

This guarantees that every clinical record authored in MCCPHP is immediately 100% interoperable across all hospitals in India via the ABDM national grid.
