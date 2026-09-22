"""Development seed data — creates sample branches, users, patients, referrals, programs, and consultations."""

import asyncio
from datetime import date, datetime, timedelta

from app.core.database.engine import async_session_factory, create_tables
from app.core.auth.service import hash_password
from app.core.auth.models import User
from app.core.utils import new_uuid, generate_mrn, utcnow
from app.modules.admin.models import Branch
from app.modules.patients.models import Patient
from app.modules.referrals.models import Referral, ReferralUrgency, ReferralStatus, TransportStatus, ReferralCategory
from app.modules.programs.models import MaternalRecord, NcdRecord, NcdSeverity, NcdCondition
from app.modules.teleconsult.models import TeleconsultSession, TeleconsultStatus
from app.modules.clinical.models import Consultation, Prescription, VisitType


BRANCHES = [
    {"name": "District Hospital Jaipur", "code": "DH-JP-001", "facility_type": "DISTRICT_HOSPITAL", "district": "Jaipur", "state": "Rajasthan"},
    {"name": "CHC Sanganer", "code": "CHC-JP-001", "facility_type": "CHC", "district": "Jaipur", "state": "Rajasthan"},
    {"name": "PHC Bagru", "code": "PHC-JP-001", "facility_type": "PHC", "district": "Jaipur", "state": "Rajasthan"},
    {"name": "Sub-Centre Bassi AAM", "code": "SC-JP-001", "facility_type": "SUB_CENTRE", "district": "Jaipur", "state": "Rajasthan"},
    {"name": "PHC Chaksu", "code": "PHC-JP-002", "facility_type": "PHC", "district": "Jaipur", "state": "Rajasthan"},
]

USERS = [
    {"username": "admin", "password": "admin123", "full_name": "Dr. Rajesh Kumar (Admin)", "role": "SUPERADMIN", "branch_idx": 0},
    {"username": "dr.sharma", "password": "doctor123", "full_name": "Dr. Priya Sharma", "role": "DOCTOR", "branch_idx": 0, "designation": "General Physician"},
    {"username": "cho.meena", "password": "cho123", "full_name": "Meena Kumari (CHO)", "role": "CHO", "branch_idx": 3, "designation": "Community Health Officer"},
    {"username": "anm.sunita", "password": "anm123", "full_name": "Sunita Devi (ANM)", "role": "ANM", "branch_idx": 2, "designation": "Auxiliary Nurse Midwife"},
    {"username": "asha.rekha", "password": "asha123", "full_name": "Rekha Bai (ASHA)", "role": "ASHA", "branch_idx": 3, "designation": "ASHA Worker"},
    {"username": "nurse.kavita", "password": "nurse123", "full_name": "Kavita Singh (Nurse)", "role": "NURSE", "branch_idx": 0, "designation": "Staff Nurse"},
    {"username": "pharma.ravi", "password": "pharma123", "full_name": "Ravi Patel (Pharmacist)", "role": "PHARMACIST", "branch_idx": 0, "designation": "Pharmacist"},
    {"username": "billing.amit", "password": "billing123", "full_name": "Amit Joshi (Billing)", "role": "BILLING", "branch_idx": 0, "designation": "Billing Executive"},
]

PATIENTS = [
    {"first_name": "Ramesh", "last_name": "Yadav", "gender": "MALE", "phone": "9876543210", "blood_group": "O+", "date_of_birth": "1985-03-15"},
    {"first_name": "Sita", "last_name": "Devi", "gender": "FEMALE", "phone": "9876543211", "blood_group": "B+", "date_of_birth": "1992-07-22"},
    {"first_name": "Gopal", "last_name": "Singh", "gender": "MALE", "phone": "9876543212", "blood_group": "A+", "date_of_birth": "1978-11-05"},
    {"first_name": "Kamla", "last_name": "Bai", "gender": "FEMALE", "phone": "9876543213", "blood_group": "AB+", "date_of_birth": "1965-01-30"},
    {"first_name": "Arjun", "last_name": "Meena", "gender": "MALE", "phone": "9876543214", "blood_group": "O-", "date_of_birth": "2010-09-18"},
]


