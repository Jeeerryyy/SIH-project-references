# Maharashtra Connected Care & Public Health Platform (MCCPHP)
## 06. Offline-First & Distributed Sync Engine Specification

**Document Reference:** `MCCPHP-DOC-06-SYNC`  
**Target Context:** Remote Tribal & Rural Belts of Maharashtra (Gadchiroli, Nandurbar, Melghat, Jawhar) with Zero Cellular Connectivity  
**Client Architecture:** Progressive Web App (PWA) + Dexie.js (IndexedDB) + Workbox Service Worker  
**Conflict Resolution Strategy:** Hybrid CRDTs (Additive Event Log for Clinical Records + LWW for Demographics) + Vector Clocks

---

### 1. Offline-First Architectural Blueprint

Field healthcare workers (ASHA, ANM, Multi-Purpose Health Workers) must perform surveys, immunizations, and prenatal checks without interruption, regardless of internet connectivity:

```
[ ASHA Mobile Device (Offline PWA) ]                          [ MCCPHP State Cloud ]
┌──────────────────────────────────────┐                     ┌──────────────────────────────────────┐
│  React PWA UI (Marathi First)        │                     │  API Gateway & Sync Ingestion Node   │
│                 │                    │                     │                 │                    │
│  Dexie.js (Encrypted IndexedDB)      │                     │  Sync Validator & Conflict Resolver  │
│  - households (local cache)          │                     │                 │                    │
│  - anc_visits (offline store)        │                     │  PostgreSQL 16 Master DB             │
│  - immunizations (offline store)     │                     │  - Vector Clocks Audit               │
│                 │                    │                     │  - State Machine Transition          │
│  Client Sync Queue (Outbox)          │                     │                 │                    │
│  [Mutation 1, Mutation 2, ...]       │                     │  BullMQ Sync Worker Pool             │
└─────────────────┬────────────────────┘                     └─────────────────┬────────────────────┘
                  │                                                            │
                  └───────── Background Sync API / WebSocket ──────────────────┘
                            (Auto-triggers when connectivity returns)
```

---

### 2. Client-Side Dexie.js (IndexedDB) Schema Specification

```typescript
import Dexie, { Table } from 'dexie';

export interface LocalHousehold {
  id: string; // UUID
  householdNumber: string;
  headOfFamilyName: string;
  villageTown: string;
  totalMembers: number;
  location?: { lat: number; lng: number };
  isBpl: boolean;
  syncStatus: 'SYNCED' | 'PENDING_UPLOAD' | 'CONFLICT';
  lastModifiedAt: string;
}

export interface LocalANCVisit {
  id: string; // Local client-generated UUID
  patientId: string;
  ashaId: string;
  visitNumber: number;
  gestationalAgeWeeks: number;
  fundalHeightCm: number;
  fetalHeartRateBpm: number;
  hemoglobinGDl: number;
  isHighRiskPregnancy: boolean;
  highRiskReasons: string[];
  visitDate: string;
  syncStatus: 'PENDING_UPLOAD' | 'SYNCED';
  localCreatedAt: string;
}

export interface SyncOutboxEntry {
  id: string; // Auto-increment or UUID
  entityType: 'household' | 'anc_visit' | 'pnc_visit' | 'immunization' | 'ncd_screening';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  clientTimestamp: string;
  retryCount: number;
  lastError?: string;
}

export class MccphpFieldDatabase extends Dexie {
  households!: Table<LocalHousehold, string>;
  ancVisits!: Table<LocalANCVisit, string>;
  syncOutbox!: Table<SyncOutboxEntry, string>;

  constructor() {
    super('MccphpOfflineFieldDB');
    this.version(1).stores({
      households: 'id, householdNumber, villageTown, syncStatus, lastModifiedAt',
      ancVisits: 'id, patientId, ashaId, visitDate, syncStatus',
      syncOutbox: 'id, entityType, action, clientTimestamp, retryCount'
    });
  }
}

export const offlineDb = new MccphpFieldDatabase();
```

