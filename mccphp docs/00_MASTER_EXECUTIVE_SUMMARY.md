# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 00. Master Executive Summary & Strategic Blueprint

**Document Reference:** `MCCPHP-DOC-00-EXEC`  
**Target Geography:** State of Maharashtra, India (36 Districts, 6 Administrative Divisions, 355+ Talukas, 43,000+ Villages)  
**Target Beneficiaries:** 125+ Million Citizens, 150,000+ Healthcare Workers, 50,000+ Accredited Health Facilities  
**Standard Compliance:** ABDM (M1, M2, M3), FHIR R4, DPDP Act 2023, DISHA, STQC, ISO 27001:2022, NRCeS  
**Version:** 2.0 (Production-Grade State Scale)

---

### 1. Vision & Core Philosophy

The **Maharashtra Connected Care & Public Health Platform (MCCPHP)** is an enterprise-scale, federated public health operating system designed to deliver continuous, dignified, high-quality, and transparent healthcare services to every citizen across urban, semi-urban, rural, and remote tribal terrains of Maharashtra.

Unlike fragmented hospital management systems or siloed disease tracking dashboards, MCCPHP unifies:
1. **Longitudinal Universal Health Records (UHR)** tied to Ayushman Bharat Health Account (ABHA).
2. **Tiered Clinical Encounters & Care Pathways** from Sub-Centres (Aarogya Vardhini Mandir) to District Hospitals & Medical Colleges.
3. **Field Community Health Operations** with robust offline-first synchronization for ASHA and ANM workers.
4. **Epidemiological Surveillance & Early Warning Disease Outbreak Detection (IDSP/IHIP aligned)** with automated syndromic clustering.
5. **Supply Chain & Essential Drug Inventory Management (e-Aushadhi integrated)** to prevent stockouts of life-saving medicines.
6. **State-Level Healthcare Command & Analytics Center (SHOC)** providing real-time operational telemetry to District Health Officers (DHO) and the Directorate of Health Services (DHS).

---

### 2. Maharashtra Healthcare Administrative Topology

MCCPHP is strictly modeled upon Maharashtra's administrative and public healthcare delivery hierarchy:

```
[State Level: Directorate of Health Services (DHS) / NHM Maharashtra - Mumbai]
       │
       ├── 6 Administrative Divisions: Konkan, Pune, Nashik, Aurangabad (Chhatrapati Sambhaji Nagar), Amravati, Nagpur
       │     │
       │     └── 36 Districts (Led by Civil Surgeon / District Health Officer - DHO)
       │           │
       │           ├── District Hospitals (DH - 300 to 500 beds) & Super-Specialty Hospitals
       │           ├── Sub-District Hospitals (SDH - 50 to 100 beds)
       │           └── 355+ Talukas / Blocks (Led by Taluka Health Officer - THO)
       │                 │
       │                 ├── Community Health Centres (CHC / Rural Hospitals - 30 beds)
       │                 │     │
       │                 │     └── Primary Health Centres (PHC - 6 beds, catering to 20,000-30,000 pop)
       │                 │           │
       │                 │           └── Sub-Centres / Health & Wellness Centres (HWC - 3,000-5,000 pop)
       │                 │                 │
       │                 │                 └── Village / Anganwadi Level (ASHA Worker & ANM field coverage)
       │                 │
       │                 └── Municipal Corporations (BMC, PMC, NMMC, etc.) & Urban Primary Health Centres (UPHC)
```

---

### 3. Transition: From "Aarogya Mitra Hackathon Prototype" to "MCCPHP State Platform"

