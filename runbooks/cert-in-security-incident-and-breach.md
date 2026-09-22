# Incident: CERT-In Cyber Security Incident and Data Breach Response

## Purpose
Statutory and technical emergency response runbook for handling cyber security incidents, unauthorized patient health record exfiltration, credential compromise, or ransomware detection in accordance with the CERT-In 6-Hour reporting mandate, the Digital Personal Data Protection (DPDP) Act 2023 (+ DPDP Rules 2025), and Bharatiya Sakshya Adhiniyam (BSA) 2023 evidentiary standards.

## Impact
- **Affected Services:** Potential exposure of patient Electronic Medical Records (EMR), ABHA demographics, diagnostic lab/radiology reports, surgical notes, and billing records.
- **Statutory & Legal Risk:** Penalties up to ₹250 crore under DPDP Act 2023; mandatory reporting violation penalties under CERT-In Directions.

## Symptoms
- Anomalous bulk export queries on `patients`, `prescriptions`, or `billing_invoices` recorded in `audit_logs`.
- Unauthorized administrative logins detected outside working hours or from anomalous geographic IP ranges.
- Ransomware signatures, altered web content, or unauthorized privilege escalation on Kubernetes worker nodes.
- Exposure of JWT signing keys, database credentials, or Vault root tokens in logs or public repositories.

## Severity
**P0 — Statutory Emergency & Critical Security Incident**

## Immediate Actions
> [!IMPORTANT]
> **SAFE AUTOMATION vs REQUIRES HUMAN APPROVAL**
> - *Safe to automate:* Isolating compromised pods/nodes from the active service mesh; revoking active user session tokens in Redis.
> - *Requires human approval:* Global JWT secret rotation; locking database write access; filing official regulatory notifications with CERT-In and the Data Protection Board of India.

1. **Start Statutory Clock:** Note detection timestamp (`T_0`). Mandatory CERT-In reporting deadline is **`T_0 + 6 hours`**.
2. **Isolate Compromised Pod/Node:** Quarantine container without destroying its volatile memory (preserving forensic state):
   ```bash
   kubectl label pod <compromised-pod-name> -n hms-prod quarantine=true --overwrite
   kubectl annotate pod <compromised-pod-name> -n hms-prod quarantine-reason="Forensic investigation"
   ```
3. **Revoke Active Compromised Sessions:**
   ```bash
   redis-cli -u "$REDIS_URL" DEL "session:<compromised_user_id>:*"
   ```

## Diagnosis
1. **Query Partitioned Audit Logs for Breach Scope:**
   ```sql
   SELECT audit_id, user_id, branch_id, action, entity_type, entity_id, occurred_at 
   FROM audit_logs 
   WHERE occurred_at >= NOW() - INTERVAL '6 hours' 
     AND (action IN ('EXPORT_BULK', 'DELETE_BULK', 'AUTH_BYPASS') OR user_id = '<suspected_user_id>')
   ORDER BY occurred_at DESC;
   ```

2. **Inspect Nginx Ingress Logs for Exploitation Patterns:**
   ```bash
   tail -n 10000 /var/log/nginx/access.log | grep -E "(401|403|select|union|concat|\.\./)"
   ```

3. **Check Vault / Secrets Manager Access Logs:**
   - Verify audit logs in HashiCorp Vault for unauthorized token lookups on `secret/data/hms/production/*`.

4. **Verify Container & Host Integrity:**
   ```bash
   kubectl get pods -n hms-prod -o wide
   kubectl top pods -n hms-prod
   ```

## Recovery

### Scenario A: Compromised JWT Signing Key / Session Token
> [!CAUTION]
> **REQUIRES HUMAN APPROVAL:** Rotating the active JWT secret forces all active clinical and administrative users across all branches to re-authenticate.

1. Rotate JWT signing secret in HashiCorp Vault:
   ```bash
   vault kv put secret/hms/production/auth JWT_SECRET="$(openssl rand -hex 64)"
   ```
2. Trigger rolling restart of API Gateway pods:
   ```bash
   kubectl rollout restart deployment/api-gateway -n hms-prod
   ```
3. Flush Redis session cache to force re-authentication with 2FA / AEBAS biometric attendance.

### Scenario B: Database Credential Compromise
1. Create a replacement database user in PostgreSQL:
   ```sql
   CREATE USER hms_app_v2 WITH PASSWORD '<NEW_STRONG_PASSWORD>';
   GRANT hms_app_role TO hms_app_v2;
   ```
2. Update `DATABASE_URL` secret in Vault / External Secrets Operator.
3. Once all pods have updated their database connection pool, revoke and drop the compromised user:
   ```sql
   REVOKE CONNECT ON DATABASE hms_prod FROM hms_compromised_user;
   DROP USER hms_compromised_user;
   ```

## Statutory Reporting (CERT-In & DPDP Mandate)
Within **6 hours** of detection, the Data Protection Officer / Incident Commander must submit the incident report to CERT-In:
- **CERT-In Portal:** `https://www.cert-in.org.in`
- **Email:** `incident@cert-in.org.in` / **Hotline:** 1800-11-4949
- **Report Details Required:**
  1. Time of occurrence and time of detection.
  2. Affected system (Hospital Management System Platform / Multi-Branch Infrastructure).
  3. Nature of incident (Unauthorized Access, Data Breach, Ransomware, System Compromise).
  4. Extent of data impacted (number of patient records, ABHA IDs, clinical documents).
  5. Containment and remedial actions taken.

## Validation
1. Confirm no unauthorized connections exist:
   ```bash
   netstat -antp | grep :4000
   ```
2. Verify token authentication is operational:
   ```bash
   curl -I https://api.hms-group.in/api/v1/auth/verify-token
   ```
3. Ensure `audit_logs` continues recording all system events across all branches.

## Rollback
- "No verified rollback mechanism found." (Security revocations and rotated credentials cannot be rolled back without compromising security).

## Escalation
- **Immediate Escalation:** Chief Information Security Officer (CISO), Data Protection Officer (DPO), and Hospital Legal Counsel.
- **Statutory Clock Coordinator:** Ensure CERT-In report draft is ready within `T_0 + 3 hours`.

## Do Not
- **DO NOT** delete, truncate, or alter `audit_logs` or system logs (statutorily mandated to be retained for at least 1 year under DPDP Act 2023 and CERT-In rules).
- **DO NOT** publish patient health data or identifiable details in public communications.
- **DO NOT** terminate compromised pods without collecting memory/disk snapshots for evidentiary provenance under BSA 2023.

## Root Cause Follow-Up
- Schedule full independent Vulnerability Assessment & Penetration Testing (VAPT).
- Review RBAC role bindings across all 19 staff panels and remove excessive privileges.
- Verify that third-party vendors and cloud providers maintain contractual DPDP compliance commitments.
