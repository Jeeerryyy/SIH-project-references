# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 10. Project Roadmap, Execution Plan & Verification Matrix

**Document Reference:** `MCCPHP-DOC-10-ROADMAP`  
**Execution Timeline:** 14-Week Accelerated State-Scale Engineering Sprint  
**Target Quality Gate:** 100% Automated Test Passing, STQC Readiness, Zero Critical/High CVEs, 10k RPS Load Verified

---

### 1. 14-Week Phase-by-Phase Execution Roadmap

```
Week  1 - 2  : [Phase 0: Foundation & Monorepo Setup]
               Turborepo, PostgreSQL 16 + PostGIS, Prisma 58 Tables, 6D Auth Engine, Design Tokens
Week  3 - 4  : [Phase 1: Backend Core Services & Redis Backplane]
               40 Route Controllers, 250+ APIs, BullMQ Worker Pools, Socket.IO Cluster, Zod Validation
Week  5 - 7  : [Phase 2: 9 Frontend Portals Engineering]
               Citizen, Clinical EMR, Admin, SHOC War Room, ASHA PWA, Pharmacy, Lab, Teleconsult, Audit
Week  8 - 9  : [Phase 3: ABDM Interop & Offline-First Sync Engine]
               ABHA M1/M2/M3 Gateway, FHIR R4 Bundle Generators, Dexie.js, CRDT Sync Protocol
Week 10 - 11 : [Phase 4: Government Gateways & Legacy Bridges]
               Mobile Seva SMS, NIC Bharat eSign, DigiLocker, e-Sanjeevani, 108 Ambulance Dispatch, HMIS
Week 12      : [Phase 5: Security Hardening, DPDP Act & STQC Readiness]
               WAF, TLS 1.3, SHA-256 Chaining, DPDP Grievance Portal, Pentesting, SAST/DAST Scans
Week 13 - 14 : [Phase 6: Load Testing, Pilot Deployment & Disaster Recovery Drills]
               k6 10,000 RPS Benchmarks, SDC Pune / Mumbai Deployment, Gadchiroli/Pune District Pilot
```

---

### 2. Comprehensive Quality Verification & Testing Matrix

#### A. Automated Testing Pipeline
1. **Unit & Logic Testing (Vitest):**
   * Target: >85% code coverage across all shared packages (`@mccphp/auth-engine`, `@mccphp/fhir-r4`, `@mccphp/offline-engine`).
   * Command: `pnpm turbo run test`
2. **API Integration & Contract Testing (Supertest + Vitest):**
   * 250+ endpoints validated against Zod schemas, 6D scope rules, and RBAC matrix.
   * Command: `pnpm --filter @mccphp/api-gateway test:e2e`
3. **End-to-End User Journeys (Playwright):**
   * Multi-portal E2E tests simulating real clinical workflows:
     * *Journey 1:* Citizen books OPD slot -> Registration token issued -> Doctor reviews SOAP & writes Rx -> Pharmacist dispenses medicine.
     * *Journey 2:* ASHA registers offline pregnant mother in tribal area -> Records ANC visits -> Syncs to PHC cloud upon network detection.
     * *Journey 3:* Doctor requests historical ABDM record -> Patient grants consent -> FHIR bundle decrypted and rendered in EMR.
   * Command: `pnpm exec playwright test`

---

### 3. High-Load Performance & Scalability Benchmarks (k6)

| Scenario | Target Concurrency | Target Throughput | Target Latency | Pass Criteria |
|---|---|---|---|---|
| **OPD Morning Surge** | 5,000 concurrent users | 8,000 req/sec | p95 < 120ms | 0% Error Rate |
| **Token Queue Advancement** | 2,000 concurrent sockets | 10,000 events/sec | Broadcast < 50ms | Zero dropped messages |
| **Field Batch Sync (ASHA)** | 1,000 concurrent workers | 2,000 sync batches/sec | Response < 350ms | 100% Conflict Resolution |
| **Longitudinal Record Fetch**| 3,000 concurrent doctors | 4,000 req/sec | p95 < 200ms | 100% FHIR Bundle Integrity |

* **Load Test Script Execution:** `k6 run deploy/load-tests/state-opd-surge.js --vus 5000 --duration 10m`

---

### 4. Security Auditing, SAST/DAST & STQC Compliance Gate

1. **Static Application Security Testing (SAST):**
   * SonarQube & Trivy scan on every PR: Zero Critical / Zero High vulnerabilities permitted.
2. **Dynamic Application Security Testing (DAST):**
   * OWASP ZAP automated vulnerability crawler targeting all 9 portals and API Gateway.
3. **Secret Leak Detection:**
   * Gitleaks pre-commit hooks preventing any API keys or credentials from entering Git history.
4. **STQC Certification Readiness Checklist:**
   * Certified compliance against standard STQC Software Application Security Guidelines.

---

### 5. Disaster Recovery & Zero-Data-Loss Failover Runbook

1. **RPO / RTO Targets:** RPO < 1 minute (Zero Data Loss); RTO < 15 minutes.
2. **Simulated SDC Mumbai Outage (Drill Protocol):**
   * Step 1: Health check monitor detects primary Mumbai SDC failure (>3 consecutive 5xx probes).
   * Step 2: Global DNS Traffic Manager (GSLB) automatically shifts traffic to Pune SDC endpoint.
   * Step 3: PostgreSQL Standby in Pune is promoted to Primary: `SELECT pg_promote();`.
   * Step 4: Redis Sentinel triggers automatic master failover.
   * Step 5: Platform resumes 100% operational capacity with zero manual intervention.