| Dimension | Legacy Aarogya Mitra Prototype | Enterprise MCCPHP State Platform |
|---|---|---|
| **Architecture** | Monolithic single-app prototype with basic Express/React | High-throughput Turborepo Monorepo, 9 dedicated Micro-Portals, Modular Backend Engine, BullMQ worker pools |
| **Portals** | 1 unified single-page app with simple role switches | 9 tailored, role-specific portals (Citizen, Clinical EMR, Facility Admin, State Command/SHOC, ASHA/ANM Mobile PWA, Pharmacy, Diagnostics/Lab, Telemedicine Hub, Grievance/Audit) |
| **Database** | 10 simple tables in PostgreSQL | 58 production tables, PostgreSQL 16 + PostGIS (geospatial facilities/routing) + pgvector + Redis 7 caching + Table partitioning |
| **Authorization** | Flat role string (`role: 'DOCTOR'`) | 6D Dynamic RBAC Engine (`WHO`, `WHERE`, `WHAT`, `WHOSE`, `WHEN`, `WHY`) with emergency break-glass protocols |
| **Offline Resilience** | No offline support (crashes without internet) | Multi-master IndexedDB (Dexie.js), CRDT delta sync, background Service Worker sync, AES-256 encrypted local vault |
| **National Standards** | Simulated mock endpoints | Full ABDM M1, M2, M3 compliance, FHIR R4 Bundle generators, NRCeS SNOMED-CT / LOINC clinical coding |
| **Data Protection** | Basic JWT tokens | DPDP Act 2023 compliance, 22-language consent manager, immutable SHA-256 HMAC audit chaining, WORM storage |
| **Gov Integrations** | None | Mobile Seva / C-DAC SMS gateway, DigiLocker, Bharat eSign, e-Sanjeevani, HMIS/RCH automated bridges |
| **Infrastructure** | Localhost only | MeghRaj (NIC Cloud) / AWS GovCloud ready, Docker, Kubernetes Helm charts, Nginx reverse proxy, TLS 1.3, PgBouncer |
| **Observability** | `console.log` | Prometheus metrics, Grafana dashboards, OpenTelemetry distributed tracing, Loki log aggregation, Sentry APM |

---

### 4. High-Level System Quality Attributes & SLAs

1. **Availability:** 99.99% for Core Emergency & Clinical EMR services; 99.9% for Citizen Portal and Public Dashboards.
2. **Throughput:** Engineered to sustain 10,000+ Concurrent Requests/sec at peak OPD hours (08:00 to 13:00 IST).
3. **Response Time:** p95 latency < 150ms for OPD queue processing, < 250ms for full longitudinal record fetching.
4. **Data Durability:** Zero Data Loss (RPO < 1 minute, RTO < 15 minutes) with streaming WAL replication and off-site encrypted backups.
5. **Localization:** Triple-language native support (Marathi - प्राथमिक भाषा, Hindi, English) across all 9 portals and SMS/WhatsApp channels.
6. **Accessibility:** WCAG 2.1 Level AA compliant UI for all citizen and field worker touchpoints.

---

### 5. Document Structure of the MCCPHP Specification Suite

This subfolder (`mccphp docs`) contains the complete, authoritative, 100% gap-free blueprint for the platform:

* **`00_MASTER_EXECUTIVE_SUMMARY.md`** — Vision, State Healthcare Topology, Core Tenets (This document)
* **`01_SYSTEM_ARCHITECTURE_AND_TOPOLOGY.md`** — Monorepo layout, modular backend, event streams, caching, topology
* **`02_DATABASE_SCHEMA_MASTER_SPECIFICATION.md`** — 58 tables, DDL, indexes, triggers, PostGIS, partitioning, RLS
* **`03_API_MASTER_SPECIFICATION.md`** — 250+ endpoints, REST/Socket/FHIR APIs, payloads, error codes, contracts
* **`04_SECURITY_RBAC_AND_COMPLIANCE.md`** — 6D RBAC engine, DPDP Act 2023, DISHA, STQC, Audit log chaining
* **`05_ABDM_AND_FHIR_R4_INTEROPERABILITY.md`** — M1/M2/M3 flows, FHIR R4 Bundle mappers, SNOMED/LOINC codes
* **`06_OFFLINE_FIRST_AND_SYNC_ENGINE.md`** — IndexedDB, vector clocks, CRDT sync, encryption, conflict resolution
* **`07_PORTAL_UX_AND_SCREEN_DICTIONARY.md`** — Screen-by-screen, widget-by-widget, button-by-button UI/UX specs
* **`08_INFRASTRUCTURE_DEVOPS_AND_DEPLOYMENT.md`** — MeghRaj/Cloud, Docker, K8s, Nginx, TLS 1.3, CI/CD, Prometheus/Grafana
* **`09_GOVERNMENT_INTEGRATIONS_AND_LEGACY_BRIDGES.md`** — C-DAC SMS, eSign, DigiLocker, e-Sanjeevani, HMIS/RCH, 108 Dispatch
* **`10_PROJECT_ROADMAP_AND_EXECUTION_PLAN.md`** — 14-week phase-by-phase implementation plan and test verification matrix
