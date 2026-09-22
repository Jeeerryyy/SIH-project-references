# Incident: Real-Time Queue and WebSocket Broadcast Outage

## Purpose
Operational recovery procedure for real-time WebSocket cluster failure, Socket.io Redis adapter desynchronization, and OPD live token / OT Big Board display freezing across hospital branches.

## Impact
- **Affected Services:** OPD waiting room TV display boards, Doctor consultation calling queue, OT Big Board perioperative tracking, Nursing station bed-turnover live indicator.
- **Unaffected Systems:** Backend EMR, database writes, appointment booking, laboratory result entry, and asynchronous reports remain intact.

## Symptoms
- Waiting room TV screens and kiosk display boards freeze and stop updating token numbers.
- Doctors clicking "Call Next Patient" see UI delay or patients do not enter because the waiting room display did not update.
- Browser consoles showing WebSocket connection errors: `WebSocket connection to 'wss://.../socket.io/' failed: Error during WebSocket handshake`.
- Prometheus metric `websocket_active_connections` dropping sharply across branches.
- Nginx logs showing HTTP `502 Bad Gateway` or `504 Gateway Timeout` on `/socket.io/` requests.

## Severity
**P1 — High-Visibility Operational Disruption in Hospital OPD/OT**

## Immediate Actions
> [!IMPORTANT]
> **SAFE AUTOMATION vs REQUIRES HUMAN APPROVAL**
> - *Safe to automate:* Restarting WebSocket pod deployments; reloading Nginx reverse proxy; flushing Redis Socket.io adapter pub/sub channel.
> - *Requires human approval:* Switching hospital branch queues to manual verbal/paper calling protocol.

1. **Activate Client HTTP Polling Fallback:** Ensure frontend clients auto-fallback from WebSocket transport to HTTP Long-Polling transport.
2. **Check Redis Sentinel / Cluster Pub/Sub Health:** Verify Redis is actively relaying cross-pod broadcast events:
   ```bash
   redis-cli -u "$REDIS_URL" PING
   ```

## Diagnosis
1. **Verify WebSocket Pod Status and Memory Limits:**
   ```bash
   kubectl get pods -l app=websocket-service -n hms-prod -o wide
   kubectl top pods -l app=websocket-service -n hms-prod
   ```
   *Check for OOMKilled pods due to memory leaks on long-lived connections.*

2. **Check Nginx WebSocket Upstream Proxy Configuration:**
   - Ensure `proxy_http_version 1.1`, `Upgrade $http_upgrade`, and `Connection "Upgrade"` are configured on the `/socket.io/` location block.
   - Inspect Nginx error log:
   ```bash
   tail -n 200 /var/log/nginx/error.log | grep socket.io
   ```

3. **Test Direct WebSocket Pod Connectivity (Bypassing Ingress):**
   ```bash
   curl -I "http://10.0.1.20:4001/socket.io/?EIO=4&transport=polling"
   ```
   *Expected result: HTTP `200 OK` with Socket.io handshake JSON payload.*

4. **Verify Redis Adapter Pub/Sub Traffic:**
   ```bash
   redis-cli -u "$REDIS_URL" PUBSUB CHANNELS "socket.io#*"
   redis-cli -u "$REDIS_URL" PUBSUB NUMSUB "socket.io#hms-events"
   ```

## Recovery

### Scenario A: Redis Pub/Sub Connection Stalled
1. Restart WebSocket cluster pods in a rolling deployment to re-establish Redis adapter subscriptions:
   ```bash
   kubectl rollout restart deployment/websocket-service -n hms-prod
   ```
2. Monitor rolling rollout:
   ```bash
   kubectl rollout status deployment/websocket-service -n hms-prod
   ```

### Scenario B: Nginx Connection Table Saturated
1. Increase Nginx worker connections and timeout parameters:
   ```nginx
   # In /etc/nginx/nginx.conf
   events {
       worker_connections 10240;
   }
   ```
2. Reload Nginx without dropping active client connections:
   ```bash
   nginx -s reload
   ```

### Scenario C: TV Display Kiosk Disconnected
1. If hardware TV display kiosks in waiting areas remain disconnected, trigger remote refresh or send broadcast push:
   - TV kiosk browser runs a watchdog reload script every 60 seconds if no heartbeat is received.

## Validation
1. Verify active WebSocket connections are rebuilding:
   - Check Prometheus metric: `sum(websocket_active_connections)` returning to expected baseline across all branches.
2. Test broadcasting a live test event to a non-production test room:
   ```bash
   kubectl exec -it -n hms-prod deploy/websocket-service -- node scripts/test-broadcast.js --branch="TEST_BRANCH" --token="999"
   ```
3. Confirm OPD TV displays and doctor queues reflect real-time updates within < 200ms.

## Rollback
- "No verified rollback mechanism found." (WebSocket restart is stateless; clients reconnect automatically).

## Escalation
- **Escalate to:** Frontend Platform Lead & Real-Time Infrastructure Engineer.
- **Escalation Threshold:** WebSocket disconnect persists > 15 minutes during morning OPD rush (09:00–12:00 IST).

## Do Not
- **DO NOT** restart the primary PostgreSQL database to fix a WebSocket issue. WebSocket real-time state is strictly managed in Redis and Node.js memory.
- **DO NOT** disable CORS or security token validation on the WebSocket gateway.

## Root Cause Follow-Up
- Review node memory leak profiles and WebSocket connection lifetime limits.
- Tune `pingInterval` (25s) and `pingTimeout` (60s) in Socket.io server configuration to quickly prune dead mobile client sockets.
