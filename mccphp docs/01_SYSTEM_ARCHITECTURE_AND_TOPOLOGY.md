# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 01. System Architecture, Topology & Monorepo Specification

**Document Reference:** `MCCPHP-DOC-01-ARCH`  
**Target Scale:** 10,000+ Concurrent Requests/sec, 125M Citizen Identities, 50k Health Facilities  
**Architecture Pattern:** Modular Monolith Backend with Event-Driven BullMQ Workers + Monorepo Multi-Portal Client Suite

---

### 1. High-Level Architectural Blueprint

```
                                  [ INTERNET / NIC NKN ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ Cloudflare / WAF ]                        [ STQC / DDoS Guard ]
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                             [ High-Availability Reverse Proxy ]
                              (Nginx / Traefik Ingress Controller)
                                             │
      ┌──────────────────────────────────────┼──────────────────────────────────────┐
      ▼                                      ▼                                      ▼
[ Citizen & Public Portals ]      [ Clinical & Staff Portals ]        [ State SHOC Command Center ]
  - citizen-portal.mh.gov.in        - clinical.mccphp.mh.gov.in         - shoc.mccphp.mh.gov.in
  - asha-pwa.mccphp.mh.gov.in       - admin.mccphp.mh.gov.in            - audit.mccphp.mh.gov.in
                                    - pharmacy.mccphp.mh.gov.in
                                    - lab.mccphp.mh.gov.in
                                    - teleconsult.mccphp.mh.gov.in
      │                                      │                                      │
      └──────────────────────────────────────┼──────────────────────────────────────┘
                                             ▼
                                [ API Gateway / Express Router ]
                                (Rate Limiter, Auth & Scope Guards,
                                  Context Injector, Audit Logger)
                                             │
    ┌────────────────────────────────────────┼────────────────────────────────────────┐
    ▼                                        ▼                                        ▼
[ Core Clinical Engine ]            [ Public Health Engine ]                 [ Interop & ABDM Engine ]
  - Patient Master Index (MPI)        - IDSP Disease Surveillance              - ABHA M1 (Create/Verify)
  - Unified Queue (OPD/IPD)           - Outbreak Clustering Alg.               - HIP M2 (FHIR Bundles)
  - EMR & Clinical Encounters         - Maternal & Child (RCH)                 - HIU M3 (Consent Fetch)
  - e-Prescription & Vitals           - ASHA Field Sync Manager                - DigiLocker / eSign
  - Bed & Facility Allocation         - Drug Inventory & e-Aushadhi            - C-DAC SMS Gateway
    │                                        │                                        │
    └────────────────────────────────────────┼────────────────────────────────────────┘
                                             ▼
                                [ Async Worker Pool (BullMQ) ]
                                 - High Priority: SMS/Email OTP, Live Alerts
                                 - Medium Priority: Offline Sync, Outbreak Scans
                                 - Low Priority: HMIS Rollups, FHIR Transformations
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        ▼                                    ▼                                    ▼
[ Primary Database Cluster ]        [ In-Memory Datastore ]              [ Specialized Engines ]
  - PostgreSQL 16 (Primary)           - Redis 7 Cluster                    - Meilisearch (MPI & Drugs)
  - Read Replicas (x2)                - Session & Rate Limit Store         - PostGIS (Spatial Routing)
  - PostGIS Spatial Extensions        - BullMQ Queue Backplane             - LiveKit SFU (Video RTC)
  - Partitioned Audit Logs            - Socket.IO Multi-Node Pub/Sub       - MinIO / S3 (Encrypted Records)
```

---

### 2. Monorepo Structural Specification (Turborepo + pnpm)

The codebase is organized as an enterprise monorepo using **Turborepo** and **pnpm workspaces**:

```
mccphp/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                          # Test, lint, typecheck on PR
│   │   ├── security-scan.yml               # SAST, Trivy, SonarQube, npm audit
│   │   ├── docker-build-publish.yml        # Build multi-arch container images
│   │   └── deploy-prod.yml                 # GitOps triggered K8s deployment
│   └── CODEOWNERS                          # Domain-level code approval policies
├── .husky/                                 # Git hooks for linting & commit standard
├── apps/                                   # ═══ 9 FRONTEND APPLICATIONS ═══
│   ├── citizen-portal/                     # Citizen health app (PWA)
│   ├── clinical-portal/                    # Doctor & Nurse EMR/OPD Station
│   ├── facility-admin-portal/              # Hospital Superintendent & RMO Admin
│   ├── state-command-portal/               # DHS / DHO / SHOC Epidemiological War Room
│   ├── asha-mobile-pwa/                    # Offline-first field worker interface
│   ├── pharmacy-portal/                    # Dispensation, batch tracking, e-Aushadhi
│   ├── diagnostic-lab-portal/              # Pathology, Radiology, Specimen workflow
│   ├── telemedicine-hub-portal/            # Specialist video consult & e-Sanjeevani
│   └── grievance-audit-portal/             # DPDP grievance, Vigilance, Tamper logs
├── packages/                               # ═══ SHARED ENTERPRISE PACKAGES ═══
│   ├── database/                           # Prisma schema, migrations, seeders, RLS
│   ├── api-client/                         # Typed TanStack React Query hooks & Axios
│   ├── ui-core/                            # Shared React UI components (MUI based)
│   ├── theme-tokens/                       # Maharashtra Gov Design System tokens
│   ├── auth-engine/                        # 6D RBAC, JWT verification, ABHA Auth
│   ├── fhir-r4/                            # FHIR R4 Bundle builders, parsers, NRCeS
│   ├── offline-engine/                     # Dexie schemas, CRDT sync, IndexedDB
│   ├── crypto-vault/                       # AES-256-GCM, SHA-256 HMAC chaining, eSign
│   ├── i18n/                               # Translations (Marathi, Hindi, English)
│   ├── validators/                         # Shared Zod validation schemas
│   └── types/                              # Canonical TypeScript interfaces & DTOs
├── services/                               # ═══ BACKEND MICROSERVICES & WORKERS ═══
│   ├── api-gateway/                        # Main Express gateway & API router
│   ├── worker-service/                     # BullMQ background job processor
│   ├── websocket-service/                  # Socket.IO distributed real-time server
│   └── fhir-bridge-service/                # HAPI FHIR connector & ABDM adapter
├── deploy/                                 # ═══ DEVOPS & INFRASTRUCTURE ═══
│   ├── docker/                             # Production Dockerfiles for all targets
│   ├── kubernetes/                         # Raw K8s manifests (Deployments, Services)
│   ├── helm/                               # Parameterized Helm charts for multi-env
│   ├── nginx/                              # Nginx reverse proxy configs + SSL/TLS
│   └── terraform/                          # Cloud infrastructure provisioning (NIC/AWS)
├── turbo.json                              # Turborepo task pipeline & caching config
├── pnpm-workspace.yaml                     # pnpm workspace definition
├── package.json                            # Root scripts & dev dependencies
└── tsconfig.base.json                      # Master strict TypeScript compiler options
```

