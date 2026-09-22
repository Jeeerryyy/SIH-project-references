# Enterprise Multi-Branch HMS — Operational Runbooks Directory

Welcome to the operational runbooks directory for the **Enterprise Multi-Branch, Multi-Specialty Hospital Management System (HMS)**.

These runbooks provide step-by-step diagnostic and recovery procedures for on-call engineers, DevOps operators, and platform developers during production incidents across hospital branches and clinical modules.

---

## 🚨 Incident Matrix & Severity Index

| Severity | Incident Name | Primary System | Runbook File |
|---|---|---|---|
| **P0** | Database Outage & Connection Pool Saturation | PostgreSQL 16, PgBouncer, Multi-Branch DB | [`database-outage-and-pool-exhaustion.md`](./database-outage-and-pool-exhaustion.md) |
| **P0** | CERT-In Cyber Security Incident & Data Breach | Audit Logging, Vault, DPDP 2023 / BSA 2023 | [`cert-in-security-incident-and-breach.md`](./cert-in-security-incident-and-breach.md) |
| **P1** | ABDM Gateway & FHIR R4 Record Exchange Failure | NHA ABDM Gateway, FHIR R4 Bundler, M1/M2/M3 | [`abdm-gateway-outage.md`](./abdm-gateway-outage.md) |
| **P1** | Reception Desk Offline Cache Sync & Network Drop | Branch Reception IndexedDB, BullMQ Workers | [`reception-offline-sync-and-local-cache.md`](./reception-offline-sync-and-local-cache.md) |
| **P1** | Payment Webhook & NHCX Cashless Settlement Failure | Razorpay, UPI, NHCX Claims (3-hr SLA) | [`payment-and-insurance-settlement-failure.md`](./payment-and-insurance-settlement-failure.md) |
| **P1** | Real-Time Queue & WebSocket Broadcast Outage | Socket.io, Redis Adapter, OPD/OT Big Board | [`realtime-queue-and-websocket-outage.md`](./realtime-queue-and-websocket-outage.md) |

---

## 🛡️ Critical Safety Guidelines for Operators & AI Agents

1. **Human Authorization Gates:**
   - **NEVER** promote standby databases, drop tables, execute raw database updates without idempotency keys, or perform irreversible financial adjustments without explicit human approval from the designated Lead/Commander.
2. **Statutory Clocks:**
   - **CERT-In Cyber Incident Reporting:** Mandatory within **6 hours** of detection (`cert-in-security-incident-and-breach.md`).
   - **IRDAI Cashless Claim Settlement:** Mandatory within **3 hours** of discharge authorization (`payment-and-insurance-settlement-failure.md`).
3. **Secret Hygiene:**
   - Never log or commit plaintext secrets (API keys, RSA private keys, passwords). All secrets are managed in HashiCorp Vault / AWS Secrets Manager via External Secrets Operator.

---

## 📞 Escalation Contacts & On-Call Hierarchy

- **Platform Incident Commander:** Tier 1 SRE / DevOps On-Call
- **Lead Database Administrator:** Database & Storage Infrastructure
- **Chief Information Security Officer (CISO) & DPO:** Security Incidents & CERT-In / DPDP reporting
- **Clinical Integration Lead:** ABDM / NHA & PM-JAY / NHCX Desks
- **Hospital Operations Superintendent:** Clinical workflow and branch-level failovers