async def seed():
    print("[INFO] Creating tables & seeding Phase 1 and 2 records...")
    await create_tables()

    async with async_session_factory() as db:
        # Check if already seeded
        from sqlalchemy import select
        existing_branch = await db.execute(select(Branch).limit(1))
        if existing_branch.scalar_one_or_none():
            print("[INFO] Database already contains records. Ensuring Phase 2 data is present...")
            # Fetch existing references
            branches = (await db.execute(select(Branch))).scalars().all()
            users = (await db.execute(select(User))).scalars().all()
            patients = (await db.execute(select(Patient))).scalars().all()
            
            branch_ids = [b.id for b in branches]
            user_map = {u.username: u for u in users}
            patient_ids = [p.id for p in patients]

            # Seed Phase 2 Referral if not present
            existing_ref = await db.execute(select(Referral).limit(1))
            if not existing_ref.scalar_one_or_none():
                ref1 = Referral(
                    id=new_uuid(),
                    patient_id=patient_ids[1],  # Sita Devi
                    referring_branch_id=branch_ids[3],  # Sub-centre
                    receiving_branch_id=branch_ids[0],  # DH
                    referred_by_user_id=user_map["cho.meena"].id,
                    urgency=ReferralUrgency.URGENT.value,
                    category=ReferralCategory.MATERNAL.value,
                    reason="Severe Gestational Anemia (Hb 6.8 g/dL) in 3rd Trimester",
                    clinical_summary="Patient reports extreme fatigue, pallor, and dizziness. Requires specialist obstetric evaluation and IV iron sucrose.",
                    transport_needed=True,
                    transport_status=TransportStatus.DISPATCHED_108.value,
                    driver_name="Santosh Shinde (108)",
                    driver_phone="9822144108",
                    ambulance_number="MH-15-EG-1108",
                    status=ReferralStatus.INITIATED.value,
                    appointment_date=utcnow() + timedelta(hours=2),
                    branch_id=branch_ids[3],
                )
                db.add(ref1)
                print("[SUCCESS] Seeded Phase 2 Referral record")

            # Seed Phase 2 Maternal Record if not present
            existing_mat = await db.execute(select(MaternalRecord).limit(1))
            if not existing_mat.scalar_one_or_none():
                mat1 = MaternalRecord(
                    id=new_uuid(),
                    patient_id=patient_ids[1],  # Sita Devi
                    lmp_date=date.today() - timedelta(days=200),
                    edd_date=date.today() + timedelta(days=80),
                    gravida=2,
                    parity=1,
                    high_risk_flag=True,
                    risk_factors=["SEVERE_ANEMIA", "PREVIOUS_C_SECTION"],
                    hemoglobin_level=6.8,
                    trimester=3,
                    anc_visits_completed=2,
                    next_visit_due=date.today() + timedelta(days=3),
                    assigned_asha_id=user_map["asha.rekha"].id,
                    assigned_anm_id=user_map["anm.sunita"].id,
                    branch_id=branch_ids[3],
                )
                db.add(mat1)
                print("[SUCCESS] Seeded Phase 2 High-Risk Maternal record")

            # Seed Phase 2 NCD Record if not present
            existing_ncd = await db.execute(select(NcdRecord).limit(1))
            if not existing_ncd.scalar_one_or_none():
                ncd1 = NcdRecord(
                    id=new_uuid(),
                    patient_id=patient_ids[0],  # Ramesh Yadav
                    condition_type=NcdCondition.HYPERTENSION.value,
                    severity=NcdSeverity.STAGE_2.value,
                    systolic_bp=152,
                    diastolic_bp=98,
                    fasting_blood_sugar=118.0,
                    last_checkup_date=date.today() - timedelta(days=10),
                    next_checkup_due=date.today() + timedelta(days=20),
                    medication_compliance=True,
                    assigned_asha_id=user_map["asha.rekha"].id,
                    notes="Prescribed Amlodipine 5mg OD. Advised reduced salt intake.",
                    branch_id=branch_ids[0],
                )
                db.add(ncd1)
                print("[SUCCESS] Seeded Phase 2 NCD record")

            # Seed Phase 2 Teleconsultation Session if not present
            existing_tele = await db.execute(select(TeleconsultSession).limit(1))
            if not existing_tele.scalar_one_or_none():
                tele1 = TeleconsultSession(
                    id=new_uuid(),
                    patient_id=patient_ids[2],  # Gopal Singh
                    requesting_user_id=user_map["cho.meena"].id,
                    doctor_user_id=user_map["dr.sharma"].id,
                    sub_centre_branch_id=branch_ids[3],
                    hospital_branch_id=branch_ids[0],
                    room_id="room-tele-bassi-jaipur",
                    status=TeleconsultStatus.WAITING.value,
                    chief_complaint="Uncontrolled fasting blood sugar (188 mg/dL) with peripheral tingling",
                    vitals_snapshot={"bp": "138/86", "pulse": 78, "spo2": 98, "temp": 98.4, "blood_sugar": 188},
                    branch_id=branch_ids[3],
                )
                db.add(tele1)
                print("[SUCCESS] Seeded Phase 2 Teleconsultation session")

            # Seed Phase 2 Clinical Consultation if not present
            existing_clin = await db.execute(select(Consultation).limit(1))
            if not existing_clin.scalar_one_or_none():
                clin1 = Consultation(
                    id=new_uuid(),
                    patient_id=patient_ids[0],
                    doctor_user_id=user_map["dr.sharma"].id,
                    branch_id=branch_ids[0],
                    visit_type=VisitType.OPD.value,
                    chief_complaint="Routine Hypertension follow-up",
                    clinical_notes="Patient compliant with diet. BP controlled.",
                    diagnosis="Essential Hypertension (Stage 1)",
                    snomed_codes=["59621000"],
                    icd10_codes=["I10"],
                    vitals={"bp": "134/84", "pulse": 72, "spo2": 99, "temp": 98.6},
                )
                db.add(clin1)
                rx1 = Prescription(
                    id=new_uuid(),
                    consultation_id=clin1.id,
                    patient_id=patient_ids[0],
                    doctor_user_id=user_map["dr.sharma"].id,
                    branch_id=branch_ids[0],
                    medications=[
                        {
                            "medicine_name": "Amlodipine 5mg",
                            "generic_name": "Amlodipine Besylate",
                            "dosage": "1 tablet",
                            "frequency": "1-0-0 (Morning)",
                            "duration": "30 days",
                            "instructions": "After breakfast",
                        }
                    ],
                    diet_lifestyle_advice="Low sodium diet, brisk walking 30 mins daily.",
                )
                db.add(rx1)
                print("[SUCCESS] Seeded Phase 2 Clinical EHR & Prescription")

            # Seed Phase 3 Drugs & Inventory if not present
            from app.modules.inventory.models import DrugItem, InventoryStock
            from app.modules.admin.models import BedWard

            existing_drugs = await db.execute(select(DrugItem).limit(1))
            if not existing_drugs.scalar_one_or_none():
                d1 = DrugItem(
                    id=new_uuid(),
                    code="JAN-PCM-500",
                    name="Tab. Paracetamol 500mg",
                    generic_name="Paracetamol",
                    dosage_form="Tablet",
                    strength="500mg",
                    category="Analgesic / Antipyretic",
                    is_essential_jan_aushadhi=True,
                    unit_price=0.75,
                )
                d2 = DrugItem(
                    id=new_uuid(),
                    code="JAN-AML-005",
                    name="Tab. Amlodipine 5mg",
                    generic_name="Amlodipine Besylate",
                    dosage_form="Tablet",
                    strength="5mg",
                    category="Antihypertensive",
                    is_essential_jan_aushadhi=True,
                    unit_price=1.20,
                )
                d3 = DrugItem(
                    id=new_uuid(),
                    code="JAN-MET-500",
                    name="Tab. Metformin 500mg",
                    generic_name="Metformin Hydrochloride",
                    dosage_form="Tablet",
                    strength="500mg",
                    category="Antidiabetic",
                    is_essential_jan_aushadhi=True,
                    unit_price=1.50,
                )
                d4 = DrugItem(
                    id=new_uuid(),
                    code="JAN-IFA-100",
                    name="Cap. Iron & Folic Acid",
                    generic_name="Ferrous Sulfate + Folic Acid",
                    dosage_form="Capsule",
                    strength="100mg + 0.5mg",
                    category="Maternal Nutrition",
                    is_essential_jan_aushadhi=True,
                    unit_price=0.50,
                )
                d5 = DrugItem(
                    id=new_uuid(),
                    code="JAN-AMX-500",
                    name="Cap. Amoxicillin 500mg",
                    generic_name="Amoxicillin Trihydrate",
                    dosage_form="Capsule",
                    strength="500mg",
                    category="Antibiotic",
                    is_essential_jan_aushadhi=True,
                    unit_price=3.00,
                )
                db.add_all([d1, d2, d3, d4, d5])
                await db.flush()

                # Seed Inventory Batches (Normal, Low-Stock, Expiring-Soon)
                stk1 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d1.id,
                    batch_number="B-PCM-2026A",
                    expiry_date=date.today() + timedelta(days=365),
                    quantity_available=1200,
                    reorder_level=100,
                )
                stk2 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d2.id,
                    batch_number="B-AML-2025Z",
                    expiry_date=date.today() + timedelta(days=25),  # Expiring soon
                    quantity_available=250,
                    reorder_level=50,
                )
                stk3 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d3.id,
                    batch_number="B-MET-2026C",
                    expiry_date=date.today() + timedelta(days=400),
                    quantity_available=18,  # Low stock
                    reorder_level=50,
                )
                stk4 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[3],  # Sub-centre
                    drug_id=d4.id,
                    batch_number="B-IFA-2026X",
                    expiry_date=date.today() + timedelta(days=500),
                    quantity_available=600,
                    reorder_level=100,
                )
                db.add_all([stk1, stk2, stk3, stk4])
                print("[SUCCESS] Seeded Phase 3 Drug Formulary & Inventory Batches")

            # Seed Phase 3 Bed Wards if not present
            existing_wards = await db.execute(select(BedWard).limit(1))
            if not existing_wards.scalar_one_or_none():
                w1 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Maternity & Labor ICU",
                    ward_type="MATERNITY",
                    total_beds=20,
                    occupied_beds=16,
                    oxygen_supported_beds=8,
                    icu_ventilator_beds=4,
                )
                w2 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="General Medicine Ward",
                    ward_type="GENERAL",
                    total_beds=40,
                    occupied_beds=29,
                    oxygen_supported_beds=15,
                    icu_ventilator_beds=0,
                )
                w3 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Pediatric & NICU Ward",
                    ward_type="PEDIATRIC",
                    total_beds=15,
                    occupied_beds=12,
                    oxygen_supported_beds=10,
                    icu_ventilator_beds=5,
                )
                w4 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Emergency & Trauma Bay",
                    ward_type="EMERGENCY",
                    total_beds=12,
                    occupied_beds=8,
                    oxygen_supported_beds=12,
                    icu_ventilator_beds=6,
                )
                db.add_all([w1, w2, w3, w4])
                print("[SUCCESS] Seeded Phase 3 Bed Wards")

            await db.commit()
            print("\n[COMPLETE] Phase 1, Phase 2, & Phase 3 seed verified and active!")
            return

        # --- Fresh Seeding ---
        # Branches
        branch_ids = []
        for b in BRANCHES:
            branch = Branch(
                id=new_uuid(),
                name=b["name"],
                code=b["code"],
                facility_type=b["facility_type"],
                district=b.get("district"),
                state=b.get("state"),
            )
            if not existing_drugs.scalar_one_or_none():
                d1 = DrugItem(
                    id=new_uuid(),
                    code="JAN-PCM-500",
                    name="Tab. Paracetamol 500mg",
                    generic_name="Paracetamol",
                    dosage_form="Tablet",
                    strength="500mg",
                    category="Analgesic / Antipyretic",
                    is_essential_jan_aushadhi=True,
                    unit_price=0.75,
                )
                d2 = DrugItem(
                    id=new_uuid(),
                    code="JAN-AML-005",
                    name="Tab. Amlodipine 5mg",
                    generic_name="Amlodipine Besylate",
                    dosage_form="Tablet",
                    strength="5mg",
                    category="Antihypertensive",
                    is_essential_jan_aushadhi=True,
                    unit_price=1.20,
                )
                d3 = DrugItem(
                    id=new_uuid(),
                    code="JAN-MET-500",
                    name="Tab. Metformin 500mg",
                    generic_name="Metformin Hydrochloride",
                    dosage_form="Tablet",
                    strength="500mg",
                    category="Antidiabetic",
                    is_essential_jan_aushadhi=True,
                    unit_price=1.50,
                )
                d4 = DrugItem(
                    id=new_uuid(),
                    code="JAN-IFA-100",
                    name="Cap. Iron & Folic Acid",
                    generic_name="Ferrous Sulfate + Folic Acid",
                    dosage_form="Capsule",
                    strength="100mg + 0.5mg",
                    category="Maternal Nutrition",
                    is_essential_jan_aushadhi=True,
                    unit_price=0.50,
                )
                d5 = DrugItem(
                    id=new_uuid(),
                    code="JAN-AMX-500",
                    name="Cap. Amoxicillin 500mg",
                    generic_name="Amoxicillin Trihydrate",
                    dosage_form="Capsule",
                    strength="500mg",
                    category="Antibiotic",
                    is_essential_jan_aushadhi=True,
                    unit_price=3.00,
                )
                db.add_all([d1, d2, d3, d4, d5])
                await db.flush()

                # Seed Inventory Batches (Normal, Low-Stock, Expiring-Soon)
                stk1 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d1.id,
                    batch_number="B-PCM-2026A",
                    expiry_date=date.today() + timedelta(days=365),
                    quantity_available=1200,
                    reorder_level=100,
                )
                stk2 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d2.id,
                    batch_number="B-AML-2025Z",
                    expiry_date=date.today() + timedelta(days=25),  # Expiring soon
                    quantity_available=250,
                    reorder_level=50,
                )
                stk3 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    drug_id=d3.id,
                    batch_number="B-MET-2026C",
                    expiry_date=date.today() + timedelta(days=400),
                    quantity_available=18,  # Low stock
                    reorder_level=50,
                )
                stk4 = InventoryStock(
                    id=new_uuid(),
                    branch_id=branch_ids[3],  # Sub-centre
                    drug_id=d4.id,
                    batch_number="B-IFA-2026X",
                    expiry_date=date.today() + timedelta(days=500),
                    quantity_available=600,
                    reorder_level=100,
                )
                db.add_all([stk1, stk2, stk3, stk4])
                print("[SUCCESS] Seeded Phase 3 Drug Formulary & Inventory Batches")

            # Seed Phase 3 Bed Wards if not present
            existing_wards = await db.execute(select(BedWard).limit(1))
            if not existing_wards.scalar_one_or_none():
                w1 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Maternity & Labor ICU",
                    ward_type="MATERNITY",
                    total_beds=20,
                    occupied_beds=16,
                    oxygen_supported_beds=8,
                    icu_ventilator_beds=4,
                )
                w2 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="General Medicine Ward",
                    ward_type="GENERAL",
                    total_beds=40,
                    occupied_beds=29,
                    oxygen_supported_beds=15,
                    icu_ventilator_beds=0,
                )
                w3 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Pediatric & NICU Ward",
                    ward_type="PEDIATRIC",
                    total_beds=15,
                    occupied_beds=12,
                    oxygen_supported_beds=10,
                    icu_ventilator_beds=5,
                )
                w4 = BedWard(
                    id=new_uuid(),
                    branch_id=branch_ids[0],
                    ward_name="Emergency & Trauma Bay",
                    ward_type="EMERGENCY",
                    total_beds=12,
                    occupied_beds=8,
                    oxygen_supported_beds=12,
                    icu_ventilator_beds=6,
                )
                db.add_all([w1, w2, w3, w4])
                print("[SUCCESS] Seeded Phase 3 Bed Wards")

            await db.commit()
            print("\n[COMPLETE] Phase 1, Phase 2, & Phase 3 seed verified and active!")
            return

        # Branches
        branch_ids = []
        for b in BRANCHES:
            branch = Branch(
                id=new_uuid(),
                name=b["name"],
                code=b["code"],
                facility_type=b["facility_type"],
                district=b.get("district"),
                state=b.get("state"),
            )
            if b["facility_type"] != "DISTRICT_HOSPITAL" and branch_ids:
                branch.parent_branch_id = branch_ids[0]
            db.add(branch)
            branch_ids.append(branch.id)
        await db.flush()
        print(f"[SUCCESS] Created {len(BRANCHES)} branches")

        # Users
        user_objs = []
        for u in USERS:
            user = User(
                id=new_uuid(),
                username=u["username"],
                full_name=u["full_name"],
                hashed_password=hash_password(u["password"]),
                role=u["role"],
                branch_id=branch_ids[u["branch_idx"]],
                designation=u.get("designation"),
            )
            db.add(user)
            user_objs.append(user)
        await db.flush()
        print(f"[SUCCESS] Created {len(USERS)} users")

        # Patients
        patient_objs = []
        for i, p in enumerate(PATIENTS):
            patient = Patient(
                id=new_uuid(),
                mrn=generate_mrn(i + 1),
                first_name=p["first_name"],
                last_name=p["last_name"],
                gender=p["gender"],
                phone=p["phone"],
                blood_group=p["blood_group"],
                date_of_birth=date.fromisoformat(p["date_of_birth"]),
                branch_id=branch_ids[0],
            )
            db.add(patient)
            patient_objs.append(patient)
        await db.flush()
        print(f"[SUCCESS] Created {len(PATIENTS)} patients")

        await db.commit()
        print("\n[COMPLETE] Fresh seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())

