# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## Unified Master Project Repository & Interactive UI Suite

**Target Geography:** State of Maharashtra, India (36 Districts, 6 Divisions, 355+ Talukas, 43,000+ Villages)  
**Scale:** 125+ Million Citizens, 150,000+ Healthcare Workers, 50,000+ Accredited Health Facilities  
**Standards:** ABDM (M1, M2, M3), FHIR R4, DPDP Act 2023, DISHA, STQC, ISO 27001:2022, NRCeS  

---

### 1. Unified Directory Organization

```
mccphp/
├── docs/                                    # ═══ MASTER SPECIFICATION SUITE ═══
│   ├── 00_MASTER_EXECUTIVE_SUMMARY.md      # Vision, State Topology & Philosophy
│   ├── 01_SYSTEM_ARCHITECTURE_AND_TOPOLOGY.md # Monorepo, Microservices & Dataflow
│   ├── 02_DATABASE_SCHEMA_MASTER_SPECIFICATION.md # 58 Tables, DDL & Indexes
│   ├── 03_API_MASTER_SPECIFICATION.md      # 250+ REST & WebSocket Contracts
│   ├── 04_SECURITY_RBAC_AND_COMPLIANCE.md  # 6D Authorization & DPDP 2023
│   ├── 05_ABDM_AND_FHIR_R4_INTEROPERABILITY.md # M1, M2, M3 & FHIR R4 Bundles
│   ├── 06_OFFLINE_FIRST_AND_SYNC_ENGINE.md # IndexedDB, Dexie & CRDT Sync
│   ├── 07_PORTAL_UX_AND_SCREEN_DICTIONARY.md # 9 Dedicated Frontend Portals
│   ├── 08_INFRASTRUCTURE_DEVOPS_AND_DEPLOYMENT.md # MeghRaj, K8s, Docker & CI/CD
│   ├── 09_GOVERNMENT_INTEGRATIONS_AND_LEGACY_BRIDGES.md # C-DAC, DigiLocker, eSign, 108
│   ├── 10_PROJECT_ROADMAP_AND_EXECUTION_PLAN.md # 14-Week Execution Plan
│   ├── 11_AI_LLM_DIAGNOSTICS_AND_SMART_PRESCRIPTIONS.md # Medical LLM & Central Locker
│   ├── 12_CDSS_SOAP_FRAMEWORK_AND_LOCAL_EDGE_AI.md # 4-Tier CDSS & Structured SOAP
│   └── 13_ELECTRONIC_PRESCRIPTION_ERX_MASTER_SPECIFICATION.md # eRx & Bharat eSign
│
├── assets/                                  # ═══ REFERENCE DESIGN ASSETS ═══
│   ├── dashboard ui.jpeg                   # Layout Reference: Clinical Dashboard
│   ├── follow up process.jpeg              # Layout Reference: Timeline Stepper
│   └── QUEUE Ticket.jpeg                   # Layout Reference: Boarding Pass Ticket
│
└── demo/                                    # ═══ INTERACTIVE UI SUITE (HTML/CSS/JS) ═══
    ├── index.html                           # Master Demo Hub & Navigation Portal
    ├── dashboard.html                       # Clinical & OPD Assessment Station
    ├── followup.html                        # Longitudinal Care Pathway Timeline
    ├── queue-ticket.html                    # OPD Emergency Boarding Pass Ticket
    ├── css/
    │   ├── theme.css                        # Shared design system & tokens
    │   ├── dashboard.css                    # Multi-step builder & data table styles
    │   ├── followup.css                     # Stepper track, milestones & flags
    │   └── queue-ticket.css                 # Perforated card, QR code & header styles
    └── js/
        ├── dashboard.js                     # 5-state switcher, rating scales & filters
        ├── followup.js                      # Timeline node clicks & tab switching
        └── queue-ticket.js                  # Token simulation & print/DigiLocker actions
```

---

### 2. How to Run the Interactive UI Demo

All demo pages are pure HTML/CSS/JS and require no build tools:
1. Open [`mccphp/demo/index.html`](file:///e:/SIH/SIH%20Demo%20with%20Audit%20and%20research/mccphp/demo/index.html) in any modern web browser to access the master showcase hub.
2. Directly open:
   * [`dashboard.html`](file:///e:/SIH/SIH%20Demo%20with%20Audit%20and%20research/mccphp/demo/dashboard.html) to interact with the 5 clinical assessment builder states.
   * [`followup.html`](file:///e:/SIH/SIH%20Demo%20with%20Audit%20and%20research/mccphp/demo/followup.html) to experience the longitudinal care timeline.
   * [`queue-ticket.html`](file:///e:/SIH/SIH%20Demo%20with%20Audit%20and%20research/mccphp/demo/queue-ticket.html) to view the perforated OPD emergency ticket with QR verification.
