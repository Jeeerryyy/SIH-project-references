# Incident: Payment Gateway Webhook and NHCX Cashless Settlement Failure

## Purpose
Operational recovery procedure for payment gateway callback failures (Razorpay/UPI), idempotency key collision/deadlocks, and National Health Claims Exchange (NHCX) pre-authorization / claim settlement delays threatening the IRDAI mandatory 3-hour cashless discharge SLA.

## Impact
- **Affected Services:** Cashier Counter, Patient Portal Billing, Pharmacy POS, IPD Discharge Desk, Insurance/TPA Desk.
- **Compliance Risk:** Violation of IRDAI mandate requiring cashless claim settlement authorization within **3 hours of hospital discharge request**.
- **Financial Risk:** Double charging patient accounts or dispensing medications without confirmed payment authorization.

## Symptoms
- Patients charged on UPI/Cards, but billing invoices remain in `status: 'unpaid'`.
- Payment webhook endpoint `/api/v1/billing/webhooks/razorpay` returning HTTP `500` or `400 Invalid Signature`.
- `Idempotency-Key` collisions logged on retry: `HTTP 409 Conflict: Concurrent charge in progress`.
- NHCX pre-authorization or claim status queries returning `TIMEOUT` or pending beyond 2.5 hours post-discharge.

## Severity
**P1 — Financial & Compliance Critical Incident**

## Immediate Actions
> [!IMPORTANT]
> **SAFE AUTOMATION vs REQUIRES HUMAN APPROVAL**
> - *Safe to automate:* Re-polling payment gateway status via idempotent polling job; checking NHCX claim status API.
> - *Requires human approval:* Issuing manual invoice clearance; overriding insurance cashless guarantee letters; issuing financial refunds.

1. **Verify Idempotency Locks:** Ensure Redis idempotency locks are expiring properly and not permanently locking unpaid invoices:
   ```bash
   redis-cli -u "$REDIS_URL" KEYS "idempotency:payment:*"
   ```
2. **Prevent Duplicate Offline Charging:** Instruct hospital cashiers not to re-swipe cards or request new QR codes if a transaction shows "Pending Bank Confirmation".
3. **Engage NHCX Fast-Track SLA Monitor:** Filter all discharge claims that have been pending on NHCX for > 2 hours to prioritize escalation.

## Diagnosis
1. **Check Webhook Delivery Status in Payment Gateway:**
   - Log into the Razorpay Gateway Dashboard.
   - Inspect Webhook logs for `payment.captured` events sent to `https://api.hms-group.in/api/v1/billing/webhooks/razorpay`.
   - Look for signature mismatch or TLS handshake errors.

2. **Check Payment Signature Verification Secrets in Vault:**
   - Verify that `RAZORPAY_WEBHOOK_SECRET` in application environment matches the secret configured in the gateway portal.

3. **Diagnose NHCX Claims API Pipeline:**
   ```bash
   curl -X GET "https://api.hms-group.in/api/v1/insurance/nhcx/health" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

4. **Query Unreconciled Payments in Database:**
   ```sql
   SELECT p.payment_id, p.invoice_id, p.amount, p.method, p.idempotency_key, p.paid_at, i.status AS invoice_status 
   FROM payments p
   JOIN billing_invoices i ON p.invoice_id = i.invoice_id
   WHERE i.status = 'unpaid' AND p.paid_at >= NOW() - INTERVAL '4 hours';
   ```

## Recovery

### Scenario A: Webhook Delivery Dropped / Missed Callbacks
1. Run the payment reconciliation cron manually for the affected time window:
   ```bash
   kubectl exec -it -n hms-prod deploy/billing-service -- node scripts/reconcile-gateway-payments.js --since="4h"
   ```
2. The script polls `https://api.razorpay.com/v1/payments/{payment_id}` using the stored gateway transaction reference and updates `billing_invoices.status = 'paid'` idempotently.

### Scenario B: NHCX Cashless Settlement Approaching 3-Hour Deadline
> [!CAUTION]
> **REQUIRES HUMAN APPROVAL:** If NHCX automated response is stalled at `T_discharge + 2.5 hours`, the Insurance/TPA desk supervisor must be alerted to execute manual insurance desk failover.

1. Trigger high-priority status re-query to NHCX switch:
   ```bash
   kubectl exec -it -n hms-prod deploy/insurance-service -- node scripts/nhcx-poll-claim-status.js --claim-id="<CLAIM_UUID>"
   ```
2. If NHCX platform is confirmed down, switch to Insurer Direct Portal / Emergency TPA Approval Letter protocol to release the patient before the 3-hour SLA breach.

## Validation
1. Verify all completed payments have corresponding invoice status `paid`:
   ```sql
   SELECT COUNT(*) 
   FROM payments p 
   JOIN billing_invoices i ON p.invoice_id = i.invoice_id 
   WHERE i.status = 'unpaid' AND p.paid_at >= NOW() - INTERVAL '1 hour';
   ```
   *Expected result: 0.*
2. Verify incoming webhooks respond with HTTP `200 OK` within < 500ms.
3. Check NHCX claim processing queue latency in Prometheus dashboard.

## Rollback
- "No verified rollback mechanism found." (Financial transactions and payment reconciliations are ledgered and cannot be rolled back blindly; refunds must follow standard accounting workflow).

## Escalation
- **Escalate to:** Head of Billing & Finance, Insurance Desk Manager, and Integration Lead.
- **Escalation Threshold:** More than 5 un-reconciled payments in 30 minutes, or any NHCX cashless discharge pending past 2.5 hours.

## Do Not
- **DO NOT** manually mark invoices as `paid` in the database via raw SQL updates without creating a linked `payments` audit record with an explicit idempotency key.
- **DO NOT** disable webhook signature verification in the billing controller.
- **DO NOT** detain discharged patients when an insurance claim delay is caused by national NHCX gateway downtime; follow interim promissory protocol per hospital policy.

## Root Cause Follow-Up
- Verify webhook retry policies and exponential backoff configuration in the gateway portal.
- Review NHCX payload formats against the latest Insurance Regulatory and Development Authority of India (IRDAI) circulars.
