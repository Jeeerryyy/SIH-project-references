# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 08. Infrastructure, DevOps & Production Deployment Specification

**Document Reference:** `MCCPHP-DOC-08-OPS`  
**Target Environments:** MeghRaj (NIC National Cloud) / AWS GovCloud / Azure Government / Dedicated State Data Center (SDC Pune & SDC Mumbai)  
**High Availability Target:** 99.99% Core Clinical Uptime, Multi-Region Disaster Recovery (RTO < 15 mins, RPO < 1 min)  
**Security Standard:** MeitY Cloud Security Certified, STQC Compliant, CIS Benchmark Hardened

---

### 1. Enterprise Cloud Topology & High Availability Architecture

```
                                  [ MeghRaj / Cloudflare WAF ]
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     ▼                                                     ▼
           [ Primary SDC (Mumbai) ]                              [ Disaster Recovery SDC (Pune) ]
        (Active - 100% Live Traffic)                            (Warm Standby - Streaming Replicas)
                     │                                                     │
   ┌─────────────────┴─────────────────┐                                   │
   ▼                                   ▼                                   │
[ Ingress Controller: Nginx HA ]  [ Cert-Manager (TLS 1.3) ]               │
   │                                                                       │
   ├──────► [ K8s Pods: API Gateway Cluster (HPA 10–50 Pods) ]             │
   ├──────► [ K8s Pods: BullMQ Async Workers (HPA 5–30 Pods) ]             │
   ├──────► [ K8s Pods: WebSocket Scaled Cluster (HPA 5–20 Pods) ]         │
   │                                                                       │
   ├──────► [ PgBouncer Connection Pool Cluster ]                          │
   │             │                                                         │
   │             ▼                                                         │
   │        [ PostgreSQL 16 Primary ] ═════ Streaming WAL Replication ═════► [ PostgreSQL 16 Standby ]
   │             │ (Local NVMe RAID-10)                                    │
   │             ├──────► [ Read Replica 1 (Reporting) ]                   │
   │             └──────► [ Read Replica 2 (Analytics) ]                   │
   │                                                                       │
   ├──────► [ Redis 7 Sentinel / Cluster (Master + 2 Replicas) ] ══════════► [ Redis Standby Cluster ]
   ├──────► [ Meilisearch Cluster (MPI Search Engine) ]                    │
   └──────► [ MinIO / S3 Object Store (WORM Immutable Logs) ] ═════════════► [ Geo-Replicated S3 Store ]
```

---

### 2. Production Docker Multi-Stage Build Specifications

#### A. Backend API & Gateway (`deploy/docker/backend.Dockerfile`)
```dockerfile
# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY services/api-gateway/ ./services/api-gateway/
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@mccphp/api-gateway...

# Stage 2: Production runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 mccphp
USER mccphp
COPY --from=builder --chown=mccphp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=mccphp:nodejs /app/packages/database/prisma ./prisma
COPY --from=builder --chown=mccphp:nodejs /app/services/api-gateway/dist ./dist
COPY --from=builder --chown=mccphp:nodejs /app/services/api-gateway/package.json ./package.json

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

#### B. Frontend Portals Nginx Container (`deploy/docker/frontend.Dockerfile`)
```dockerfile
# Stage 1: Build Frontend SPA
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm turbo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=citizen-portal...

# Stage 2: Hardened Nginx Alpine
FROM nginx:1.27-alpine-slim
COPY deploy/nginx/hardened-portal.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/citizen-portal/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

### 3. Production Nginx Reverse Proxy & SSL/TLS Hardening (`deploy/nginx/nginx.conf`)

```nginx
# Production Nginx Gateway Configuration with TLS 1.3 & Security Headers
upstream mccphp_backend {
    least_conn;
    server 10.0.1.10:4000 max_fails=3 fail_timeout=10s;
    server 10.0.1.11:4000 max_fails=3 fail_timeout=10s;
    server 10.0.1.12:4000 max_fails=3 fail_timeout=10s;
    keepalive 64;
}

upstream mccphp_websocket {
    ip_hash;
    server 10.0.1.20:4001;
    server 10.0.1.21:4001;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:20m rate=50r/s;
limit_req_zone $binary_remote_addr zone=otp_limit:10m rate=5r/m;

server {
    listen 443 ssl http2;
    server_name api.mccphp.mh.gov.in;

    # SSL TLS 1.3 Certificate & Ciphers
    ssl_certificate /etc/ssl/certs/mccphp_mh_gov_in.crt;
    ssl_certificate_key /etc/ssl/private/mccphp_mh_gov_in.key;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Enterprise Security Headers (STQC / OWASP)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip & Brotli Compression
    gzip on;
    gzip_types application/json text/plain application/javascript text/css;

    # API Proxy Routing
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://mccphp_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 30s;
    }

    # Strict Rate Limit on OTP Endpoints
    location /api/v1/auth/otp/ {
        limit_req zone=otp_limit burst=2 nodelay;
        proxy_pass http://mccphp_backend;
    }

    # Real-Time WebSocket Proxy
    location /socket.io/ {
        proxy_pass http://mccphp_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400s;
    }
}
```

---

### 4. Kubernetes (K8s) Production Manifests & Helm Specifications

1. **Horizontal Pod Autoscaling (HPA):**
   * Target CPU utilization: `70%`.
   * Target Request Throughput: `1,000 req/min per pod`.
   * Min Replicas: `10`, Max Replicas: `50`.
   * Scale-up stabilization window: `0 seconds` (Instant scale during emergency surge).
   * Scale-down stabilization window: `300 seconds` (Gradual cool-down).

2. **Resource Requests & Limits per Container:**
   * **API Gateway Pod:** Request: `1 CPU, 2Gi RAM`; Limit: `4 CPU, 8Gi RAM`.
   * **BullMQ Worker Pod:** Request: `2 CPU, 4Gi RAM`; Limit: `8 CPU, 16Gi RAM`.
   * **WebSocket Real-time Pod:** Request: `1 CPU, 2Gi RAM`; Limit: `2 CPU, 4Gi RAM`.

---

### 5. Observability & Monitoring Infrastructure

```
                                  [ OpenTelemetry Collector ]
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
    [ Prometheus Server ]              [ Grafana Loki ]               [ Tempo / Jaeger ]
    (Time-Series Metrics)            (Aggregated Log Streams)       (Distributed Trace Spans)
               │                               │                               │
               └───────────────────────┬───────┴───────────────────────────────┘
                                       ▼
                       [ Unified Grafana 11 Dashboard ]
                         - State Health Golden Signals
                         - OPD Token Processing Latency
                         - Outbreak Detection Pipeline Health
                         - ABDM M1/M2/M3 Success Rate
```

* **Golden Signal Metrics:**
  * `http_requests_total{status, method, route}`
  * `http_request_duration_seconds_bucket{route}` (Target p95 < 150ms)
  * `bullmq_jobs_waiting_total{queue_name}` (Target < 50)
  * `websocket_active_connections{namespace}`
  * `database_connection_pool_active_connections`

---

### 6. Secrets & Key Management

* All database credentials, JWT secrets, ABDM private certificates, and AES encryption keys are stored in **HashiCorp Vault** or **AWS Secrets Manager**.
* Kubernetes pods mount secrets dynamically via the **External Secrets Operator (ESO)** directly into memory volumes (`tmpfs`), preventing plaintext persistence on disk or Git repository.
