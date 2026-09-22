# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 13. Electronic Prescription (eRx) Master Specification

**Document Reference:** `MCCPHP-DOC-13-ERX`  
**Standard Compliance:** ABDM NRCeS FHIR R4 MedicationRequest, Drugs and Cosmetics Rules (Schedule H/H1/X), IT Act 2000 Section 3A (Bharat eSign)  
**Drug Catalogue Baseline:** Maharashtra Essential Drug List (EDL), e-Aushadhi State Warehouse Registry, NLEM  
**Security & Anti-Counterfeiting:** Cryptographic QR Code Verification, Chained Audit, Tamper-Evident Digital Signatures

---

### 1. eRx Lifecycle & Operational Workflow

The **eRx (Electronic Prescription)** subsystem in MCCPHP replaces paper prescriptions with a fully automated, legally valid, and digitally secured medication cycle:

```
[ 1. Clinical Consultation ] ──► [ 2. CDSS & Safety Validation ] ──► [ 3. Digital Signing (eSign) ]
  - Doctor picks generic drug       - Drug-Drug Interaction check      - Doctor signs with Bharat eSign
  - Selects dosage (1-0-1, 5 days)  - Allergy matrix verification      - Generates immutable PDF & QR
  - Adds Marathi instructions       - Weight/renal dose scaling        - ABDM FHIR R4 bundle compiled
              │                                                                     │
              ▼                                                                     ▼
[ 6. Adherence & Follow-up ] ◄─── [ 5. Pharmacy Dispensation ] ◄─── [ 4. Multi-Channel Dispatch ]
  - WhatsApp audio reminders        - 1-Click barcode scan             - Real-time push to Citizen Portal
  - Pharmacovigilance / ADR log     - Batch & expiry validation        - Automated sync to DigiLocker
  - Refill notifications            - Stock auto-decremented           - WhatsApp PDF + Marathi Voice Note
```

---

### 2. eRx Data Model & FHIR R4 Structure

Every electronic prescription generated contains standard structured data attributes:

```typescript
export interface ElectronicPrescription {
  prescriptionNumber: string; // e.g. "RX-MH-2026-0098421"
  encounterId: string;
  uhid: string; // Patient Universal Health ID
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  patientWeightKg: number;
  
  // Prescribing Practitioner Metadata
  prescribedBy: {
    doctorName: string;
    hprId: string; // Healthcare Professional Registry ID
    medicalRegistrationNumber: string; // MMC (Maharashtra Medical Council) Reg No.
    facilityName: string;
    facilityHfrId: string;
  };
  
  // Prescribed Medication Line Items
  items: Array<{
    drugId: string;
    genericName: string; // e.g. "Tab. Paracetamol IP"
    brandName?: string;  // e.g. "Crocin / Dolo"
    dosageForm: 'TABLET' | 'CAPSULE' | 'SYRUP' | 'INJECTION' | 'OINTMENT' | 'DROPS' | 'INHALER';
    strength: string; // e.g. "500 mg"
    scheduleCategory: 'GENERAL' | 'SCHEDULE_H' | 'SCHEDULE_H1' | 'SCHEDULE_X';
    dosagePattern: '1-0-1' | '1-1-1' | '1-0-0' | '0-0-1' | 'SOS_AS_NEEDED';
    frequencyDisplayEn: string; // "Twice daily after meals"
    frequencyDisplayMr: string; // "दिवसातून २ वेळा जेवणानंतर"
    durationDays: number; // e.g. 5
    totalQuantityPrescribed: number; // e.g. 10 tablets
    foodRelation: 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_FOOD' | 'EMPTY_STOMACH';
    specialInstructions?: string;
  }>;
  
  // Clinical Safety & Governance Flags
  safetyChecksPassed: boolean;
  cdssWarningsAcknowledged?: string[];
  digitalSignatureHash: string; // X.509 SHA-256 digital signature
  signedAt: string; // ISO 8601 Timestamp
  qrCodeVerificationUrl: string; // https://verify.mccphp.mh.gov.in/rx/RX-MH-2026-0098421
  dispensationStatus: 'PENDING' | 'PARTIALLY_DISPENSED' | 'FULLY_DISPENSED' | 'CANCELLED';
}
```

---

### 3. Anti-Counterfeiting & Legal Validity Features

1. **Bharat eSign Legal Compliance:** Under India's **Information Technology Act 2000 (Section 3A)** and **Pharmacy Practice Regulations**, electronic prescriptions signed using Aadhaar OTP / digital token certificates carry the same legal authority as handwritten physical ink signatures.
2. **Encrypted Verification QR Code:**
   * Every eRx PDF includes a high-density, tamper-proof QR code.
   * Any pharmacist (government or private retail) can scan the QR code with any smartphone camera to verify that the prescription was authentically issued by an active MMC-registered doctor and has not been altered or fraudulently reused.
3. **Controlled Substances / Schedule H1 & X Tracking:**
   * Narcotics and habit-forming antibiotics require mandatory 2-factor authentication before signing.
   * The system prevents unauthorized refills and logs every dispensation with pharmacist identity and timestamp for state drug inspectors.

---

### 4. Patient-Centric & Multi-Lingual Delivery

1. **Digital Health Locker Synchronization:** Immediately available in the citizen's **Citizen Health Portal** app and auto-pushed to their **National DigiLocker** account.
2. **Marathi & Hindi Audio Read-Aloud:** For rural or illiterate citizens, clicking the audio button on their phone plays a spoken voice message in Marathi:
   > *"नमस्कार श्री. रमेश पवार, डॉक्टरांनी आपल्याला पॅरासिटामॉल ५०० मि.ग्रॅ. लिहून दिली आहे. ही गोळी ५ दिवस सकाळ-संध्याकाळ जेवणानंतर १-१ घ्यायची आहे."*
3. **Automated WhatsApp Delivery:** An official WhatsApp message with a downloadable bilingual PDF is delivered to the patient's registered mobile number within 5 seconds of the doctor signing the encounter.

---

### 5. Hospital Pharmacy Integration & e-Aushadhi Auto-Decrement

* **Zero Paperwork Dispensing:** When the patient reaches the hospital pharmacy counter, the pharmacist scans the patient's token or UHID barcode.
* **Batch Auto-Allocation:** The system matches the prescribed items to the nearest-to-expiry (FEFO - First Expiry, First Out) batch in stock.
* **Automatic Stock Ledger Decrement:** Dispensing 10 tablets instantly updates the hospital inventory and synchronizes with the state **e-Aushadhi warehouse network**.
