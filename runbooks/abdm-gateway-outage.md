# Incident: ABDM Gateway Outage and FHIR R4 Record Exchange Failure

## Purpose
Operational recovery and degradation mitigation guide for failures involving the Ayushman Bharat Digital Mission (ABDM) National Gateway, ABHA ID verification/linking, Health Facility Registry (HFR) / Healthcare Professionals Registry (HPR) checks, and HL7 FHIR R4 health record exchange (HIP/HIU roles).

## Impact
- **Affected Features:** ABHA creation/verification at OPD front desks, cross-hospital medical record exchange via ABDM Consent Manager, and PM-JAY scheme beneficiary eligibility lookups.
- **Unaffected Systems:** Local OPD consultations, emergency triage, IPD admissions, local e-prescriptions, surgeries, and billing remain fully functional via local patient IDs.

## Symptoms
- Outgoing API calls to ABDM Gateway returning HTTP `504 Gateway Timeout`, `502 Bad Gateway`, or `ECONNRESET`.
- ABDM callback endpoints (e.g., `/api/v1/abdm/v0.5/consent/requests/on-init`, `/api/v1/abdm/v0.5/users/auth/on-init`) timing out.
- Front desk staff reporting delays when scanning ABHA QR codes or initiating OTP verification.
- Prometheus metric `abdm_request_duration_seconds` exceeding 5 seconds with an error rate > 20%.

## Severity
**P1 — Serious Operational Degradation (Local Clinical Core Resilient)**

## Immediate Actions
> [!IMPORTANT]
> **SAFE AUTOMATION vs REQUIRES HUMAN APPROVAL**
> - *Safe to automate:* Engaging the ABDM circuit breaker to enable Graceful Fallback Mode; queueing outgoing FHIR R4 bundles in BullMQ.
> - *Requires human approval:* Disabling mandatory ABHA validation at hospital reception desks for non-scheme patients.

1. **Engage ABDM Circuit Breaker:**
   - Trip the circuit breaker to prevent reception desk stalls. Front desk staff automatically continue patient registration using Phone/National ID with a local hospital MRN.
2. **Buffer Outgoing FHIR Bundles:** Ensure the BullMQ FHIR export queue is buffering care context links and FHIR R4 bundles rather than dropping them:
   ```bash
   redis-cli -u "$REDIS_URL" LLEN "bullmq:abdm-fhir-export:wait"
   ```

## Diagnosis
1. **Check ABDM Gateway Liveness & Token Status:**
   ```bash
   curl -X POST "https://api.hms-group.in/api/v1/abdm/health-check" \
     -H "Content-Type: application/json"
   ```

2. **Verify ABDM Client Certificate & RSA Key Validity:**
   - Check if the ABDM private key or client secret in HashiCorp Vault is nearing expiration.
   - Verify outbound NAT Gateway IP addresses match the whitelist registered with the National Health Authority (NHA).

3. **Inspect ABDM Module Error Logs:**
   ```bash
   kubectl logs -n hms-prod deployment/abdm-service --tail=200 | grep -i "gateway error"
   ```

4. **Check Official ABDM Status Announcements:**
   - Verify if NHA has scheduled maintenance on the ABDM Sandbox/Production gateway.

## Recovery

### Scenario A: ABDM Session Token Expired / Invalidated
1. Force session token renewal against the ABDM authentication server:
   ```bash
   kubectl exec -it -n hms-prod deploy/abdm-service -- node scripts/refresh-abdm-token.js
   ```
2. Verify `POST /v0.5/sessions` succeeds and returns a fresh JWT access token.

### Scenario B: National ABDM Gateway Downtime
1. Maintain **Local-First Queueing**:
   - All consultation notes, lab reports, and prescriptions generated during the outage are assigned a local care context with status `PENDING_ABDM_SYNC`.
2. Configure BullMQ worker with exponential backoff retry (30s, 60s, 300s, 900s).
3. Once gateway connectivity is restored, trigger batch re-sync:
   ```bash
   kubectl exec -it -n hms-prod deploy/bullmq-abdm-worker -- node scripts/resume-fhir-sync.js
   ```

## Validation
1. Test ABHA resolution endpoint:
   ```bash
   curl -X POST "https://api.hms-group.in/api/v1/abdm/v0.5/patients/profile/share" \
     -H "Content-Type: application/json" \
     -d '{"healthId": "test.patient@abdm"}'
   ```
2. Confirm the BullMQ FHIR export queue is draining steadily:
   ```bash
   redis-cli -u "$REDIS_URL" LLEN "bullmq:abdm-fhir-export:wait"
   ```
3. Verify the ABDM gateway status indicator on the OPD Front Desk panel displays green.

## Rollback
- If local offline mode was engaged via feature flag, reset the flag once the gateway is stable:
  ```bash
  curl -X POST "https://api.hms-group.in/api/v1/admin/config/flags" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{"ABDM_CIRCUIT_BREAKER_FORCE_OPEN": false}'
  ```

## Escalation
- **Escalate to:** Clinical Integration Lead & NHA ABDM Technical Support Desk (`ndhm@nha.gov.in`).
- **Escalation Threshold:** ABDM gateway error persists > 30 minutes during morning OPD registration hours (08:00–14:00 IST).

## Do Not
- **DO NOT** turn away patients or halt OPD consultation ticket issuance due to ABDM Gateway downtime. Emergency and routine clinical care must always proceed with temporary local IDs.
- **DO NOT** delete failed FHIR bundle messages from the Dead Letter Queue (DLQ). All clinical encounters must synchronize for ABDM M1/M2/M3 compliance once connectivity resumes.

## Root Cause Follow-Up
- Verify whether the issue was an upstream NHA gateway timeout or an expired hospital client certificate.
- Review FHIR R4 validation logs for schema discrepancies against NHA profile specifications.
