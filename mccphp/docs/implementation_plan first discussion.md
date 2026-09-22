# MCCPHP — 100% Implementation Plan
## Maharashtra Connected Care & Public Health Platform

**Status:** Implementation Blueprint — Awaiting Approval  
**Base:** Rebuild from Aarogya Mitra codebase  
**Target:** Full MCCPHP specification (95 sections, 30 modules)

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Monorepo File/Folder Hierarchy](#2-monorepo-filefolder-hierarchy)
3. [Database Schema (55+ Tables)](#3-database-schema-55-tables)
4. [Backend API Architecture](#4-backend-api-architecture)
5. [Authorization Engine (6D RBAC)](#5-authorization-engine-6d-rbac)
6. [Frontend Portal Specifications](#6-frontend-portal-specifications)
7. [Offline-First Sync Engine](#7-offline-first-sync-engine)
8. [ABDM / FHIR Integration](#8-abdm--fhir-integration)
9. [Design System](#9-design-system)
10. [Build Phases](#10-build-phases)
11. [Verification Plan](#11-verification-plan)

---

## 1. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Monorepo** | Turborepo + pnpm workspaces | Already using npm workspaces; Turborepo adds caching + parallelism without ceremony |
| **Backend Runtime** | Node.js 20 LTS + Express 4 | Keep existing. Stable, battle-tested |
| **Backend Language** | TypeScript 5.5+ (strict) | Already using. Add `strict: true` |
| **ORM** | Prisma 6 + PostgreSQL 16 | Already using. Upgrade to Prisma 6 for multi-schema, RLS support |
| **Database** | PostgreSQL 16 + pgvector + PostGIS | Upgrade from current. PostGIS for facility geo-queries, pgvector for search |
| **Cache** | Redis 7 (Valkey) | Session store, queue pub/sub, rate limiting, cached lookups |
| **Search** | Meilisearch | Patient MPI fuzzy search, medicine catalogue, facility discovery |
| **Message Queue** | BullMQ (Redis-backed) | Job queue for notifications, sync, report generation, ABDM callbacks |
| **Real-time** | Socket.IO 4 | Already using. Extend for multi-room queue, alerts, sync status |
| **Frontend** | React 18 + Vite 5 + TypeScript | Already using. Keep |
| **UI Library** | MUI 6 (Material UI) | Already using. Extend with custom MCCPHP design tokens |
| **State** | Zustand + TanStack Query v5 | Zustand for local state, TanStack for server state/cache |
| **Forms** | React Hook Form + Zod | Zod for shared validation (front+back), RHF for form state |
| **i18n** | i18next + react-i18next | Marathi, Hindi, English with namespace-per-module |
| **Offline** | Dexie.js (IndexedDB) + Service Worker (Workbox) | Offline-first data + PWA shell caching |
| **Maps** | Leaflet + OpenStreetMap | Facility discovery, ambulance tracking, district maps |
| **Video** | LiveKit | Already using for teleconsult |
| **Charts** | Recharts | Dashboard visualizations |
| **PDF** | @react-pdf/renderer | Prescriptions, reports, referral letters |
| **FHIR** | Custom FHIR R4 builder + HAPI FHIR server | Already have HAPI Docker. Build FHIR resource mappers |
| **Testing** | Vitest + Playwright + Supertest | Unit, component, E2E, API tests |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy |
| **Containers** | Docker Compose (dev) | PostgreSQL, Redis, Meilisearch, HAPI FHIR, LiveKit |

---

## 2. Monorepo File/Folder Hierarchy

```
mccphp/
├── .github/
│   └── workflows/
│       ├── ci.yml                          # Lint + Test + Build
│       ├── deploy-staging.yml              # Deploy to staging
│       └── deploy-production.yml           # Deploy to production
├── .husky/
│   ├── pre-commit                          # lint-staged
│   └── commit-msg                          # commitlint
│
├── apps/                                   # ═══ 9 FRONTEND PORTALS ═══
│   ├── citizen-portal/                     # Patient / Citizen facing
│   │   ├── public/
│   │   │   ├── manifest.json               # PWA manifest
│   │   │   ├── sw.js                       # Service worker entry
│   │   │   └── locales/
│   │   │       ├── en/                     # English translations
│   │   │       ├── mr/                     # Marathi translations
│   │   │       └── hi/                     # Hindi translations
│   │   ├── src/
│   │   │   ├── App.tsx                     # Root with routing
│   │   │   ├── main.tsx                    # Entry point
│   │   │   ├── pages/
│   │   │   │   ├── Landing.tsx             # Public landing + facility finder
│   │   │   │   ├── Login.tsx               # OTP / ABHA login
│   │   │   │   ├── Register.tsx            # Self-registration with ABHA
│   │   │   │   ├── Dashboard.tsx           # Patient home dashboard
│   │   │   │   ├── FindCare.tsx            # Facility discovery with map
│   │   │   │   ├── BookAppointment.tsx     # Slot picker + specialty filter
│   │   │   │   ├── MyAppointments.tsx      # Upcoming + history
│   │   │   │   ├── LiveQueue.tsx           # Real-time queue tracker
│   │   │   │   ├── HealthRecords.tsx       # Longitudinal record timeline
│   │   │   │   ├── RecordDetail.tsx        # Single encounter/report detail
│   │   │   │   ├── Prescriptions.tsx       # Active + past prescriptions
│   │   │   │   ├── LabResults.tsx          # Diagnostic results
│   │   │   │   ├── Teleconsultation.tsx    # Video call interface
│   │   │   │   ├── WaitingRoom.tsx         # Pre-call device check + queue
│   │   │   │   ├── Consent.tsx             # Consent management
│   │   │   │   ├── Feedback.tsx            # Post-visit feedback
│   │   │   │   ├── Grievance.tsx           # Complaint registration
│   │   │   │   ├── Profile.tsx             # Demographics, language, ABHA
│   │   │   │   ├── Notifications.tsx       # Notification center
│   │   │   │   └── Schemes.tsx             # PMJAY/MJPJAY eligibility check
│   │   │   ├── components/
│   │   │   │   ├── PatientHeader.tsx        # Sticky patient context bar
│   │   │   │   ├── AppointmentCard.tsx      # Appointment list item
│   │   │   │   ├── QueueTracker.tsx         # Live token display
│   │   │   │   ├── RecordTimeline.tsx       # Chronological health record
│   │   │   │   ├── FacilityCard.tsx         # Facility search result card
│   │   │   │   ├── ConsentDialog.tsx        # Consent grant/revoke modal
│   │   │   │   ├── FeedbackForm.tsx         # Star rating + text
│   │   │   │   ├── GrievanceForm.tsx        # Complaint form
│   │   │   │   ├── SchemeChecker.tsx        # Insurance eligibility widget
│   │   │   │   └── LanguageSwitcher.tsx     # mr/hi/en toggle
│   │   │   └── hooks/
│   │   │       ├── useAppointments.ts
│   │   │       ├── useQueue.ts
│   │   │       ├── useHealthRecords.ts
│   │   │       └── useConsent.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── frontline-portal/                   # ASHA / ANM / CHO workstation
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx            # Village overview + KPIs
│   │   │   │   ├── PopulationRegistry.tsx   # Household/beneficiary list
│   │   │   │   ├── HouseholdDetail.tsx      # Family members, conditions
│   │   │   │   ├── BeneficiaryRegister.tsx  # New ABHA registration
│   │   │   │   ├── ScreeningForm.tsx        # CBAC, ANC, NCD screening
│   │   │   │   ├── TriageEngine.tsx         # 4-tier digital triage
│   │   │   │   ├── MaternalTracker.tsx      # ANC tracking + risk flags
│   │   │   │   ├── ChildHealth.tsx          # Immunization + growth
│   │   │   │   ├── ChronicCare.tsx          # NCD follow-up visits
│   │   │   │   ├── FollowUpList.tsx         # Due / overdue follow-ups
│   │   │   │   ├── ReferralCreate.tsx       # Create referral + transport
│   │   │   │   ├── ReferralTracker.tsx      # Track referral outcomes
│   │   │   │   ├── IncentiveLedger.tsx      # NHM incentive auto-claims
│   │   │   │   ├── MedicineKit.tsx          # ASHA kit inventory
│   │   │   │   ├── VHSNDCalendar.tsx        # Village Health Day planning
│   │   │   │   ├── SyncStatus.tsx           # Offline sync dashboard
│   │   │   │   └── Settings.tsx             # Language, offline data mgmt
│   │   │   ├── components/
│   │   │   │   ├── BeneficiaryCard.tsx       # Person summary card
│   │   │   │   ├── ScreeningWizard.tsx       # Step-by-step screening
│   │   │   │   ├── TriageResult.tsx          # Color-coded urgency display
│   │   │   │   ├── DangerSignAlert.tsx       # Red flag popup
│   │   │   │   ├── ANCTimeline.tsx           # Trimester progress
│   │   │   │   ├── ImmunizationSchedule.tsx  # Vaccine due-list
│   │   │   │   ├── FollowUpCard.tsx          # Follow-up task card
│   │   │   │   ├── IncentiveCard.tsx         # Incentive claim item
│   │   │   │   ├── OfflineBanner.tsx         # "Working offline" indicator
│   │   │   │   └── VoiceAssist.tsx           # Marathi voice prompts
│   │   │   └── offline/
│   │   │       ├── db.ts                     # Dexie IndexedDB schema
│   │   │       ├── syncEngine.ts             # Outbox queue + reconciliation
│   │   │       └── conflictResolver.ts       # Field-level merge
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── doctor-portal/                      # Medical Officer / Specialist workstation
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── OPDWorkstation.tsx        # Daily OPD queue + active patients
│   │   │   │   ├── EncounterCharting.tsx      # Full SOAP encounter
│   │   │   │   ├── ClinicalTimeline.tsx       # Patient longitudinal record
│   │   │   │   ├── Prescribe.tsx              # ePrescription writer
│   │   │   │   ├── DiagnosticOrders.tsx       # Lab/imaging order panel
│   │   │   │   ├── DiagnosticResults.tsx      # Results inbox
│   │   │   │   ├── ReferralInbox.tsx          # Incoming referrals to accept
│   │   │   │   ├── ReferralCreate.tsx         # Outgoing referral composer
│   │   │   │   ├── Teleconsult.tsx            # Video consultation room
│   │   │   │   ├── IPDWardView.tsx            # Inpatient bed board
│   │   │   │   ├── IPDAdmission.tsx           # Admission form
│   │   │   │   ├── IPDDailyNotes.tsx          # Daily progress notes
│   │   │   │   ├── IPDDischargeSummary.tsx    # Discharge form
│   │   │   │   ├── EmergencyCommand.tsx       # ED triage + resuscitation
│   │   │   │   ├── OTSchedule.tsx             # Surgery scheduling
│   │   │   │   ├── PatientDirectory.tsx       # Search all patients
│   │   │   │   ├── Schedule.tsx               # My OPD/IPD/OT schedule
│   │   │   │   ├── TaskCenter.tsx             # My pending tasks
│   │   │   │   └── Settings.tsx
│   │   │   ├── components/
│   │   │   │   ├── PatientHeader.tsx           # Clinical header bar (allergies, alerts)
│   │   │   │   ├── SOAPEditor.tsx              # Structured SOAP form
│   │   │   │   ├── VitalsPanel.tsx             # Vitals entry grid
│   │   │   │   ├── PrescriptionBuilder.tsx     # Drug search + sig builder
│   │   │   │   ├── DiagnosticOrderForm.tsx     # Test order form
│   │   │   │   ├── ResultsViewer.tsx           # Lab/imaging result display
│   │   │   │   ├── ReferralCard.tsx            # Referral summary card
│   │   │   │   ├── BedBoard.tsx                # Ward bed grid (IPD)
│   │   │   │   ├── AdmissionForm.tsx           # IPD admission wizard
│   │   │   │   ├── DischargeSummaryForm.tsx    # Discharge documentation
│   │   │   │   ├── EmergencyTriageForm.tsx     # ED triage assessment
│   │   │   │   ├── MedicationAdminRecord.tsx   # MAR for IPD
│   │   │   │   ├── ClinicalAlertBanner.tsx     # Drug interaction / allergy
│   │   │   │   └── ICDSearch.tsx               # ICD-10/11 code search
│   │   │   └── hooks/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── nursing-portal/                     # Nursing workstation
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── ShiftDashboard.tsx        # Ward census + my patients
│   │   │   │   ├── WardCensus.tsx            # Bed occupancy view
│   │   │   │   ├── TaskBoard.tsx             # Nursing tasks (meds, vitals, dressing)
│   │   │   │   ├── MedicationAdmin.tsx       # MAR - scan + administer
│   │   │   │   ├── VitalsRounding.tsx        # Vitals collection round
│   │   │   │   ├── NursingAssessment.tsx     # Admission/shift assessment
│   │   │   │   ├── HandoverSheet.tsx         # Shift handover documentation
│   │   │   │   ├── TriageNurse.tsx           # OPD/ED triage station
│   │   │   │   ├── WoundCare.tsx             # Wound assessment + photos
│   │   │   │   └── PatientEducation.tsx      # Discharge instructions
│   │   │   └── components/
│   │   │       ├── MARGrid.tsx                # Medication admin grid
│   │   │       ├── VitalsForm.tsx             # Quick vitals entry
│   │   │       ├── TaskCard.tsx               # Nursing task item
│   │   │       ├── HandoverForm.tsx           # SBAR handover
│   │   │       └── BedStatusChip.tsx          # Bed status indicator
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── admin-portal/                       # Facility Operations & Administration
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── FacilityDashboard.tsx      # Facility ops overview
│   │   │   │   ├── MedicineInventory.tsx      # EDL stock management
│   │   │   │   ├── PharmacyDispensing.tsx     # Dispensing workflow
│   │   │   │   ├── BloodBankMgmt.tsx          # Donor + inventory + cross-match
│   │   │   │   ├── EquipmentTracker.tsx       # Biomedical equipment
│   │   │   │   ├── BedManagement.tsx          # Ward/bed allocation
│   │   │   │   ├── StaffRoster.tsx            # Staff scheduling + attendance
│   │   │   │   ├── QualityIncidents.tsx       # Incident reporting + CAPA
│   │   │   │   ├── InfectionControl.tsx       # HAI surveillance
│   │   │   │   ├── PatientFeedback.tsx        # Feedback + grievance dashboard
│   │   │   │   ├── Procurement.tsx            # Purchase requests + PO
│   │   │   │   ├── Reports.tsx                # Facility-level reports
│   │   │   │   ├── UserManagement.tsx         # Staff accounts + roles
│   │   │   │   ├── ServiceConfig.tsx          # Facility services config
│   │   │   │   └── AuditLog.tsx               # Access audit trail viewer
│   │   │   └── components/
│   │   │       ├── InventoryTable.tsx
│   │   │       ├── StockAlertPanel.tsx
│   │   │       ├── DispensingForm.tsx
│   │   │       ├── BloodUnitCard.tsx
│   │   │       ├── BedMapGrid.tsx
│   │   │       ├── RosterCalendar.tsx
│   │   │       ├── IncidentForm.tsx
│   │   │       ├── CAPATracker.tsx
│   │   │       ├── ProcurementForm.tsx
│   │   │       └── AuditLogTable.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── district-command/                   # District Health Officer dashboard
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── DistrictDashboard.tsx      # KPI overview + facility network
│   │   │   │   ├── FacilityNetwork.tsx        # All facilities in district
│   │   │   │   ├── FacilityDetail.tsx         # Single facility deep-dive
│   │   │   │   ├── ReferralMonitor.tsx        # Cross-facility referral tracker
│   │   │   │   ├── DrugStockMonitor.tsx       # District-wide stock levels
│   │   │   │   ├── DiagnosticMonitor.tsx      # TAT + pending orders
│   │   │   │   ├── EpidemicSurveillance.tsx   # Disease outbreak alerts
│   │   │   │   ├── WorkforceMonitor.tsx       # Staff vacancies + attendance
│   │   │   │   ├── ProgrammeMonitor.tsx       # Public health programme KPIs
│   │   │   │   ├── AlertCenter.tsx            # Escalation inbox
│   │   │   │   ├── Reports.tsx                # District reports + export
│   │   │   │   └── DistrictMap.tsx            # GIS map of facilities
│   │   │   └── components/
│   │   │       ├── FacilityKPICard.tsx
│   │   │       ├── ReferralFlowDiagram.tsx
│   │   │       ├── StockHeatMap.tsx
│   │   │       ├── OutbreakAlertCard.tsx
│   │   │       ├── DistrictLeafletMap.tsx
│   │   │       └── KPIWidget.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── state-command/                      # State Command Centre
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── StateCommandDashboard.tsx  # Maharashtra-wide KPIs
│   │   │   │   ├── DistrictComparison.tsx     # District vs district analytics
│   │   │   │   ├── MaharashtraMap.tsx         # GIS state map with drill-down
│   │   │   │   ├── ReferralNetwork.tsx        # State referral flow analysis
│   │   │   │   ├── DrugSupplyChain.tsx        # State → District → Facility stock
│   │   │   │   ├── EpidemicCommand.tsx        # Outbreak command center
│   │   │   │   ├── ProgrammeAnalytics.tsx     # Programme-wise national targets
│   │   │   │   ├── WorkforceAnalytics.tsx     # State HR analytics
│   │   │   │   ├── AlertEscalation.tsx        # Unresolved district alerts
│   │   │   │   └── Reports.tsx                # State-level reports + PDF
│   │   │   └── components/
│   │   │       ├── StateMapViz.tsx             # Maharashtra choropleth
│   │   │       ├── DistrictRankTable.tsx       # District ranking table
│   │   │       ├── SupplyChainSankey.tsx       # Supply flow diagram
│   │   │       ├── EpidemicTimeline.tsx        # Outbreak timeline
│   │   │       └── KPIDashGrid.tsx             # KPI tile grid
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── platform-admin/                     # Platform administration
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx              # System health overview
│   │   │   │   ├── OrganizationMgmt.tsx       # State/Region/District orgs
│   │   │   │   ├── FacilityRegistry.tsx       # Facility CRUD + HFR sync
│   │   │   │   ├── DepartmentConfig.tsx       # Department registry
│   │   │   │   ├── ServiceCatalogue.tsx       # Service definitions
│   │   │   │   ├── RolePermissions.tsx        # Role catalogue + permissions
│   │   │   │   ├── UserAdmin.tsx              # User CRUD + credential verify
│   │   │   │   ├── WorkflowDesigner.tsx       # Workflow state machine config
│   │   │   │   ├── FormBuilder.tsx            # Screening/triage form config
│   │   │   │   ├── NotificationTemplates.tsx  # SMS/push template editor
│   │   │   │   ├── EscalationRules.tsx        # Alert rule configuration
│   │   │   │   ├── ProgrammeConfig.tsx        # Public health programme setup
│   │   │   │   ├── MedicineMaster.tsx         # Medicine catalogue / EDL
│   │   │   │   ├── DiagnosticCatalogue.tsx    # Test catalogue + LOINC
│   │   │   │   ├── ReferenceData.tsx          # ICD codes, specialties, etc.
│   │   │   │   ├── LanguageMgmt.tsx           # Translation management
│   │   │   │   ├── AuditDashboard.tsx         # System-wide audit viewer
│   │   │   │   ├── SystemHealth.tsx           # API metrics, error rates
│   │   │   │   └── FeatureFlags.tsx           # Feature toggle management
│   │   │   └── components/
│   │   │       ├── OrgTree.tsx                 # Hierarchical org tree
│   │   │       ├── RoleMatrix.tsx              # Permission matrix editor
│   │   │       ├── WorkflowGraph.tsx           # Visual state machine
│   │   │       ├── FormFieldEditor.tsx         # Drag-drop form builder
│   │   │       ├── TemplateEditor.tsx          # Notification template WYSIWYG
│   │   │       └── SystemMetricCard.tsx        # Health metric display
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── queue-display/                      # Queue TV Display (existing, enhanced)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── QueueBoard.tsx              # Multi-counter token display
│       │   │   ├── FacilityInfo.tsx            # Facility info + announcements
│       │   │   └── EmergencyAlert.tsx          # Emergency broadcast overlay
│       │   └── components/
│       │       ├── TokenDisplay.tsx
│       │       ├── CounterCard.tsx
│       │       ├── AnnouncementBanner.tsx
│       │       └── ClockWeather.tsx
│       ├── vite.config.ts
│       └── package.json
│
├── packages/                               # ═══ SHARED PACKAGES ═══
│   ├── ui/                                 # MCCPHP Design System
│   │   ├── src/
│   │   │   ├── theme/
│   │   │   │   ├── mccphpTheme.ts            # MUI theme with MCCPHP tokens
│   │   │   │   ├── colors.ts                 # Semantic color palette
│   │   │   │   ├── typography.ts             # Font stack (Inter/Noto Sans)
│   │   │   │   └── statusTokens.ts           # Clinical status colors
│   │   │   ├── layouts/
│   │   │   │   ├── AppShell.tsx              # Global UX shell (sidebar, header, alerts)
│   │   │   │   ├── DashboardLayout.tsx       # Dashboard container
│   │   │   │   ├── FormLayout.tsx            # Standard form page layout
│   │   │   │   └── SplitLayout.tsx           # Master-detail layout
│   │   │   ├── components/
│   │   │   │   ├── PatientHeader.tsx          # Universal patient context bar
│   │   │   │   ├── GlobalSearch.tsx           # Command palette (Ctrl+K)
│   │   │   │   ├── OrgSwitcher.tsx            # Organization / facility picker
│   │   │   │   ├── LanguageSwitcher.tsx       # mr/hi/en toggle
│   │   │   │   ├── ConnectionStatus.tsx       # Online/offline/syncing indicator
│   │   │   │   ├── AlertCenter.tsx            # Notification bell + drawer
│   │   │   │   ├── TaskCenter.tsx             # My tasks sidebar
│   │   │   │   ├── DataTable.tsx              # Universal table (sort, filter, export)
│   │   │   │   ├── StatusBadge.tsx            # Color-coded status chips
│   │   │   │   ├── StatCard.tsx               # KPI metric card
│   │   │   │   ├── TimelineView.tsx           # Chronological event list
│   │   │   │   ├── FormField.tsx              # Universal form field wrapper
│   │   │   │   ├── ConfirmDialog.tsx          # Confirmation modal
│   │   │   │   ├── EmptyState.tsx             # No-data illustration
│   │   │   │   ├── LoadingState.tsx           # Skeleton loaders
│   │   │   │   ├── ErrorState.tsx             # Error + retry
│   │   │   │   ├── OfflineState.tsx           # Offline message + last sync time
│   │   │   │   ├── PermissionDenied.tsx       # 403 state
│   │   │   │   ├── StaleDataWarning.tsx       # "Data may be outdated" banner
│   │   │   │   ├── LoginPage.tsx              # Universal login (OTP / email / ABHA)
│   │   │   │   └── AuditFooter.tsx            # Created/modified by stamps
│   │   │   └── index.ts                       # Barrel exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/                         # Typed API client for all portals
│   │   ├── src/
│   │   │   ├── client.ts                     # Axios instance + interceptors
│   │   │   ├── auth.api.ts
│   │   │   ├── patients.api.ts
│   │   │   ├── appointments.api.ts
│   │   │   ├── encounters.api.ts
│   │   │   ├── prescriptions.api.ts
│   │   │   ├── diagnostics.api.ts
│   │   │   ├── referrals.api.ts
│   │   │   ├── queue.api.ts
│   │   │   ├── inventory.api.ts
│   │   │   ├── facilities.api.ts
│   │   │   ├── organizations.api.ts
│   │   │   ├── users.api.ts
│   │   │   ├── triage.api.ts
│   │   │   ├── maternal.api.ts
│   │   │   ├── child.api.ts
│   │   │   ├── chronic.api.ts
│   │   │   ├── ipd.api.ts
│   │   │   ├── nursing.api.ts
│   │   │   ├── bloodbank.api.ts
│   │   │   ├── procurement.api.ts
│   │   │   ├── quality.api.ts
│   │   │   ├── grievances.api.ts
│   │   │   ├── consent.api.ts
│   │   │   ├── audit.api.ts
│   │   │   ├── reports.api.ts
│   │   │   ├── notifications.api.ts
│   │   │   ├── sync.api.ts
│   │   │   ├── programmes.api.ts
│   │   │   ├── ambulance.api.ts
│   │   │   └── analytics.api.ts
│   │   └── package.json
│   │
│   ├── shared-types/                       # TypeScript types shared across all apps
│   │   ├── src/
│   │   │   ├── models/                      # Domain model interfaces
│   │   │   │   ├── user.types.ts
│   │   │   │   ├── patient.types.ts
│   │   │   │   ├── facility.types.ts
│   │   │   │   ├── organization.types.ts
│   │   │   │   ├── encounter.types.ts
│   │   │   │   ├── appointment.types.ts
│   │   │   │   ├── referral.types.ts
│   │   │   │   ├── prescription.types.ts
│   │   │   │   ├── diagnostic.types.ts
│   │   │   │   ├── ipd.types.ts
│   │   │   │   ├── nursing.types.ts
│   │   │   │   ├── inventory.types.ts
│   │   │   │   ├── bloodbank.types.ts
│   │   │   │   ├── triage.types.ts
│   │   │   │   ├── programme.types.ts
│   │   │   │   ├── consent.types.ts
│   │   │   │   ├── audit.types.ts
│   │   │   │   ├── notification.types.ts
│   │   │   │   ├── workflow.types.ts
│   │   │   │   └── sync.types.ts
│   │   │   ├── enums/                       # All enum definitions
│   │   │   │   ├── roles.enum.ts            # 80+ roles
│   │   │   │   ├── facilityTypes.enum.ts
│   │   │   │   ├── encounterTypes.enum.ts
│   │   │   │   ├── referralStates.enum.ts   # 12-state machine
│   │   │   │   ├── appointmentStates.enum.ts
│   │   │   │   ├── triageUrgency.enum.ts
│   │   │   │   ├── consentStates.enum.ts
│   │   │   │   └── index.ts
│   │   │   ├── validators/                  # Zod schemas (shared validation)
│   │   │   │   ├── patient.schema.ts
│   │   │   │   ├── encounter.schema.ts
│   │   │   │   ├── prescription.schema.ts
│   │   │   │   ├── referral.schema.ts
│   │   │   │   ├── appointment.schema.ts
│   │   │   │   ├── triage.schema.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                               # Authentication + authorization library
│   │   ├── src/
│   │   │   ├── authContext.tsx               # React auth context provider
│   │   │   ├── useAuth.ts                    # Auth hook (login, logout, token)
│   │   │   ├── useAuthorization.ts           # 6D permission check hook
│   │   │   ├── permissionEngine.ts           # WHO/WHERE/WHAT/WHOSE/WHEN/WHY check
│   │   │   ├── roleDefinitions.ts            # Full role catalogue (80+ roles)
│   │   │   ├── scopeResolver.ts              # Geographic + facility scope resolution
│   │   │   └── breakGlass.ts                 # Emergency access override
│   │   └── package.json
│   │
│   ├── offline/                            # Offline-first engine
│   │   ├── src/
│   │   │   ├── offlineDb.ts                  # Dexie schema for IndexedDB
│   │   │   ├── syncEngine.ts                 # Bi-directional sync orchestrator
│   │   │   ├── outboxQueue.ts                # Durable outbox for pending writes
│   │   │   ├── conflictResolver.ts           # Field-level merge + user-mediated
│   │   │   ├── encryptionManager.ts          # AES-256 at-rest encryption
│   │   │   ├── serviceWorker.ts              # Workbox SW registration
│   │   │   ├── backgroundSync.ts             # Background sync handler
│   │   │   ├── dataMinimizer.ts              # Partial replication scoping
│   │   │   └── syncStatus.ts                 # Zustand store for sync state
│   │   └── package.json
│   │
│   ├── fhir/                               # FHIR R4 resource builders
│   │   ├── src/
│   │   │   ├── builders/
│   │   │   │   ├── patientBuilder.ts          # Patient → FHIR Patient
│   │   │   │   ├── encounterBuilder.ts        # Encounter → FHIR Encounter
│   │   │   │   ├── observationBuilder.ts      # Vitals → FHIR Observation
│   │   │   │   ├── medicationRequestBuilder.ts # Prescription → FHIR MedicationRequest
│   │   │   │   ├── diagnosticReportBuilder.ts  # Results → FHIR DiagnosticReport
│   │   │   │   ├── appointmentBuilder.ts
│   │   │   │   ├── conditionBuilder.ts
│   │   │   │   ├── serviceRequestBuilder.ts
│   │   │   │   ├── consentBuilder.ts
│   │   │   │   └── bundleBuilder.ts           # Transaction/Document bundles
│   │   │   ├── parsers/
│   │   │   │   ├── fhirPatientParser.ts
│   │   │   │   ├── fhirEncounterParser.ts
│   │   │   │   └── fhirBundleParser.ts
│   │   │   ├── abdm/
│   │   │   │   ├── abhaClient.ts              # ABHA creation/verification API
│   │   │   │   ├── hfrClient.ts               # Health Facility Registry sync
│   │   │   │   ├── hprClient.ts               # Healthcare Professional Registry
│   │   │   │   ├── hipService.ts              # Health Info Provider callbacks
│   │   │   │   ├── hiuService.ts              # Health Info User requests
│   │   │   │   └── consentManager.ts          # ABDM consent artifact handling
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── i18n/                               # Internationalization
│       ├── locales/
│       │   ├── en/
│       │   │   ├── common.json               # Common UI strings
│       │   │   ├── clinical.json             # Clinical terms
│       │   │   ├── auth.json                 # Auth-related strings
│       │   │   └── [module].json             # Per-module translations
│       │   ├── mr/                           # Marathi (same structure)
│       │   └── hi/                           # Hindi (same structure)
│       ├── src/
│       │   ├── i18nConfig.ts                 # i18next setup
│       │   └── useTranslation.ts             # Enhanced translation hook
│       └── package.json
│
├── backend/                                # ═══ API SERVER ═══
│   ├── prisma/
│   │   ├── schema.prisma                    # Main schema (55+ models)
│   │   ├── migrations/                      # Auto-generated migrations
│   │   └── seed/
│   │       ├── seed.ts                      # Master seed orchestrator
│   │       ├── facilities.seed.ts           # Maharashtra facility hierarchy
│   │       ├── organizations.seed.ts        # State/Region/District orgs
│   │       ├── users.seed.ts                # Demo users per role
│   │       ├── medicines.seed.ts            # Essential Drug List (EDL)
│   │       ├── diagnostics.seed.ts          # Test catalogue + LOINC
│   │       ├── icdCodes.seed.ts             # ICD-10/11 codes
│   │       └── roles.seed.ts                # Role + permission definitions
│   ├── src/
│   │   ├── index.ts                         # Server entry point
│   │   ├── config/
│   │   │   ├── database.ts                  # Prisma client
│   │   │   ├── redis.ts                     # Redis client
│   │   │   ├── search.ts                    # Meilisearch client
│   │   │   ├── queue.ts                     # BullMQ queue config
│   │   │   └── env.ts                       # Environment validation (Zod)
│   │   ├── middleware/
│   │   │   ├── auth.ts                      # JWT verification + user hydration
│   │   │   ├── authorization.ts             # 6D RBAC enforcement
│   │   │   ├── scopeGuard.ts                # Geographic/facility scope check
│   │   │   ├── auditLogger.ts               # Auto-log every API call
│   │   │   ├── rateLimiter.ts               # Redis-backed rate limiting
│   │   │   ├── errorHandler.ts              # Centralized error handler
│   │   │   ├── requestValidator.ts          # Zod request validation
│   │   │   ├── tenantResolver.ts            # Resolve org/facility from request
│   │   │   └── consentGuard.ts              # Verify patient consent before data access
│   │   ├── routes/                          # ═══ 30+ ROUTE MODULES ═══
│   │   │   ├── auth.routes.ts               # Login, register, OTP, token refresh
│   │   │   ├── users.routes.ts              # User CRUD, credential verification
│   │   │   ├── organizations.routes.ts      # Org hierarchy CRUD
│   │   │   ├── facilities.routes.ts         # Facility CRUD + capability matrix
│   │   │   ├── departments.routes.ts        # Department registry
│   │   │   ├── patients.routes.ts           # Patient CRUD + MPI search
│   │   │   ├── appointments.routes.ts       # Booking, waitlist, schedule mgmt
│   │   │   ├── queue.routes.ts              # Token generation, queue management
│   │   │   ├── triage.routes.ts             # Digital triage assessment
│   │   │   ├── encounters.routes.ts         # OPD/IPD/ED/teleconsult encounters
│   │   │   ├── prescriptions.routes.ts      # ePrescription CRUD
│   │   │   ├── diagnostics.routes.ts        # Lab/imaging orders + results
│   │   │   ├── referrals.routes.ts          # Referral lifecycle (12 states)
│   │   │   ├── teleconsult.routes.ts        # LiveKit session management
│   │   │   ├── ipd.routes.ts                # Admission, daily notes, discharge
│   │   │   ├── nursing.routes.ts            # Nursing tasks, MAR, assessments
│   │   │   ├── maternal.routes.ts           # ANC/PNC tracking
│   │   │   ├── child.routes.ts              # Immunization + growth
│   │   │   ├── chronic.routes.ts            # NCD follow-up
│   │   │   ├── programmes.routes.ts         # Public health programme config + data
│   │   │   ├── inventory.routes.ts          # Medicine stock + FEFO
│   │   │   ├── pharmacy.routes.ts           # Dispensing workflow
│   │   │   ├── bloodbank.routes.ts          # Blood bank full lifecycle
│   │   │   ├── procurement.routes.ts        # Purchase request → PO → receipt
│   │   │   ├── equipment.routes.ts          # Biomedical equipment CRUD
│   │   │   ├── bed.routes.ts                # Bed management + housekeeping
│   │   │   ├── workforce.routes.ts          # Staff roster, attendance, credentials
│   │   │   ├── quality.routes.ts            # Incident reporting, CAPA, RCA
│   │   │   ├── infection.routes.ts          # HAI surveillance, antibiogram
│   │   │   ├── grievances.routes.ts         # Complaint lifecycle
│   │   │   ├── consent.routes.ts            # Consent CRUD + DPDP compliance
│   │   │   ├── audit.routes.ts              # Audit log queries
│   │   │   ├── notifications.routes.ts      # Notification CRUD + send
│   │   │   ├── reports.routes.ts            # Report generation + export
│   │   │   ├── analytics.routes.ts          # Dashboard aggregation queries
│   │   │   ├── sync.routes.ts               # Offline sync upload/download
│   │   │   ├── ambulance.routes.ts          # Ambulance dispatch + tracking
│   │   │   ├── fhir.routes.ts               # FHIR resource endpoints
│   │   │   ├── abdm.routes.ts               # ABDM gateway callbacks (HIP/HIU)
│   │   │   ├── schemes.routes.ts            # PMJAY/MJPJAY verification
│   │   │   ├── config.routes.ts             # Platform configuration CRUD
│   │   │   └── search.routes.ts             # Global search (patients, facilities)
│   │   ├── services/                        # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── patient.service.ts           # Includes MPI duplicate detection
│   │   │   ├── appointment.service.ts       # Includes waitlist engine
│   │   │   ├── queue.service.ts             # Multi-queue type management
│   │   │   ├── triage.service.ts            # 4-tier clinical triage engine
│   │   │   ├── encounter.service.ts
│   │   │   ├── prescription.service.ts      # Drug interaction check
│   │   │   ├── referral.service.ts          # 12-state machine + SLA tracking
│   │   │   ├── ipd.service.ts               # Admission → Discharge workflow
│   │   │   ├── nursing.service.ts
│   │   │   ├── inventory.service.ts         # FEFO + shortage prediction
│   │   │   ├── pharmacy.service.ts          # Dispensing + verification
│   │   │   ├── bloodbank.service.ts         # Donor → Collection → Issue
│   │   │   ├── diagnostics.service.ts       # TAT tracking + critical alerts
│   │   │   ├── consent.service.ts           # Grant/revoke/verify
│   │   │   ├── notification.service.ts      # SMS/Push/In-app dispatcher
│   │   │   ├── workflow.service.ts          # Configurable workflow engine
│   │   │   ├── alert.service.ts             # Alert trigger + escalation
│   │   │   ├── report.service.ts            # Report generation engine
│   │   │   ├── sync.service.ts              # Sync conflict resolution
│   │   │   ├── mpi.service.ts               # Master Patient Index
│   │   │   ├── fhir.service.ts              # FHIR bundle generation
│   │   │   └── abdm.service.ts              # ABDM M1/M2/M3 orchestration
│   │   ├── jobs/                            # Background job processors
│   │   │   ├── notificationSender.job.ts    # SMS/Push delivery
│   │   │   ├── reportGenerator.job.ts       # Scheduled report gen
│   │   │   ├── syncProcessor.job.ts         # Offline sync batch processing
│   │   │   ├── alertEscalator.job.ts        # Time-based escalation
│   │   │   ├── stockAlertChecker.job.ts     # Daily stock level scan
│   │   │   ├── followUpReminder.job.ts      # Due follow-up notifications
│   │   │   ├── dailyStats.job.ts            # Facility daily stats aggregation
│   │   │   └── abdmSync.job.ts              # ABDM data push
│   │   ├── events/                          # Domain event system
│   │   │   ├── eventBus.ts                  # Event emitter + handler registry
│   │   │   ├── events.ts                    # Event type definitions
│   │   │   ├── handlers/
│   │   │   │   ├── onEncounterCompleted.ts   # Generate FHIR, trigger follow-up
│   │   │   │   ├── onReferralCreated.ts      # Notify target facility
│   │   │   │   ├── onStockLow.ts             # Trigger stock alert
│   │   │   │   ├── onPatientRegistered.ts    # ABHA verification
│   │   │   │   ├── onCriticalResult.ts       # Alert ordering doctor
│   │   │   │   └── onConsentChanged.ts       # Audit + propagate
│   │   │   └── index.ts
│   │   └── socket/
│   │       ├── index.ts                     # Socket.IO setup + auth
│   │       ├── queueRoom.ts                 # Per-facility queue rooms
│   │       ├── alertRoom.ts                 # Alert broadcast
│   │       └── syncRoom.ts                  # Sync status updates
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
│
├── docker/                                 # ═══ INFRASTRUCTURE ═══
│   ├── docker-compose.yml                  # Full dev stack
│   ├── docker-compose.prod.yml
│   ├── postgres/
│   │   └── init.sql                        # Extensions: uuid-ossp, pgcrypto, PostGIS
│   ├── redis/
│   │   └── redis.conf
│   └── hapi-fhir/
│       └── application.yaml               # HAPI FHIR R4 config
│
├── docs/                                   # ═══ DOCUMENTATION ═══
│   ├── architecture.md                     # System architecture overview
│   ├── database.md                         # Schema documentation
│   ├── api-reference.md                    # REST API docs
│   ├── deployment.md                       # Deployment guide
│   ├── security.md                         # Security architecture
│   ├── offline-sync.md                     # Offline sync protocol
│   ├── abdm-integration.md                 # ABDM integration guide
│   └── user-guides/                        # Per-portal user guides
│
├── turbo.json                              # Turborepo pipeline config
├── pnpm-workspace.yaml                     # Workspace definitions
├── package.json                            # Root package.json
├── tsconfig.base.json                      # Base TS config
├── .env.example                            # Environment template
└── README.md
```

**File count estimate:** ~450+ source files across the monorepo.

---

## 3. Database Schema (55+ Tables)

### 3.1 Core Identity & Governance (8 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `organizations` | State/Region/District orgs | `id`, `name`, `type` (STATE/REGION/DISTRICT), `parent_id`, `code`, `is_active` |
| `facilities` | Healthcare facilities | `id`, `org_id`, `hfr_id`, `name`, `type` (SC/PHC/CHC/SDH/DH/MC), `parent_facility_id`, `latitude`, `longitude`, `district`, `taluka`, `bed_count`, `icu_beds`, `ot_count`, `services[]`, `operating_hours`, `connectivity_level` |
| `departments` | Facility departments | `id`, `facility_id`, `name`, `code`, `type` (CLINICAL/ADMIN/SUPPORT), `head_user_id`, `is_active` |
| `users` | All platform users | `id`, `abha_id`, `full_name`, `phone`, `email`, `role`, `facility_id`, `department_id`, `specialization`, `license_number`, `credential_status`, `language_pref`, `is_active` |
| `roles` | Role definitions | `id`, `name`, `code`, `family` (CLINICAL/ADMIN/FRONTLINE/SUPPORT), `permissions[]`, `scope_type`, `description` |
| `user_roles` | User-role assignments | `id`, `user_id`, `role_id`, `facility_id`, `department_id`, `valid_from`, `valid_until`, `assigned_by` |
| `permissions` | Granular permissions | `id`, `resource`, `action` (CREATE/READ/UPDATE/DELETE), `scope`, `conditions` |
| `user_sessions` | JWT session tracking | `id`, `user_id`, `token_hash`, `device_info`, `ip_address`, `expires_at`, `revoked_at` |

### 3.2 Patient & Consent (5 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `patients` | Patient demographics | `id`, `abha_id`, `abha_address`, `full_name`, `dob`, `gender`, `phone`, `guardian_name`, `village`, `taluka`, `district`, `blood_group`, `allergies[]`, `chronic_conditions[]`, `is_high_risk`, `registered_facility_id`, `mpi_cluster_id` |
| `patient_identifiers` | Multiple IDs per patient | `id`, `patient_id`, `type` (ABHA/AADHAAR/RATION_CARD/BPL), `value`, `verified_at` |
| `consents` | DPDP consent records | `id`, `patient_id`, `type` (TREATMENT/DATA_SHARING/TELECONSULT/RESEARCH), `status` (REQUESTED/GRANTED/DENIED/REVOKED), `granted_to_org_id`, `purpose`, `valid_from`, `valid_until`, `granted_at`, `revoked_at`, `revocation_reason` |
| `consent_audit` | Consent access log | `id`, `consent_id`, `action`, `performed_by`, `timestamp`, `details` |
| `mpi_clusters` | Duplicate patient groups | `id`, `primary_patient_id`, `confidence_score`, `status` (POTENTIAL/CONFIRMED/REJECTED), `reviewed_by` |

### 3.3 Appointment & Queue (4 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `appointments` | Scheduled visits | `id`, `patient_id`, `facility_id`, `department_id`, `provider_id`, `type` (OPD/TELECONSULT/FOLLOW_UP/VACCINATION/ANC/PROCEDURE), `scheduled_date`, `scheduled_time`, `slot_duration_mins`, `token_number`, `status` (BOOKED/WAITLISTED/CONFIRMED/CHECKED_IN/IN_PROGRESS/COMPLETED/CANCELLED/NO_SHOW), `booked_via`, `referral_id`, `waitlist_position` |
| `schedule_slots` | Provider availability | `id`, `provider_id`, `facility_id`, `department_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_mins`, `max_patients`, `is_active` |
| `queue_entries` | Real-time queue | `id`, `facility_id`, `department_id`, `queue_type` (REGISTRATION/OPD/LAB/RADIOLOGY/PHARMACY/PROCEDURE), `patient_id`, `appointment_id`, `token_number`, `counter`, `priority`, `status` (WAITING/CALLED/IN_SERVICE/DONE/SKIPPED), `estimated_wait_mins`, `entered_at`, `called_at`, `completed_at` |
| `waitlist` | Appointment waitlist | `id`, `patient_id`, `facility_id`, `department_id`, `requested_date_range`, `priority`, `status`, `notified_at` |

### 3.4 Clinical (10 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `encounters` | Every clinical interaction | `id`, `patient_id`, `facility_id`, `department_id`, `provider_id`, `type` (OPD/TELECONSULT/HOME_VISIT/EMERGENCY/IPD_DAILY/IPD_ADMISSION/IPD_DISCHARGE), `status`, `chief_complaint`, `clinical_notes`, `soap_subjective`, `soap_objective`, `soap_assessment`, `soap_plan`, `diagnosis_icd[]`, `diagnosis_snomed[]`, `triage_id`, `referral_id`, `admission_id` |
| `patient_vitals` | Vital measurements | `id`, `patient_id`, `encounter_id`, `recorded_by`, `facility_id`, `bp_systolic`, `bp_diastolic`, `heart_rate`, `temperature`, `spo2`, `respiratory_rate`, `weight`, `height`, `bmi`, `blood_sugar_fasting`, `blood_sugar_pp`, `recorded_at` |
| `triage_assessments` | Digital triage | `id`, `patient_id`, `assessed_by`, `facility_id`, `symptoms`, `symptom_duration_days`, `urgency_level` (EMERGENCY/URGENT/SEMI_URGENT/NON_URGENT), `recommended_action`, `algorithm_version`, `confidence_score`, `override_by`, `override_reason` |
| `prescriptions` | Prescription headers | `id`, `encounter_id`, `patient_id`, `prescribed_by`, `facility_id`, `status`, `fhir_resource_id` |
| `prescription_items` | Individual medications | `id`, `prescription_id`, `medicine_id`, `medicine_name`, `dosage`, `frequency`, `duration_days`, `route`, `instructions`, `is_dispensed`, `dispensed_by`, `dispensed_at` |
| `diagnostic_orders` | Lab/imaging orders | `id`, `encounter_id`, `patient_id`, `ordered_by`, `ordering_facility_id`, `performing_facility_id`, `test_name`, `test_code_loinc`, `category` (LAB/RADIOLOGY/PATHOLOGY), `priority`, `status` (ORDERED/SAMPLE_COLLECTED/SAMPLE_IN_TRANSIT/IN_PROGRESS/COMPLETED/VALIDATED/CANCELLED), `sample_barcode`, `tat_target_hours` |
| `diagnostic_results` | Test results | `id`, `order_id`, `patient_id`, `reported_by`, `facility_id`, `result_data`, `result_text`, `is_abnormal`, `is_critical`, `report_file_url`, `validated_by`, `validated_at` |
| `clinical_alerts` | Drug interactions, allergy alerts | `id`, `patient_id`, `type` (ALLERGY/DRUG_INTERACTION/CRITICAL_RESULT/SAFETY), `severity`, `message`, `trigger_source`, `acknowledged_by`, `acknowledged_at` |
| `clinical_documents` | Uploaded photos, reports | `id`, `patient_id`, `encounter_id`, `type`, `file_url`, `file_name`, `uploaded_by` |
| `teleconsult_sessions` | Video call sessions | `id`, `encounter_id`, `livekit_room_id`, `patient_joined_at`, `provider_joined_at`, `ended_at`, `duration_seconds`, `quality_score`, `consent_id` |

### 3.5 IPD / Inpatient (5 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `admissions` | IPD admissions | `id`, `patient_id`, `facility_id`, `department_id`, `admitting_doctor_id`, `bed_id`, `admission_type` (ELECTIVE/EMERGENCY/TRANSFER), `admitted_at`, `discharged_at`, `discharge_type`, `status` (ADMITTED/TRANSFERRED/DISCHARGED/LAMA/ABSCONDED/EXPIRED) |
| `beds` | Bed registry | `id`, `facility_id`, `ward_id`, `bed_number`, `type` (GENERAL/ICU/NICU/PICU/HDU/ISOLATION), `status` (AVAILABLE/OCCUPIED/MAINTENANCE/BLOCKED), `current_patient_id` |
| `wards` | Ward definitions | `id`, `facility_id`, `name`, `type`, `total_beds`, `department_id` |
| `daily_notes` | IPD daily progress notes | `id`, `admission_id`, `encounter_id`, `note_type` (PROGRESS/NURSING/DIET/PHYSIOTHERAPY), `content`, `written_by` |
| `discharge_summaries` | Discharge documentation | `id`, `admission_id`, `patient_id`, `diagnosis_at_admission`, `diagnosis_at_discharge`, `procedures_done`, `condition_at_discharge`, `medications_on_discharge`, `follow_up_instructions`, `prepared_by`, `verified_by` |

### 3.6 Nursing (3 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `nursing_tasks` | Task assignments | `id`, `admission_id`, `patient_id`, `assigned_to`, `type` (MEDICATION/VITALS/DRESSING/CATHETER/MONITORING), `scheduled_at`, `completed_at`, `status`, `notes` |
| `medication_admin_records` | MAR entries | `id`, `admission_id`, `patient_id`, `prescription_item_id`, `administered_by`, `scheduled_time`, `actual_time`, `dose_given`, `status` (GIVEN/HELD/REFUSED/NOT_AVAILABLE), `reason`, `witness_id` |
| `nursing_assessments` | Nursing evaluations | `id`, `admission_id`, `patient_id`, `assessed_by`, `assessment_type` (ADMISSION/SHIFT/WOUND/PAIN/FALL_RISK), `data`, `score`, `created_at` |

### 3.7 Referral & Transport (3 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `referrals` | Referral lifecycle | `id`, `referral_code`, `patient_id`, `source_facility_id`, `source_provider_id`, `target_facility_id`, `target_provider_id`, `encounter_id`, `referral_reason`, `urgency`, `status` (INITIATED/ACCEPTED/APPOINTMENT_BOOKED/TRANSPORT_REQUESTED/IN_TRANSIT/ARRIVED/CONSULTATION_DONE/REPORT_SENT/COMPLETED/REJECTED/CANCELLED/ABANDONED), `sla_acceptance_hours`, `sla_appointment_hours`, `accepted_at`, `appointment_booked_at`, `arrived_at`, `completed_at`, `clinical_summary`, `status_history` |
| `ambulance_trips` | Transport tracking | `id`, `referral_id`, `patient_id`, `vehicle_number`, `driver_phone`, `pickup_facility_id`, `drop_facility_id`, `status` (DISPATCHED/EN_ROUTE_PICKUP/PATIENT_LOADED/EN_ROUTE_HOSPITAL/ARRIVED/COMPLETED), `dispatched_at`, `arrived_at`, `gps_track` |
| `ambulance_vehicles` | Fleet registry | `id`, `vehicle_number`, `type` (BLS/ALS), `base_facility_id`, `driver_name`, `driver_phone`, `status` (AVAILABLE/ON_TRIP/MAINTENANCE), `current_lat`, `current_lng` |

### 3.8 Programme & Community Health (4 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `programmes` | Public health programme definitions | `id`, `name`, `code` (MATERNAL/CHILD_HEALTH/NCD/TB/MENTAL_HEALTH/VECTOR_BORNE), `screening_form_config`, `follow_up_rules`, `kpi_definitions`, `is_active` |
| `programme_enrollments` | Patient-programme enrolment | `id`, `programme_id`, `patient_id`, `enrolled_by`, `facility_id`, `enrolled_at`, `status`, `risk_level`, `assigned_worker_id` |
| `maternal_records` | ANC/PNC tracking | `id`, `patient_id`, `enrollment_id`, `gravida`, `para`, `lmp`, `edd`, `risk_level`, `anc_visits[]`, `tt_doses`, `iron_folic`, `delivery_type`, `delivery_facility_id`, `delivery_date`, `outcome` |
| `immunization_records` | Child vaccination | `id`, `patient_id`, `enrollment_id`, `vaccine_name`, `dose_number`, `scheduled_date`, `given_date`, `given_by`, `batch_number`, `status` |

### 3.9 Supply Chain & Operations (7 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `medicines` | Medicine master catalogue | `id`, `generic_name`, `brand_name`, `form`, `strength`, `category`, `is_essential`, `edl_level` (SC/PHC/CHC), `requires_prescription`, `schedule` (H/X) |
| `medicine_stock` | Facility stock levels | `id`, `facility_id`, `medicine_id`, `batch_number`, `expiry_date`, `current_quantity`, `reorder_level`, `unit` |
| `stock_transactions` | Inventory audit trail | `id`, `stock_id`, `type` (RECEIVED/DISPENSED/EXPIRED/TRANSFERRED/ADJUSTED), `quantity`, `reference_id`, `performed_by` |
| `procurement_requests` | Purchase requests | `id`, `facility_id`, `requested_by`, `items[]`, `status` (DRAFT/SUBMITTED/APPROVED/PO_GENERATED/RECEIVED/CANCELLED), `approved_by`, `po_number` |
| `equipment` | Biomedical equipment | `id`, `facility_id`, `name`, `type`, `serial_number`, `manufacturer`, `status` (OPERATIONAL/UNDER_REPAIR/CONDEMNED), `last_maintenance`, `next_calibration` |
| `blood_bank_inventory` | Blood component stock | `id`, `facility_id`, `blood_group`, `component` (WHOLE_BLOOD/PRBC/FFP/PLATELETS), `unit_number`, `collection_date`, `expiry_date`, `status` (AVAILABLE/RESERVED/ISSUED/EXPIRED/DISCARDED), `donor_id` |
| `blood_donors` | Donor registry | `id`, `name`, `phone`, `blood_group`, `last_donation_date`, `total_donations`, `is_eligible` |

### 3.10 Quality, Safety & Grievances (4 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `incidents` | Safety incident reports | `id`, `facility_id`, `reported_by`, `type` (MEDICATION_ERROR/FALL/INFECTION/NEEDLE_STICK/EQUIPMENT_FAILURE/OTHER), `severity` (NEAR_MISS/MINOR/MODERATE/MAJOR/SENTINEL), `description`, `patient_id`, `status` (REPORTED/UNDER_REVIEW/CAPA_ASSIGNED/RESOLVED), `root_cause`, `capa_actions` |
| `capa_actions` | Corrective/preventive | `id`, `incident_id`, `action_description`, `assigned_to`, `due_date`, `status`, `completed_at`, `verified_by` |
| `grievances` | Patient complaints | `id`, `patient_id`, `facility_id`, `type` (CLINICAL/ADMINISTRATIVE/INFRASTRUCTURE/BEHAVIOR), `description`, `status` (REGISTERED/ACKNOWLEDGED/INVESTIGATING/RESOLVED/ESCALATED), `priority`, `sla_hours`, `assigned_to`, `resolution_notes` |
| `patient_feedback` | Post-visit feedback | `id`, `patient_id`, `encounter_id`, `facility_id`, `overall_rating`, `wait_time_rating`, `care_quality_rating`, `facility_rating`, `comments`, `created_at` |

### 3.11 Notifications, Audit & Sync (5 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `notifications` | All notifications | `id`, `recipient_user_id`, `recipient_patient_id`, `channel` (SMS/WHATSAPP/PUSH/IN_APP), `category`, `title`, `body`, `language`, `status`, `template_id`, `reference_type`, `reference_id`, `sent_at`, `read_at` |
| `notification_templates` | Message templates | `id`, `code`, `channel`, `language`, `subject_template`, `body_template`, `variables[]` |
| `audit_log` | Immutable audit trail | `id` (BIGSERIAL), `user_id`, `action` (CREATE/READ/UPDATE/DELETE/LOGIN/EXPORT/CONSENT_GRANT/BREAK_GLASS), `resource_type`, `resource_id`, `facility_id`, `ip_address`, `user_agent`, `details`, `created_at` |
| `sync_queue` | Offline sync queue | `id`, `device_id`, `user_id`, `entity_type`, `entity_id`, `operation`, `payload`, `client_timestamp`, `server_timestamp`, `sync_status`, `conflict_resolution`, `retry_count` |
| `facility_daily_stats` | Aggregated daily KPIs | `id`, `facility_id`, `stat_date`, `total_patients_seen`, `total_teleconsults`, `total_referrals_sent`, `referrals_completed`, `avg_wait_time`, `medicines_out_of_stock`, `high_risk_active`, `follow_ups_completed`, `follow_ups_overdue` |

### 3.12 Configuration (3 tables)

| Table | Purpose | Key Columns |
|---|---|---|
| `workflow_definitions` | Configurable workflows | `id`, `entity_type` (REFERRAL/APPOINTMENT/PROCUREMENT/GRIEVANCE), `states[]`, `transitions[]`, `sla_rules`, `escalation_rules`, `version`, `is_active` |
| `form_definitions` | Configurable forms/screens | `id`, `code`, `name`, `fields[]`, `validation_rules`, `conditional_visibility`, `version` |
| `alert_rules` | Escalation rule config | `id`, `trigger_type`, `condition`, `severity`, `notification_targets[]`, `escalation_after_mins`, `escalation_to`, `is_active` |

**Total: 58 tables**

---

## 4. Backend API Architecture

### Route Module Summary (40 route files → 250+ endpoints)

Each route module follows the pattern:
```
POST   /api/{resource}          → Create
GET    /api/{resource}          → List (with pagination, filters)
GET    /api/{resource}/:id      → Get by ID
PUT    /api/{resource}/:id      → Update
DELETE /api/{resource}/:id      → Soft delete
PATCH  /api/{resource}/:id/status → State transition
```

Plus domain-specific endpoints like `POST /api/referrals/:id/accept`, `POST /api/queue/:id/call`, etc.

---

## 5. Authorization Engine (6D RBAC)

Every API request is checked against 6 dimensions:

| Dimension | Question | Implementation |
|---|---|---|
| **WHO** | What role does the user hold? | `roles` + `user_roles` tables, checked in `authorization.ts` middleware |
| **WHERE** | Which org/facility/department? | `scopeGuard.ts` — user's assigned facility/org resolves accessible scope |
| **WHAT** | Which resource + action? | `permissions` table — resource + action matrix per role |
| **WHOSE** | Which patient's data? | Patient assignment check — is this patient assigned/consented? |
| **WHEN** | Is the access time-valid? | `valid_from` / `valid_until` on `user_roles`, shift-time checks |
| **WHY** | Clinical reason for access? | `consentGuard.ts` — break-glass requires reason logging |

---

## 6. Frontend Portal Specifications

### 6.1 Citizen Portal — Key Screens

#### Dashboard (`/dashboard`)
- **Header**: Patient name, ABHA ID, profile photo avatar
- **Widgets**: Next appointment card (date, time, facility, doctor), Active prescriptions count, Pending lab results count, Unread notifications badge
- **Quick Actions**: 4 buttons — "Book Appointment", "Find Nearest Facility", "View Health Records", "Start Teleconsult"
- **Recent Activity**: Timeline of last 5 encounters/appointments with status chips

#### Find Care (`/find-care`)
- **Search Bar**: Text input "Search by facility name, specialty, or service"
- **Filters**: Facility type dropdown (PHC/CHC/DH), District dropdown, Services checkboxes (OPD, Lab, X-Ray, Blood Bank, ICU), Distance slider (5-50 km)
- **Map View**: Leaflet map with facility markers (color-coded by type), user location pin
- **List View**: Toggle to card list — each card shows: Facility name, Type badge, Distance, Available services icons, "Book" button
- **Facility Detail Modal**: Operating hours table, Available doctors list, Service availability matrix, Directions button (Google Maps link)

#### Book Appointment (`/book`)
- **Step 1 — Facility**: Pre-filled from Find Care or dropdown selector
- **Step 2 — Service/Department**: Specialty cards (General OPD, Dental, Eye, ENT, Gynecology, Pediatrics)
- **Step 3 — Doctor**: Doctor cards with photo, name, qualification, available slots count
- **Step 4 — Date/Time**: Calendar picker showing available dates (green), fully booked (gray). Time slot grid (9:00 AM, 9:15 AM, etc.)
- **Step 5 — Confirm**: Summary card with all details, "Confirm Booking" primary button, "Add to Waitlist" secondary button if no slots
- **Success Screen**: Token number display, QR code for check-in, "Add to Calendar" button, "Share via WhatsApp" button

#### Health Records (`/records`)
- **Timeline View**: Chronological list of all encounters, grouped by year. Each entry shows: Date, Facility name, Doctor name, Diagnosis, Type badge (OPD/Teleconsult/IPD)
- **Record Detail**: SOAP notes (if shared by doctor), Vitals table, Prescriptions with download button, Lab results with abnormal flags (red highlight), Referral details
- **Filters**: Date range picker, Facility filter, Type filter (All/OPD/Teleconsult/Lab/IPD)
- **Export**: "Download as PDF" button, "Share via ABHA" button (ABDM HIE)

### 6.2 Frontline Portal — Key Screens

#### Village Overview Dashboard (`/`)
- **Header**: ASHA/ANM name, Assigned village, Last sync time with indicator (green/orange/red)
- **KPI Row**: 4 stat cards — Total beneficiaries, Pregnant women tracked, Children due immunization, Overdue follow-ups (red badge)
- **Today's Tasks**: Prioritized list — overdue (red), due today (orange), upcoming (blue). Each task card: Beneficiary name, Task type icon, Due date, Tap to navigate
- **Quick Actions**: "Register New Beneficiary", "Screen Patient", "Record Home Visit", "Emergency Referral"
- **Sync Button**: Manual sync trigger with progress indicator and last sync timestamp

#### Triage Engine (`/triage`)
- **Step 1 — Chief Complaint**: Category buttons (Fever, Pain, Breathing Difficulty, Pregnancy, Child Illness, Injury, Other) + free text
- **Step 2 — Symptom Checklist**: Conditional questions based on complaint. Toggle switches for danger signs. Duration picker (hours/days/weeks)
- **Step 3 — Vitals** (if available): BP, Temp, SpO2, Heart Rate, Blood Sugar entry fields
- **Step 4 — Result**: Full-screen color display:
  - 🔴 **RED**: "EMERGENCY — Call 108 Immediately". One-tap 108 call button + auto-referral creation
  - 🟠 **AMBER**: "URGENT — Schedule Teleconsult Now". "Start Teleconsult" button + CHC referral option
  - 🟡 **YELLOW**: "Semi-Urgent — Book PHC Visit". "Book Appointment" button with next available slot
  - 🟢 **GREEN**: "Routine — Local Care". Dispense from ASHA kit + set follow-up reminder
- **Override**: Doctor/CHO can override triage with reason (requires credential)

### 6.3 Doctor Portal — Key Screens

#### OPD Workstation (`/`)
- **Queue Panel** (left sidebar): Today's patients list sorted by token. Each row: Token #, Patient name, Age/Gender, Wait time, Triage urgency color dot. Click to load patient
- **Patient Panel** (center): Patient header bar (name, ABHA, age, gender, allergies in red, chronic conditions). Tabs: Current Encounter | Timeline | Vitals | Prescriptions | Labs | Referrals
- **Current Encounter**: SOAP editor with structured fields. "Add Vitals" expanding panel. Diagnosis search with ICD-10 typeahead. "Prescribe" button → opens prescription builder. "Order Test" button → opens diagnostic order form. "Refer" button → opens referral composer
- **Action Bar** (bottom): "Save Draft", "Complete & Sign" (primary), "Next Patient"

#### Prescription Builder (`/prescribe`)
- **Drug Search**: Typeahead search against medicine master (generic name, brand, strength)
- **Quick Picks**: Expandable panel with common regimens: "Fever Protocol", "URI Protocol", "HTN Start", "DM Start"
- **Medication Row**: Drug name (auto-filled), Dosage dropdown, Frequency selector (OD/BD/TDS/QID/SOS/custom "1-0-1" notation), Duration number + unit (days/weeks/months), Route dropdown (Oral/IV/IM/Topical/Inhaled), Instructions text field
- **Add More**: "+ Add Medicine" button for multiple items
- **Safety Checks**: Real-time allergy cross-check (red banner if match), Drug interaction warning (yellow banner)
- **Bilingual Preview**: Prescription preview in English + Marathi side-by-side
- **Footer**: "Cancel", "Save Prescription" (primary), "Save & Dispense" (if pharmacy connected)

#### IPD Ward View (`/ipd`)
- **Ward Selector**: Tab bar or dropdown for each ward (General Male, General Female, ICU, Pediatrics, Maternity)
- **Bed Board Grid**: Visual grid of beds. Color-coded: Green = Available, Blue = Occupied, Red = Critical, Gray = Maintenance. Each occupied bed shows: Patient name, Admission day count, Primary diagnosis
- **Click on Bed**: Opens patient detail panel with: Admission summary, Today's orders, Vitals trend chart, Medication schedule, "Write Daily Note" button, "Plan Discharge" button
- **Admit Button**: "+ New Admission" opens admission wizard

### 6.4 Admin Portal — Key Screens

#### Facility Dashboard (`/`)
- **Header**: Facility name, Type badge, Today's date
- **KPI Grid**: 8 metric cards — Patients today, Avg wait time, Bed occupancy %, Active admissions, Referrals pending, Medicines below reorder, Equipment needing maintenance, Staff on duty
- **Alerts Panel**: Scrolling list of active alerts (stock low, equipment down, unresolved incidents)
- **Quick Links**: Grid of 8 module icons linking to sub-pages

#### Medicine Inventory (`/inventory`)
- **Search & Filter**: Search by drug name, Filter by category/EDL level/stock status
- **Table**: Drug name, Generic name, Current stock, Reorder level, Expiry date (red if <30 days), Batch #, Last restocked, Status badge (OK/LOW/CRITICAL/EXPIRED)
- **Actions per row**: "Adjust Stock", "Transfer to Another Facility", "Mark Expired"
- **Bulk Actions**: "Import from e-Aushadhi", "Export CSV", "Generate Reorder Report"
- **Stock Alert Panel**: Right sidebar with critical items needing immediate attention

### 6.5 District Command — Key Screens

#### District Dashboard (`/`)
- **Map View**: District map with facility markers. Color intensity = patient load. Clickable markers → facility detail popup
- **KPI Row**: Referral completion rate, Avg wait time across facilities, Stockout facilities count, Active outbreaks, Workforce gaps
- **Facility Ranking Table**: All facilities sorted by composite health score. Columns: Facility name, Type, Patients/day, Wait time, Stock status, Staff filled %, Score
- **Alert Feed**: Unresolved escalations from facilities (auto-sorted by severity)

### 6.6 State Command — Key Screens

#### State Command Dashboard (`/`)
- **Maharashtra Choropleth Map**: 36 districts colored by health index. Click district → drill-down to district dashboard
- **State KPI Tiles**: 12 tiles covering: Total patients served today, Teleconsults active, Referral completion rate, Medicine stockout %, Immunization coverage, High-risk pregnancies tracked, Outbreak alerts, Bed occupancy, ASHA incentives disbursed, ABDM records linked
- **District Comparison**: Bar chart comparing districts on selectable KPI
- **Trend Charts**: Line charts for key metrics over 7/30/90 days
- **Report Export**: "Generate State Report" → PDF with all KPIs + charts

---

## 7. Offline-First Sync Engine

```
┌──────────────────────────────────────────────────────────────┐
│                    OFFLINE ARCHITECTURE                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  React App   │ →  │  Zustand     │ →  │  Dexie.js    │   │
│  │  (UI Layer)  │    │  (State)     │    │  (IndexedDB) │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│                                                  │           │
│                                          ┌───────┴───────┐  │
│                                          │  Sync Engine  │  │
│                                          │  ┌─────────┐  │  │
│                                          │  │ Outbox   │  │  │
│                                          │  │ Queue    │  │  │
│                                          │  └─────────┘  │  │
│                                          │  ┌─────────┐  │  │
│                                          │  │ Conflict │  │  │
│                                          │  │ Resolver │  │  │
│                                          │  └─────────┘  │  │
│                                          └───────┬───────┘  │
│                                                  │           │
│                        ┌─────────────────────────┘           │
│                        │ Background Sync API                 │
│                        │ (Service Worker)                    │
│                        └─────────────────────────┐           │
│                                                  │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                          ┌────────┴────────┐
                                          │   Backend API   │
                                          │   /api/sync     │
                                          └─────────────────┘
```

**Key features:**
- **Outbox pattern**: All writes go to IndexedDB first, queued for server sync
- **Field-level merge**: Concurrent edits to different fields auto-merge
- **User-mediated conflicts**: Critical data (dosage, allergy) surfaces conflict UI
- **AES-256 encryption**: All local data encrypted at rest
- **Data minimization**: Only sync patient data assigned to the worker's catchment area
- **Exponential backoff**: Retry failed syncs with increasing delay to save battery
- **Sync status UI**: Always-visible indicator (✅ Synced | 🔄 Syncing 3 records | ⚠️ Offline — 12 pending)

---

## 8. ABDM / FHIR Integration

| Milestone | Capability | Implementation |
|---|---|---|
| **M1 — Identity** | ABHA creation via Aadhaar/mobile OTP, ABHA address linking, HFR facility registration, HPR provider registration | `abhaClient.ts`, `hfrClient.ts`, `hprClient.ts` |
| **M2 — HIP** | Care context creation on encounter completion, FHIR R4 bundle generation (Encounter, MedicationRequest, DiagnosticReport, Condition), Respond to consent-gated data pull requests | `hipService.ts`, `fhirBuilder/*`, `abdm.routes.ts` |
| **M3 — HIU** | Request patient records from other providers with consent, Parse and display external FHIR records in timeline, Consent artifact management | `hiuService.ts`, `consentManager.ts`, `fhirParser/*` |

---

## 9. Design System

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#1565C0` (Government Blue) | Headers, primary buttons, links |
| **Secondary** | `#00897B` (Teal) | Secondary actions, success |
| **Error/Danger** | `#C62828` | Errors, critical alerts, emergency triage |
| **Warning** | `#E65100` | Warnings, urgent triage, low stock |
| **Success** | `#2E7D32` | Success states, available, routine triage |
| **Triage RED** | `#D32F2F` | Emergency |
| **Triage AMBER** | `#FF8F00` | Urgent |
| **Triage YELLOW** | `#FBC02D` | Semi-urgent |
| **Triage GREEN** | `#388E3C` | Routine |
| **Font Stack** | `Inter` (Latin), `Noto Sans Devanagari` (Marathi/Hindi) | All text |
| **Font Sizes** | 12px (caption), 14px (body), 16px (subtitle), 20px (h3), 24px (h2), 32px (h1) | Typography scale |
| **Border Radius** | 8px (cards), 4px (buttons), 12px (modals) | Consistent rounding |
| **Shadows** | `0 1px 3px rgba(0,0,0,0.12)` (card), `0 8px 24px rgba(0,0,0,0.15)` (modal) | Elevation |

---

## 10. Build Phases

### Phase 0 — Foundation (Week 1-2)
- [ ] Set up Turborepo + pnpm monorepo structure
- [ ] Create `packages/shared-types` with all enums + type definitions
- [ ] Create `packages/ui` design system with theme + layout components
- [ ] Create `packages/auth` with 6D RBAC engine
- [ ] Build PostgreSQL schema (Prisma) — all 58 tables
- [ ] Set up Docker Compose (PostgreSQL, Redis, Meilisearch, HAPI FHIR)
- [ ] Create seed data (Maharashtra facilities, demo users, EDL medicines)
- [ ] Set up backend Express server with all middleware
- [ ] Set up `packages/api-client` with typed API methods

### Phase 1 — Care Access Layer (Week 3-4)
- [ ] Patient registration + MPI
- [ ] Facility discovery + map
- [ ] Appointment booking + waitlist
- [ ] Queue management (multi-type)
- [ ] Digital triage engine
- [ ] Citizen portal (all pages)
- [ ] Frontline portal (registration, triage, screening)

### Phase 2 — Clinical Core (Week 5-6)
- [ ] OPD encounter charting (SOAP)
- [ ] ePrescription with drug interaction check
- [ ] Diagnostic ordering + results
- [ ] Referral lifecycle (12-state machine)
- [ ] Teleconsultation (LiveKit integration)
- [ ] Doctor portal (all pages)
- [ ] Follow-up tracking

### Phase 3 — Hospital Operations (Week 7-8)
- [ ] IPD: Admission → Daily Notes → Discharge
- [ ] Nursing portal: Task board, MAR, assessments, handover
- [ ] Bed management + ward view
- [ ] Medicine inventory + FEFO + dispensing
- [ ] Blood bank full lifecycle
- [ ] Equipment tracking
- [ ] Admin portal (all pages)

### Phase 4 — Network & Governance (Week 9-10)
- [ ] Organization hierarchy (State/Region/District)
- [ ] District command dashboard
- [ ] State command dashboard
- [ ] Platform admin portal
- [ ] Consent management (DPDP compliance)
- [ ] Audit trail system
- [ ] Report engine + PDF export
- [ ] Notification engine (SMS/Push/WhatsApp templates)

### Phase 5 — Quality, Safety & Advanced (Week 11-12)
- [ ] Quality incident reporting + CAPA
- [ ] Infection control surveillance
- [ ] Patient grievance system
- [ ] Procurement workflow
- [ ] Workforce management (roster, attendance, credentials)
- [ ] Public health programme configurator
- [ ] Alert & escalation engine
- [ ] ASHA incentive ledger

### Phase 6 — Integration & Polish (Week 13-14)
- [ ] Offline-first sync engine (Dexie + Service Worker)
- [ ] ABDM integration (M1 + M2 + M3)
- [ ] i18n (Marathi + Hindi + English)
- [ ] Accessibility (ARIA, keyboard, contrast)
- [ ] GIS/Map visualizations
- [ ] Performance optimization
- [ ] E2E testing (Playwright)
- [ ] Documentation

---

## 11. Verification Plan

### Automated Tests
```bash
# Unit tests (Vitest)
pnpm test:unit          # All packages + backend services

# API tests (Supertest)
pnpm test:api           # All 250+ endpoints

# Component tests (Vitest + jsdom)  
pnpm test:components    # All 9 portals

# E2E tests (Playwright)
pnpm test:e2e           # Critical user flows per portal
```

### Manual Verification
1. **Care Access Flow**: Register patient → Book → Queue → Consult → Prescribe → Refer → Follow-up
2. **IPD Flow**: Admit → Daily Notes → MAR → Discharge
3. **Offline Flow**: Go offline → Register patient → Create encounter → Come online → Verify sync
4. **Multi-Facility**: Create referral from PHC → Accept at CHC → Track through completion
5. **Admin Flow**: Create facility → Assign staff → Configure services → View reports
6. **District/State**: Verify dashboard KPIs match facility-level aggregations
7. **ABDM**: Create ABHA → Complete encounter → Verify FHIR bundle → Pull from HIU

### Key KPIs to Validate
- Referral Completion Rate tracking works end-to-end
- Mean Time to Consultation is calculated correctly
- Medicine stockout alerts trigger within threshold
- Offline sync reliability ≥ 99.8% (test with simulated disconnects)
- Triage algorithm matches WHO IMAI classification rules

---

> [!IMPORTANT]
> **This plan represents ~450+ files, 58 database tables, 250+ API endpoints, and ~500 UI screens across 9 portals.** It is the complete MCCPHP specification translated into an actionable implementation blueprint. Approve to begin Phase 0 (Foundation).