---

### 3. Backend Module Decomposition

The backend is architected as a **Modular Monolith** with clear domain boundaries, avoiding microservice operational overhead while guaranteeing strict separation of concerns:

| Module Domain | Sub-Modules & Responsibilities | Core Dependencies |
|---|---|---|
| **Identity & Access** | Auth, ABHA verification, 6D RBAC enforcement, session management, OTP handler | `@mccphp/auth-engine`, `ioredis` |
| **Facility Management** | Hierarchy registry (DH→PHC→SC), bed capacity, roster, department routing | `@mccphp/database`, `PostGIS` |
| **Patient Master Index (MPI)** | Universal patient resolution, Aadhaar/ABHA deduplication, fuzzy soundex lookup | `Meilisearch`, `@mccphp/validators` |
| **Queue & Triage** | Multi-stage token dispatch, emergency priority, live waiting room sync | `@mccphp/database`, `Socket.IO` |
| **Clinical EMR** | Encounters, SOAP notes, ICD-10/SNOMED coding, vitals charting, clinical alerts | `@mccphp/fhir-r4`, `@mccphp/crypto-vault` |
| **e-Prescription & Pharmacy** | Drug catalogue, dosage validation, dispensation, batch/expiry alerts, e-Aushadhi | `@mccphp/database` |
| **Diagnostic & Laboratory** | Order entry, specimen barcode, LIS machine bridge, LOINC test results, PDF reports | `@react-pdf/renderer` |
| **Telemedicine Engine** | Specialist schedule, waiting room, LiveKit token generator, prescription attach | `livekit-server-sdk` |
| **ASHA Community Field** | Household survey, ANC/PNC tracking, immunization schedule, NCD screening | `@mccphp/offline-engine` |
| **IDSP Surveillance** | Syndromic case reporting, geospatial hotspot detection, outbreak alert triggers | `PostGIS`, `BullMQ` |
| **Grievance & Audit** | DPDP citizen requests, tamper-evident audit chaining, SLA breach alerts | `@mccphp/crypto-vault` |
| **Interoperability / ABDM** | M1 ABHA generation, M2 HIP data push, M3 HIU consent pull, DigiLocker push | `@mccphp/fhir-r4` |

---

### 4. Real-Time & Event-Driven Engine

1. **BullMQ Worker Queue Architecture:**
   * **`queue:otp`** — Concurrency 50; processes SMS/WhatsApp verification codes with retry backoff.
   * **`queue:sync`** — Concurrency 20; ingests batched offline mutations from ASHA mobile devices.
   * **`queue:surveillance`** — Concurrency 10; analyzes diagnostic patterns for clustering (>3 cases in 500m radius in 48h).
   * **`queue:abdm-callbacks`** — Concurrency 30; handles asynchronous ABDM webhook responses.
   * **`queue:reports`** — Concurrency 5; generates heavy PDF summaries and HMIS monthly exports.

2. **Socket.IO Scalable Cluster:**
   * Utilizing Redis Adapter (`@socket.io/redis-adapter`) to allow horizontal scaling across multiple Node.js instances.
   * Dedicated namespaces:
     * `/ws/queue` — Real-time token advancement for OPD display screens.
     * `/ws/clinical` — Instant lab result alerts and emergency bed availability broadcasts.
     * `/ws/teleconsult` — Call state, doctor online status, and chat events.
     * `/ws/surveillance` — Live outbreak alerts for District Health Officers.

---

### 5. Data Flow & Network Isolation Topology

* **DMZ (Public Zone):** Nginx Ingress Controller, Citizen Web Assets, WAF, SSL Termination.
* **Application Zone (Private Subnet):** Express API instances, BullMQ workers, WebSocket servers. No direct public IP.
* **Data Zone (Secure Subnet):** PostgreSQL Cluster, Redis Cluster, MinIO Object Storage, Vault. Strict security group ingress only from Application Zone.
* **Management & Interop Zone:** ABDM Gateway tunnel, C-DAC SMS Gateway tunnel, Prometheus/Grafana internal metrics plane.
