"""Phase 1 & Phase 2 Backend API tests — auth, branches, patients, referrals, programs, teleconsult, clinical."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.database.engine import create_tables, dispose_engine
from seed_data import seed


@pytest.fixture(scope="session", autouse=True)
async def setup_db():
    """Seed database before running test suite if not already seeded."""
    await create_tables()
    try:
        await seed()
    except Exception:
        pass
    yield
    await dispose_engine()


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "Arogya Mitra" in data["service"]


@pytest.mark.asyncio
async def test_auth_login_and_me():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        assert res.status_code == 200
        data = res.json()
        token = data["access_token"]

        me_res = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_res.status_code == 200
        assert me_res.json()["username"] == "admin"


@pytest.mark.asyncio
async def test_branches_and_patients():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        doc_token = doc_res.json()["access_token"]

        # Branches
        list_res = await client.get(
            "/api/v1/branches",
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 5

        # Patients
        patients_res = await client.get(
            "/api/v1/patients",
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert patients_res.status_code == 200
        assert patients_res.json()["total"] >= 5


@pytest.mark.asyncio
async def test_referrals_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as CHO Meena
        cho_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "cho.meena", "password": "cho123"},
        )
        cho_token = cho_res.json()["access_token"]

        # Get patients and DH branch
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {cho_token}"})
        patient = p_res.json()["items"][0]
        b_res = await client.get("/api/v1/branches", headers={"Authorization": f"Bearer {cho_token}"})
        dh_branch = [b for b in b_res.json() if b["facility_type"] == "DISTRICT_HOSPITAL"][0]

        # 2. Initiate Urgent Referral
        ref_res = await client.post(
            "/api/v1/referrals",
            headers={"Authorization": f"Bearer {cho_token}"},
            json={
                "patient_id": patient["id"],
                "receiving_branch_id": dh_branch["id"],
                "urgency": "URGENT",
                "category": "NCD",
                "reason": "Uncontrolled Hypertension with severe headache",
                "clinical_summary": "BP 168/104 mmHg. Needs specialist cardiology assessment.",
                "transport_needed": True,
            },
        )
        assert ref_res.status_code == 201
        ref_data = ref_res.json()
        assert ref_data["status"] == "INITIATED"
        assert ref_data["transport_status"] == "DISPATCHED_108"
        ref_id = ref_data["id"]

        # 3. Doctor logs in and accepts referral
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        doc_token = doc_res.json()["access_token"]

        accept_res = await client.patch(
            f"/api/v1/referrals/{ref_id}/status",
            headers={"Authorization": f"Bearer {doc_token}"},
            json={"status": "ACCEPTED"},
        )
        assert accept_res.status_code == 200
        assert accept_res.json()["status"] == "ACCEPTED"

        # 4. Doctor completes Counter-Referral
        counter_res = await client.post(
            f"/api/v1/referrals/{ref_id}/counter-referral",
            headers={"Authorization": f"Bearer {doc_token}"},
            json={
                "counter_referral_notes": "Prescribed Telmisartan 40mg. ECG Normal.",
                "follow_up_instructions": "Check weekly BP at Sub-Centre Bassi.",
                "prescribed_medications_summary": "Telmisartan 40mg OD x 30 days",
            },
        )
        assert counter_res.status_code == 200
        assert counter_res.json()["status"] == "COMPLETED"
        assert "Telmisartan" in counter_res.json()["prescribed_medications_summary"]


@pytest.mark.asyncio
async def test_programs_maternal_and_ncd():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login as ANM
        anm_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "anm.sunita", "password": "anm123"},
        )
        anm_token = anm_res.json()["access_token"]

        # Get female patient
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {anm_token}"})
        female_patient = [p for p in p_res.json()["items"] if p["gender"] == "FEMALE"][0]

        # Enroll pregnant mother with low hemoglobin (Hb 6.5 -> Auto High Risk)
        mat_res = await client.post(
            "/api/v1/programs/maternal",
            headers={"Authorization": f"Bearer {anm_token}"},
            json={
                "patient_id": female_patient["id"],
                "lmp_date": "2026-04-10",
                "gravida": 2,
                "parity": 1,
                "hemoglobin_level": 6.5,
                "risk_factors": ["PREVIOUS_C_SECTION"],
            },
        )
        assert mat_res.status_code == 201
        mat_data = mat_res.json()
        assert mat_data["high_risk_flag"] is True
        assert "SEVERE_ANEMIA" in mat_data["risk_factors"]

        # Record NCD Stage 2 screening
        male_patient = [p for p in p_res.json()["items"] if p["gender"] == "MALE"][0]
        ncd_res = await client.post(
            "/api/v1/programs/ncd",
            headers={"Authorization": f"Bearer {anm_token}"},
            json={
                "patient_id": male_patient["id"],
                "condition_type": "HYPERTENSION",
                "systolic_bp": 158,
                "diastolic_bp": 96,
                "fasting_blood_sugar": 112.0,
            },
        )
        assert ncd_res.status_code == 201
        assert ncd_res.json()["severity"] == "STAGE_2"

        # Check frontline worker tasks generated
        tasks_res = await client.get(
            "/api/v1/programs/frontline-tasks",
            headers={"Authorization": f"Bearer {anm_token}"},
        )
        assert tasks_res.status_code == 200
        assert len(tasks_res.json()) >= 1


@pytest.mark.asyncio
async def test_teleconsult_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        cho_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "cho.meena", "password": "cho123"},
        )
        cho_token = cho_res.json()["access_token"]

        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {cho_token}"})
        patient = p_res.json()["items"][0]
        b_res = await client.get("/api/v1/branches", headers={"Authorization": f"Bearer {cho_token}"})
        dh_branch = [b for b in b_res.json() if b["facility_type"] == "DISTRICT_HOSPITAL"][0]

        # 1. Create Teleconsult Session
        create_res = await client.post(
            "/api/v1/teleconsult/sessions",
            headers={"Authorization": f"Bearer {cho_token}"},
            json={
                "patient_id": patient["id"],
                "hospital_branch_id": dh_branch["id"],
                "chief_complaint": "Persistent dizziness and palpitations",
                "vitals_snapshot": {"bp": "144/92", "pulse": 88, "spo2": 97, "temp": 98.6},
            },
        )
        assert create_res.status_code == 201
        session_id = create_res.json()["id"]

        # 2. Doctor joins session
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        doc_token = doc_res.json()["access_token"]

        join_res = await client.post(
            f"/api/v1/teleconsult/sessions/{session_id}/join",
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert join_res.status_code == 200
        assert "webrtc_token" in join_res.json()
        assert join_res.json()["status"] == "IN_CALL"

        # 3. Doctor completes session
        complete_res = await client.post(
            f"/api/v1/teleconsult/sessions/{session_id}/complete",
            headers={"Authorization": f"Bearer {doc_token}"},
            json={"doctor_diagnosis": "Mild sinus tachycardia secondary to mild dehydration."},
        )
        assert complete_res.status_code == 200
        assert complete_res.json()["status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_clinical_consultations_and_ehr():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        doc_token = doc_res.json()["access_token"]

        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {doc_token}"})
        patient = p_res.json()["items"][0]

        # Create consultation with digital prescription
        consult_res = await client.post(
            "/api/v1/clinical/consultations",
            headers={"Authorization": f"Bearer {doc_token}"},
            json={
                "patient_id": patient["id"],
                "visit_type": "OPD",
                "chief_complaint": "Fever and productive cough for 3 days",
                "diagnosis": "Acute Bronchitis",
                "snomed_codes": ["10509002"],
                "icd10_codes": ["J20.9"],
                "vitals": {"bp": "120/80", "pulse": 76, "temp": 100.4, "spo2": 98},
                "prescription": {
                    "patient_id": patient["id"],
                    "medications": [
                        {
                            "medicine_name": "Amoxicillin 500mg",
                            "generic_name": "Amoxicillin Trihydrate",
                            "dosage": "1 capsule",
                            "frequency": "1-1-1 (Thrice daily)",
                            "duration": "5 days",
                            "instructions": "After food",
                        },
                        {
                            "medicine_name": "Paracetamol 650mg",
                            "generic_name": "Acetaminophen",
                            "dosage": "1 tablet",
                            "frequency": "SOS (As needed for fever)",
                            "duration": "3 days",
                            "instructions": "After food",
                        },
                    ],
                    "diet_lifestyle_advice": "Adequate hydration, steam inhalation twice daily.",
                },
            },
        )
        assert consult_res.status_code == 201
        assert consult_res.json()["diagnosis"] == "Acute Bronchitis"
        assert len(consult_res.json()["prescriptions"]) == 1

        # Fetch longitudinal EHR history
        history_res = await client.get(
            f"/api/v1/clinical/patients/{patient['id']}/history",
            headers={"Authorization": f"Bearer {doc_token}"},
        )
        assert history_res.status_code == 200
        assert len(history_res.json()) >= 1


@pytest.mark.asyncio
async def test_inventory_and_dispensing():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # 1. List Drugs
        drugs_res = await client.get("/api/v1/inventory/drugs", headers={"Authorization": f"Bearer {token}"})
        assert drugs_res.status_code == 200
        assert len(drugs_res.json()) >= 5

        # 2. List Stocks & Alerts
        stocks_res = await client.get("/api/v1/inventory/stocks", headers={"Authorization": f"Bearer {token}"})
        assert stocks_res.status_code == 200
        assert len(stocks_res.json()) >= 1
        stock = stocks_res.json()[0]

        # 3. Dispense Medication
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
        patient = p_res.json()["items"][0]

        dispense_res = await client.post(
            "/api/v1/inventory/dispense",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "patient_id": patient["id"],
                "items": [{"stock_id": stock["id"], "quantity": 2}],
                "notes": "Dispensed 2 units for outpatient relief.",
            },
        )
        assert dispense_res.status_code == 200
        assert dispense_res.json()["success"] is True
        assert dispense_res.json()["items_dispensed"] == 1


@pytest.mark.asyncio
async def test_offline_sync():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        cho_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "cho.meena", "password": "cho123"},
        )
        token = cho_res.json()["access_token"]

        # 1. Test Sync Push (Simulated Offline Patient Registration)
        sync_res = await client.post(
            "/api/v1/sync/push",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "device_id": "TAB-CHO-BASSI-01",
                "worker_role": "CHO",
                "mutations": [
                    {
                        "client_mutation_id": "mut-offline-001",
                        "entity_type": "PATIENT_REGISTER",
                        "payload": {
                            "first_name": "Kavita",
                            "last_name": "Gurjar",
                            "gender": "FEMALE",
                            "phone": "9811223344",
                            "blood_group": "B+",
                            "date_of_birth": "1995-06-12",
                        },
                    }
                ],
            },
        )
        assert sync_res.status_code == 200
        data = sync_res.json()
        assert data["applied_count"] == 1
        assert data["results"][0]["status"] == "APPLIED"

        # 2. Test Sync Pull
        pull_res = await client.get("/api/v1/sync/pull", headers={"Authorization": f"Bearer {token}"})
        assert pull_res.status_code == 200
        assert len(pull_res.json()["drugs"]) >= 1


@pytest.mark.asyncio
async def test_abdm_m1_m2_m3_simulator():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # M1: Generate ABHA
        m1_res = await client.post(
            "/api/v1/abdm/m1/generate-abha",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "id_type": "AADHAAR",
                "id_value": "987654321098",
                "otp": "123456",
                "full_name": "Sunita Mehra",
                "gender": "FEMALE",
                "year_of_birth": 1994,
            },
        )
        assert m1_res.status_code == 200
        abha_profile = m1_res.json()
        assert abha_profile["abha_number"].startswith("91-")
        assert "@abdm" in abha_profile["abha_address"]

        # M2: Link Care Context
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
        patient = p_res.json()["items"][0]

        m2_res = await client.post(
            "/api/v1/abdm/m2/link-care-context",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "patient_id": patient["id"],
                "abha_number": abha_profile["abha_number"],
                "hip_facility_id": "IN-RJ-DH-001",
            },
        )
        assert m2_res.status_code == 200
        assert m2_res.json()["status"] == "LINKED"
        assert len(m2_res.json()["care_contexts"]) >= 1

        # M3: Consent Exchange & FHIR R4 Bundle
        m3_res = await client.post(
            "/api/v1/abdm/m3/consent/exchange",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "patient_abha": abha_profile["abha_number"],
                "hiu_facility_id": "IN-RJ-DH-001",
                "purpose": "CARETREATMENT",
            },
        )
        assert m3_res.status_code == 200
        m3_data = m3_res.json()
        assert m3_data["status"] == "GRANTED"
        assert m3_data["fhir_bundle"]["resourceType"] == "Bundle"
        assert len(m3_data["fhir_bundle"]["entry"]) >= 3


@pytest.mark.asyncio
async def test_admin_wards_and_audit():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        token = admin_res.json()["access_token"]

        # Wards List
        wards_res = await client.get("/api/v1/branches/wards/all", headers={"Authorization": f"Bearer {token}"})
        assert wards_res.status_code == 200
        assert len(wards_res.json()) >= 4
        assert wards_res.json()[0]["occupancy_rate"] > 0

        # Audit Logs List
        audit_res = await client.get("/api/v1/branches/audit-logs/recent", headers={"Authorization": f"Bearer {token}"})
        assert audit_res.status_code == 200
        assert isinstance(audit_res.json(), list)


@pytest.mark.asyncio
async def test_cdss_evaluations():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # Evaluate case with Drug-Drug Interaction (Telmisartan + Spironolactone)
        cdss_res = await client.post(
            "/api/v1/cdss/evaluate",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "age": 58,
                "gender": "MALE",
                "is_pregnant": False,
                "allergies": ["Penicillin"],
                "chief_complaints": ["Shortness of breath", "persistent productive cough"],
                "vitals": {"bp": "150/95", "spo2": 95, "temp": 99.1},
                "proposed_medications": [
                    {"name": "Telmisartan 40mg", "generic_name": "Telmisartan"},
                    {"name": "Spironolactone 25mg", "generic_name": "Spironolactone"},
                    {"name": "Amoxicillin 500mg", "generic_name": "Amoxicillin Trihydrate"},
                ],
            },
        )
        assert cdss_res.status_code == 200
        data = cdss_res.json()
        assert data["risk_level"] in ["HIGH", "CRITICAL_EMERGENCY"]
        # Verify DDI caught
        assert len(data["drug_interactions"]) >= 1
        assert data["drug_interactions"][0]["severity"] == "HIGH"
        # Verify allergy caught
        allergy_alerts = [a for a in data["alerts"] if a["category"] == "ALLERGY"]
        assert len(allergy_alerts) >= 1
        # Verify differential diagnosis generated
        assert len(data["differential_diagnoses"]) >= 1


@pytest.mark.asyncio
async def test_public_health_analytics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # Overview stats & outbreaks
        res = await client.get("/api/v1/analytics/overview", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["total_consultations"] >= 1
        assert len(data["outbreaks"]) >= 2
        assert len(data["geo_clusters"]) >= 3

        # 14-day disease trends
        trends_res = await client.get("/api/v1/analytics/disease-trends", headers={"Authorization": f"Bearer {token}"})
        assert trends_res.status_code == 200
        assert len(trends_res.json()) >= 10


@pytest.mark.asyncio
async def test_laboratory_lis_workflow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # 1. Fetch lab test catalog
        cat_res = await client.get("/api/v1/lab/catalog", headers={"Authorization": f"Bearer {token}"})
        assert cat_res.status_code == 200
        catalog = cat_res.json()
        assert len(catalog) >= 5

        # 2. Get a patient
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
        patient = p_res.json()["items"][0]

        # 3. Create lab requisition order (PLT and Dengue NS1)
        selected_tests = [t for t in catalog if t["test_code"] in ["PLT", "DENGUE_NS1"]]
        test_ids = [t["id"] for t in selected_tests]
        order_payload = {
            "patient_id": patient["id"],
            "test_ids": test_ids,
            "clinical_indication": "Acute febrile illness, petechiae on arms",
            "urgency": "STAT_EMERGENCY",
        }
        order_res = await client.post("/api/v1/lab/orders", headers={"Authorization": f"Bearer {token}"}, json=order_payload)
        assert order_res.status_code == 201
        order_data = order_res.json()
        assert order_data["urgency"] == "STAT_EMERGENCY"
        assert len(order_data["items"]) == len(test_ids)
        assert len(order_data["samples"]) >= 1
        assert "barcode" in order_data["samples"][0]
        order_id = order_data["id"]

        # 4. Input Analyzer Results (with Critical Low Platelets < 50,000)
        items_by_code = {i["test_code"]: i["id"] for i in order_data["items"]}
        result_items = []
        if "PLT" in items_by_code:
            result_items.append({
                "item_id": items_by_code["PLT"],
                "result_value": "42000 /cumm",
                "numeric_value": 42000.0,
                "technician_notes": "Severe Thrombocytopenia detected by automated analyzer",
            })
        if "DENGUE_NS1" in items_by_code:
            result_items.append({
                "item_id": items_by_code["DENGUE_NS1"],
                "result_value": "POSITIVE",
                "technician_notes": "Reactive for Dengue Non-Structural Protein 1 Antigen",
            })

        result_payload = {
            "results": result_items,
            "mark_published": True,
        }
        entry_res = await client.post(f"/api/v1/lab/orders/{order_id}/results", headers={"Authorization": f"Bearer {token}"}, json=result_payload)
        assert entry_res.status_code == 200
        updated_order = entry_res.json()
        assert updated_order["status"] in ["COMPLETED", "VERIFIED", "PUBLISHED"]

        # 5. Fetch Diagnostic Report
        report_res = await client.get(f"/api/v1/lab/orders/{order_id}/report", headers={"Authorization": f"Bearer {token}"})
        assert report_res.status_code == 200
        report = report_res.json()
        assert report["has_critical_alerts"] is True
        assert len(report["results"]) == len(test_ids)
        assert "CRITICAL" in report["clinical_interpretation"]


@pytest.mark.asyncio
async def test_emergency_dispatch_and_telemetry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # 1. Fetch 108 ambulance fleet
        fleet_res = await client.get("/api/v1/emergency/fleet", headers={"Authorization": f"Bearer {token}"})
        assert fleet_res.status_code == 200
        fleet = fleet_res.json()
        assert len(fleet) >= 2

        # 2. Get a patient
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
        patient = p_res.json()["items"][0]

        # 3. Create 108 Emergency Dispatch Call
        dispatch_payload = {
            "caller_name": "Ramesh Kumar (Bystander)",
            "caller_phone": "+91-9876543210",
            "location_name": "NH-21 Highway Junction, Mile 44",
            "pickup_lat": 26.9180,
            "pickup_lng": 75.7920,
            "patient_id": patient["id"],
            "chief_complaint": "High-speed motorcycle collision, severe chest trauma, altered sensorium",
            "urgency": "EMERGENCY_CRITICAL",
        }
        dispatch_res = await client.post("/api/v1/emergency/dispatch", headers={"Authorization": f"Bearer {token}"}, json=dispatch_payload)
        assert dispatch_res.status_code == 201
        dispatch = dispatch_res.json()
        assert dispatch["urgency"] == "EMERGENCY_CRITICAL"
        assert dispatch["assigned_vehicle"] is not None
        dispatch_id = dispatch["id"]

        # 4. Stream En-Route Paramedic Vitals (SpO2, Pulse, BP, ECG, GCS)
        vitals_payload = {
            "pulse_bpm": 132,
            "bp_systolic": 85,
            "bp_diastolic": 50,
            "spo2_pct": 88.0,
            "ecg_rhythm": "SINUS_TACHYCARDIA_WITH_PVC",
            "gcs_score": 9,
            "oxygen_flow_lpm": 12.0,
            "paramedic_notes": "High flow O2 via Non-Rebreather Mask, C-collar applied, preparing trauma bay.",
        }
        vitals_res = await client.post(f"/api/v1/emergency/dispatches/{dispatch_id}/vitals", headers={"Authorization": f"Bearer {token}"}, json=vitals_payload)
        assert vitals_res.status_code == 200
        assert vitals_res.json()["spo2_pct"] == 88.0

        # 5. Check District Hospital Trauma Bay Status
        trauma_res = await client.get(f"/api/v1/emergency/dispatches/{dispatch_id}/trauma-bay", headers={"Authorization": f"Bearer {token}"})
        assert trauma_res.status_code == 200
        trauma_status = trauma_res.json()
        assert trauma_status["trauma_team_assembled"] is True
        assert trauma_status["resuscitation_bay_reserved"] is True


@pytest.mark.asyncio
async def test_universal_immunization_and_cold_chain():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        doc_res = await client.post(
            "/api/v1/auth/login",
            json={"username": "dr.sharma", "password": "doctor123"},
        )
        token = doc_res.json()["access_token"]

        # 1. Fetch UIP Vaccine Catalog
        cat_res = await client.get("/api/v1/immunization/catalog", headers={"Authorization": f"Bearer {token}"})
        assert cat_res.status_code == 200
        catalog = cat_res.json()
        assert len(catalog) >= 6

        # 2. Get a patient and fetch / generate Child Immunization Pass
        p_res = await client.get("/api/v1/patients", headers={"Authorization": f"Bearer {token}"})
        patient = p_res.json()["items"][0]

        pass_res = await client.get(f"/api/v1/immunization/child/{patient['id']}", headers={"Authorization": f"Bearer {token}"})
        assert pass_res.status_code == 200
        immunization_pass = pass_res.json()
        assert len(immunization_pass) >= 5

        # 3. Administer a vaccine dose (e.g. BCG or Penta 1)
        record_id = immunization_pass[0]["id"]
        admin_payload = {
            "batch_number": "SII-BCG-9942A",
            "aefi_reported": "NONE",
        }
        admin_res = await client.post(f"/api/v1/immunization/records/{record_id}/administer", headers={"Authorization": f"Bearer {token}"}, json=admin_payload)
        assert admin_res.status_code == 200
        assert admin_res.json()["status"] == "ADMINISTERED"

        # 4. eVIN Cold Chain Equipment & Temperature Telemetry
        cold_res = await client.get("/api/v1/immunization/cold-chain", headers={"Authorization": f"Bearer {token}"})
        assert cold_res.status_code == 200
        equipment = cold_res.json()
        assert len(equipment) >= 1
        ilr_eq = next((e for e in equipment if "ILR" in e["equipment_code"]), equipment[0])
        assert ilr_eq["target_min_c"] == 2.0
        assert ilr_eq["target_max_c"] == 8.0

        # 5. AI-driven Seasonal Demand Forecast
        forecast_res = await client.get("/api/v1/immunization/forecast", headers={"Authorization": f"Bearer {token}"})
        assert forecast_res.status_code == 200
        forecasts = forecast_res.json()
        assert len(forecasts) >= 4