---

### 3. Local Vault Encryption (AES-256-GCM)

To protect patient health data on stolen or shared Android tablets:

1. **Key Derivation:** When the ASHA logs in, a 6-digit offline PIN is combined with a device salt using **PBKDF2 (100,000 iterations)** to generate a 256-bit symmetric encryption key.
2. **Key Storage:** Stored strictly in memory during the active session; never written to `localStorage` or unencrypted IndexedDB.
3. **Payload Encryption:** All sensitive clinical columns (e.g. Hemoglobin, HIV/TB status, pregnancy risk) are encrypted using `AES-256-GCM` before committing to IndexedDB.

---

### 4. Distributed Synchronization & Delta Protocol

#### A. Sync Outbox Queue Execution
1. Whenever the worker submits a form offline, the record is written to the local table (`syncStatus: 'PENDING_UPLOAD'`) and an immutable event is queued in `syncOutbox`.
2. The browser's **Service Worker Background Sync API** registers a sync tag: `swRegistration.sync.register('mccphp-outbox-sync')`.
3. When cellular/Wi-Fi connection is detected, the Service Worker triggers the sync worker:
   * Batches up to 50 queued mutations.
   * Sends to `POST /api/v1/field/sync/batch`.
   * Server validates authorizations and executes transactions atomically.

#### B. Conflict Resolution Rules (Deterministic Matrix)

| Entity / Event | Conflict Scenario | Resolution Rule | Enforcement Location |
|---|---|---|---|
| **Household Demographic** | Two ASHAs edit head of family or address | **Last-Write-Wins (LWW)** based on verified server timestamp | Server Sync Validator |
| **Child Immunization** | Offline record conflicts with PHC hospital log | **Additive Merge (Union)**: If either source marked vaccine given, state becomes `GIVEN` with latest batch # | Server Business Rule Engine |
| **ANC Visit Logs** | Duplicate visit # recorded during offline mode | **Multi-Record Append**: Both visits preserved with distinct timestamps for doctor clinical review | Server Database |
| **Drug Stock Dispense** | Offline ASHA kit dispense exceeds remaining kit count | **Reconciliation Ledger**: Inventory allowed to drop to negative temporary deficit with mandatory audit alert | Pharmacy Controller |

---

### 5. Service Worker Caching Architecture (Workbox)

| Resource Type | Cache Strategy | Cache Name | Expiration / Policy |
|---|---|---|---|
| **App Shell (HTML/JS/CSS)** | Cache-First with Network Revalidation | `mccphp-app-shell-v2` | Max 30 days, updated on new build hash |
| **UI Fonts & Icons** | Cache-First | `mccphp-static-fonts` | Max 1 year (Cache permanently) |
| **Medicine & Facility Lookups** | Stale-While-Revalidate | `mccphp-lookups-cache` | Max 7 days, background refresh |
| **Village Household Roster** | Network-First with IndexedDB Fallback | `mccphp-dynamic-data` | Falls back to local IndexedDB if offline |
| **Patient Photos / Attachments** | Cache-First with size cap | `mccphp-media-cache` | Max 200 items / 100MB LRU purge |

---

### 6. UI Sync Telemetry & Visual Indicators

The ASHA mobile interface includes an unobtrusive, prominent status indicator in the top app bar:

* 🟢 **Online & Synced:** All local records committed to the Maharashtra State Health Cloud.
* 🟡 **Offline Mode (Active):** "ऑफलाइन मोड सक्रिय — सर्व नोंदी सुरक्षित जतन केल्या आहेत" (Offline mode active — all records safely saved locally).
* 🔄 **Syncing In Progress:** Rotating badge with live counter: "समक्रमित होत आहे: 14/25 नोंदी..." (Syncing: 14/25 records...).
* 🔴 **Sync Alert / Attention Needed:** Detailed conflict list with 1-click retry or supervisor review button.
