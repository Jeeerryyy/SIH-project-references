# Incident: PostgreSQL Database Outage and Connection Pool Exhaustion

## Purpose
Operational recovery procedure for PostgreSQL database unavailability, primary node failure, replication desynchronization, and PgBouncer connection pool exhaustion across all hospital branches and clinical departments.

## Impact
- **Affected Services:** All 19 hospital staff panels (Doctor, Nursing Station, OPD Front Desk, IPD Admission/Bed Management, OT Scheduling, LIS, RIS/PACS, Pharmacy, Blood Bank, Emergency, Billing/Cashier, Insurance/TPA Desk, HR/Payroll) and Patient Portal.
- **User Experience:** Complete inability to read/write Electronic Medical Records (EMR), admit patients, allocate beds, generate e-prescriptions, execute surgical checklists, dispense medications, or process discharge bills.

## Symptoms
- HTTP `500 Internal Server Error` or `503 Service Unavailable` across `/api/v1/...` endpoints.
- API logs reporting `PrismaClientInitializationError`, `Connection terminated unexpectedly`, or `timeout acquiring connection from pool`.
- Prometheus metric `database_connection_pool_active_connections` saturated at maximum pool capacity.
- PostgreSQL log: `FATAL: remaining connection slots are reserved for non-replication superuser connections`.

## Severity
**P0 — Complete Production Outage**

## Immediate Actions
> [!IMPORTANT]
> **SAFE AUTOMATION vs REQUIRES HUMAN APPROVAL**
> - *Safe to automate:* Reloading PgBouncer connection pooler; scaling down non-critical background reporting workers.
> - *Requires human approval:* Promoting PostgreSQL Standby/Replica to Primary; terminating active transactional queries; restoring database from cold backup.

1. **Protect Core Ingress:** Maintain Nginx reverse proxy rate limits to prevent connection hammering while the database recovers.
2. **Throttle Background Workers:** Scale down non-essential asynchronous workers (e.g., MIS analytics rollup, PDF generation) to free database connection slots:
   ```bash
   kubectl scale deployment bullmq-reports-worker --replicas=0 -n hms-prod
   ```
3. **Check Primary DB Node Liveness:**
   ```bash
   pg_isready -h 127.0.0.1 -p 5432
   ```

## Diagnosis
1. **Check PgBouncer Pool Status:**
   ```bash
   psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "SHOW POOLS;"
   psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "SHOW CLIENTS;"
   ```
   *Look for `cl_waiting` > 0 and `sv_active` equal to `max_db_connections`.*

2. **Check PostgreSQL Process and Storage Health:**
   ```bash
   systemctl status postgresql-16
   df -h /var/lib/postgresql/data  # Verify WAL disk partition is not full
   ```

3. **Inspect Long-Running or Blocking Transactions Across Branches:**
   ```sql
   SELECT pid, age(clock_timestamp(), query_start), usename, state, query 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND age(clock_timestamp(), query_start) > interval '30 seconds'
   ORDER BY age(clock_timestamp(), query_start) DESC;
   ```

4. **Verify Streaming Replication Lag to Disaster Recovery Standby:**
   ```sql
   SELECT client_addr, state, sync_state, replay_lsn, 
          pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replication_lag_bytes 
   FROM pg_stat_replication;
   ```

## Recovery

### Scenario A: Connection Pool Saturation (Long Query / Locking)
1. Terminate runaway blocking queries:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND age(clock_timestamp(), query_start) > interval '2 minutes' 
     AND pid <> pg_backend_pid();
   ```
2. Reload PgBouncer to clear saturated client pools:
   ```bash
   psql -h 127.0.0.1 -p 6432 -U pgbouncer -d pgbouncer -c "RELOAD;"
   ```

### Scenario B: Primary Database Crash (Failover to Standby Replica)
> [!CAUTION]
> **REQUIRES HUMAN APPROVAL:** Promoting the standby replica alters the primary database topology. Ensure the primary node is genuinely unrecoverable before promoting.

1. Confirm standby replication lag is minimal (< 1 sec).
2. Promote standby instance:
   ```bash
   pg_ctl promote -D /var/lib/postgresql/16/main
   # Or using cluster manager:
   repmgr standby promote -f /etc/repmgr.conf
   ```
3. Update PgBouncer configuration to target the new primary endpoint.
4. Restart PgBouncer:
   ```bash
   systemctl restart pgbouncer
   ```

## Validation
1. Verify database responsiveness:
   ```bash
   pg_isready -h 127.0.0.1 -p 6432 -U hms_user -d hms_prod
   ```
2. Verify API Gateway health endpoint:
   ```bash
   curl -I https://api.hms-group.in/api/v1/health/db
   ```
   *Expected response: HTTP `200 OK` with JSON `{"status":"UP","database":"connected","latency_ms":5}`.*
3. Gradually scale background workers back to baseline:
   ```bash
   kubectl scale deployment bullmq-reports-worker --replicas=3 -n hms-prod
   ```

## Rollback
- If standby promotion was executed erroneously, do not restart the former primary without re-syncing via `pg_rewind` to prevent split-brain write conflicts.

## Escalation
- **Escalate to:** Lead Database Administrator & Infrastructure Lead.
- **Escalation Threshold:** Downtime exceeds 5 minutes without resolution or failover failure.

## Do Not
- **DO NOT** execute `kill -9` on the primary `postgres` process (risk of shared memory corruption).
- **DO NOT** execute `DROP TABLE` or run unverified schema migrations in production.
- **DO NOT** route application pods directly to port 5432 bypassing PgBouncer connection pooling.

## Root Cause Follow-Up
- Analyze queries captured during the incident window.
- Review table vacuum statistics on high-volume tables (`audit_logs`, `appointments`, `billing_invoices`, `admissions`).
- Review PgBouncer `max_client_conn` against peak multi-branch morning OPD traffic.
