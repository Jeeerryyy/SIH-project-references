# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 09. Government Integrations & Legacy System Bridges

**Document Reference:** `MCCPHP-DOC-09-GOV`  
**Target Gateways:** C-DAC Mobile Seva, NIC Bharat eSign, DigiLocker, e-Sanjeevani, CoWIN/U-WIN, RCH Portal, HMIS MoHFW, 108 MEMS Dispatch  
**Security Standard:** MeitY API Integration Standards, Open API Protocol, Mutual TLS (mTLS) Auth

---

### 1. Government Integration Topology

```
                                    [ MCCPHP INTEGRATION ENGINE ]
                                                  │
         ┌───────────────────┬────────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                    ▼                   ▼                   ▼
[ C-DAC Mobile Seva ]  [ NIC Bharat eSign ]  [ DigiLocker ]     [ e-Sanjeevani ]    [ 108 MEMS (Ambulance) ]
  - SMS OTP Gateway      - Aadhaar eSign       - Pull Driving     - Teleconsult       - Emergency CAD Bridge
  - WhatsApp Notify      - Digital Certs         Lic / Ration       Federation        - GPS Live Telemetry
  - DLT Registered       - Doctor Prescriptions - Push Health      - Specialist Pool  - Pre-Arrival Trauma
    Templates              & Lab Reports          Cards/Discharge                       Notification
```

---

### 2. C-DAC Mobile Seva (MSDG) SMS & WhatsApp Gateway

MCCPHP integrates with the national Mobile Seva gateway operated by C-DAC for all transaction and alert communications:

1. **DLT Entity Registration:**
   * Principal Entity: `Public Health Department, Government of Maharashtra`
   * Sender Headers: `MHGOVT`, `AROGYA`, `MCCPHP`
2. **Standard DLT Registered Message Templates:**
   * **OTP Template:** `आपला MCCPHP लॉगिन OTP {#var#} आहे. हा कोड कोणाशीही शेअर करू नका. - महाराष्ट्र शासन`
   * **OPD Token Template:** `नमस्कार {#var#}, आपला OPD टोकन क्रमांक {#var#} आहे. अंदाजे वेळ {#var#}. रुग्णालय: {#var#}. - MCCPHP`
   * **Outbreak Alert Template:** `सावधान! आपल्या परिसरात {#var#} चे रुग्ण आढळले आहेत. ताप किंवा लक्षणे असल्यास नजीकच्या PHC शी संपर्क साधा.`

---

### 3. NIC Bharat eSign (Aadhaar-Based Digital Signature)

To eliminate physical paper stamping and provide legal validity under India's IT Act 2000 (Section 3A):

1. **Doctor Signature Flow:**
   * Doctor approves e-Prescription or Inpatient Discharge Summary.
   * Clicks `[SIGN WITH BHARAT eSIGN]`.
   * An Aadhaar OTP prompt is triggered to the doctor's registered mobile.
   * NIC eSign service generates an X.509 digital certificate and embeds a cryptographic signature timestamp into the final PDF document.
2. **Offline Local Key Alternative:** For doctors working in offline OPD stations, a local hardware cryptographic USB token (PKCS#11 standard) or software RSA-2048 key can sign the document with server re-verification upon sync.

---

### 4. DigiLocker Integration (Issuer & Requester)

1. **As an Issuer (Pushing Health Documents):**
   * Automatically pushes approved **Digital Health Cards (UHID)**, **Universal Immunization Certificates**, and **Discharge Summaries** to the citizen's DigiLocker account using ABHA/Aadhaar URI linkage.
2. **As a Requester (Pulling Verification Documents):**
   * During hospital admission or BPL/PMJAY scheme empanelment, the patient can fetch verified Ration Cards, Disability Certificates, or Income Certificates directly from DigiLocker without submitting physical photocopies.

---

### 5. e-Sanjeevani National Teleconsultation Bridge

* Bidirectional synchronization between MCCPHP Telemedicine Hub and the National e-Sanjeevani 2.0 network.
* Allows a Medical Officer at a remote Melghat PHC to escalate a complex pediatric or cardiology case directly to national AIIMS / KEM Hospital specialists when state-level specialists are occupied.

---

### 6. Legacy Systems & National Data Bridges

| Legacy System | Integration Purpose | Protocol & Frequency | Direction |
|---|---|---|---|
| **CoWIN / U-WIN** | Child & Maternal Immunization history migration | REST API / Batch JSON | Bidirectional Sync |
| **RCH Portal (MoHFW)** | Reproductive & Child Health monthly indicators (ANC, High Risk, Deliveries) | XML / HTTPS Webhook | Daily Push from MCCPHP |
| **HMIS (MoHFW)** | Monthly 200-point Health Management Information System aggregate reporting | Automated CSV / REST Export | Monthly on 1st of every month |
| **e-Aushadhi** | State warehouse drug stock replenishment & batch tracking | SOAP / REST API | Hourly Stock Reconciliation |
| **108 MEMS Dispatch** | Emergency ambulance CAD (Computer-Aided Dispatch) integration | Webhook / Real-time Socket | Instant Event Trigger on Emergency Triage |

---

### 7. 108 Maharashtra Emergency Medical Services (MEMS) CAD Bridge

When a patient is triaged as 🔴 `RED_RESUSCITATION` or an inter-facility critical referral is initiated:

1. MCCPHP triggers `POST /api/v1/integrations/mems108/dispatch` with patient GPS coordinates, trauma category, and destination District Hospital.
2. 108 Emergency Control Center allocates the nearest Advanced Life Support (ALS) ambulance.
3. Live GPS telemetry of the arriving ambulance is streamed in real-time onto the Facility Admin emergency dashboard.
4. Pre-arrival clinical alerts (vitals, blood group needed, ventilator bed reserved) are flashed in the receiving trauma ICU.
