"""AI Clinical Decision Support System (CDSS) & Drug Interaction Engine."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.modules.cdss.schemas import (
    CdssEvaluateRequest,
    CdssEvaluateResponse,
    ClinicalAlert,
    DifferentialDiagnosis,
    DrugInteractionWarning,
)
from app.modules.patients.models import Patient

# Known Drug-Drug Interactions Matrix (Substance pairs -> interaction details)
DDI_RULES = [
    {
        "drugs": ["telmisartan", "spironolactone"],
        "severity": "HIGH",
        "effect": "Risk of severe life-threatening hyperkalemia and acute renal impairment.",
        "recommendation": "Avoid combination or closely monitor serum potassium levels and eGFR weekly.",
    },
    {
        "drugs": ["aspirin", "warfarin"],
        "severity": "HIGH",
        "effect": "Synergistic inhibition of hemostasis significantly increases major GI and intracranial bleeding risk.",
        "recommendation": "Avoid concurrent use unless strictly indicated for mechanical heart valves with tight INR monitoring.",
    },
    {
        "drugs": ["ibuprofen", "aspirin"],
        "severity": "MODERATE",
        "effect": "Ibuprofen interferes with the antiplatelet cardioprotective effect of low-dose aspirin and increases gastric ulceration risk.",
        "recommendation": "Take aspirin at least 30 minutes before or 8 hours after ibuprofen, or use Paracetamol for analgesia.",
    },
    {
        "drugs": ["azithromycin", "ciprofloxacin"],
        "severity": "MODERATE",
        "effect": "Additive risk of QTc prolongation and cardiac arrhythmias (Torsades de Pointes).",
        "recommendation": "Monitor baseline ECG or choose alternative beta-lactam antibiotic coverage.",
    },
    {
        "drugs": ["iron", "calcium"],
        "severity": "LOW",
        "effect": "Calcium competitively inhibits intestinal absorption of elemental iron.",
        "recommendation": "Administer iron supplements at least 2 hours apart from calcium carbonate or milk intake.",
    },
    {
        "drugs": ["metformin", "alcohol"],
        "severity": "MODERATE",
        "effect": "Potentiation of metformin effect on lactate metabolism increasing lactic acidosis risk.",
        "recommendation": "Advise patient to avoid acute or chronic excessive alcohol consumption.",
    },
]

# Teratogenic Medications (Strictly Contraindicated in Pregnancy)
PREGNANCY_CONTRAINDICATED = {
    "telmisartan": "ACE/ARB teratogenic in 2nd/3rd trimester causing fetal renal dysgenesis and oligohydramnios.",
    "enalapril": "ACE inhibitor contraindicated in pregnancy; risk of fetal hypotension and skull hypoplasia.",
    "ramipril": "ACE inhibitor contraindicated in pregnancy.",
    "losartan": "ARB contraindicated in pregnancy.",
    "doxycycline": "Tetracycline class causes permanent fetal tooth discoloration and skeletal growth restriction.",
    "ciprofloxacin": "Fluoroquinolone linked to fetal cartilage toxicity and arthropathy in animal studies.",
    "warfarin": "Warfarin embryopathy risk (nasal hypoplasia, stippled epiphyses, CNS abnormalities).",
    "methotrexate": "Major teratogenic neural tube and craniofacial malformation risk.",
    "valproate": "High risk of neural tube defects and congenital neurodevelopmental disorders.",
    "isotretinoin": "Severe craniofacial, cardiac, and central nervous system congenital defects.",
}

# Cross-Reactive Allergy Class Mapping
ALLERGY_CLASS_MAP = {
    "penicillin": ["amoxicillin", "ampicillin", "penicillin", "augmentin", "piperacillin", "clavulanate", "amox"],
    "sulfa": ["sulfamethoxazole", "bactrim", "sulfasalazine", "cotrimoxazole", "sulfa"],
    "nsaid": ["aspirin", "ibuprofen", "diclofenac", "naproxen", "aceclofenac", "mefenamic"],
    "cephalosporin": ["cefixime", "ceftriaxone", "cephalexin", "cefuroxime"],
}


async def evaluate_clinical_case(db: AsyncSession, data: CdssEvaluateRequest) -> CdssEvaluateResponse:
    alerts: list[ClinicalAlert] = []
    interactions: list[DrugInteractionWarning] = []
    diff_diagnoses: list[DifferentialDiagnosis] = []
    lifestyle_advice: list[str] = []

    patient_allergies = list(data.allergies)
    is_pregnant = data.is_pregnant
    vitals = data.vitals or {}

    # If patient_id provided, fetch known allergies and medical records from database
    if data.patient_id:
        patient = await db.get(Patient, data.patient_id)
        if patient and patient.allergies:
            patient_allergies.extend([a.strip() for a in patient.allergies.split(",") if a.strip()])

    med_names = [m.name.lower() for m in data.proposed_medications]
    med_generics = [m.generic_name.lower() for m in data.proposed_medications if m.generic_name]
    all_med_tokens = set(med_names + med_generics)

    # 1. Check Drug-Drug Interactions
    for rule in DDI_RULES:
        d1, d2 = rule["drugs"]
        has_d1 = any(d1 in token for token in all_med_tokens)
        has_d2 = any(d2 in token for token in all_med_tokens)
        if has_d1 and has_d2:
            interactions.append(
                DrugInteractionWarning(
                    drug_a=d1.capitalize(),
                    drug_b=d2.capitalize(),
                    severity=rule["severity"],
                    clinical_effect=rule["effect"],
                    recommendation=rule["recommendation"],
                )
            )
            alerts.append(
                ClinicalAlert(
                    category="CONTRAINDICATION",
                    severity="CRITICAL" if rule["severity"] == "HIGH" else "WARNING",
                    title=f"Drug Interaction: {d1.capitalize()} + {d2.capitalize()}",
                    description=rule["effect"],
                    action_required=rule["recommendation"],
                )
            )

    # 2. Check Patient Allergies (with cross-reactivity)
    for allergy in patient_allergies:
        allergy_clean = allergy.lower().strip()
        matched_triggers = {allergy_clean}
        for class_key, derivatives in ALLERGY_CLASS_MAP.items():
            if class_key in allergy_clean or any(d in allergy_clean for d in derivatives):
                matched_triggers.update(derivatives)

        for med in data.proposed_medications:
            m_name = med.name.lower()
            m_gen = (med.generic_name or "").lower()
            is_match = any(trigger in m_name or (m_gen and trigger in m_gen) for trigger in matched_triggers)
            if is_match:
                alerts.append(
                    ClinicalAlert(
                        category="ALLERGY",
                        severity="CRITICAL",
                        title=f"Allergy Alert: Patient Allergic to {allergy.upper()}",
                        description=f"Prescribed medication '{med.name}' triggers cross-reactive allergy to '{allergy}'.",
                        action_required="Discontinue medication immediately and select an alternate pharmacological class.",
                    )
                )

    # 3. Pregnancy Teratogenicity Checks
    if is_pregnant:
        lifestyle_advice.append("Maternal ANC Protocol: Ensure regular IFA (Iron Folic Acid) and Calcium intake (2 hours apart).")
        for med_key, warning_text in PREGNANCY_CONTRAINDICATED.items():
            if any(med_key in token for token in all_med_tokens):
                alerts.append(
                    ClinicalAlert(
                        category="CONTRAINDICATION",
                        severity="CRITICAL",
                        title=f"Teratogenic Warning: {med_key.capitalize()} in Pregnancy",
                        description=warning_text,
                        action_required="Replace with pregnancy-safe medication (e.g. Labetalol for hypertension).",
                    )
                )

    # 4. Critical Vitals & Triage Red Flags
    is_emergency = False
    referral_urgency = "ROUTINE"

    # Blood pressure check
    bp_str = str(vitals.get("bp") or vitals.get("blood_pressure") or "")
    if "/" in bp_str:
        try:
            sys, dia = [int(x.strip()) for x in bp_str.split("/")[:2]]
            if sys >= 180 or dia >= 110:
                is_emergency = True
                referral_urgency = "EMERGENCY_108"
                alerts.append(
                    ClinicalAlert(
                        category="RED_FLAG",
                        severity="CRITICAL",
                        title="Hypertensive Urgency / Crisis Alert",
                        description=f"Recorded BP {sys}/{dia} mmHg exceeds critical thresholds. Immediate stabilization required.",
                        action_required="Dispatch 108 Emergency ambulance to District Hospital ICU and administer emergency antihypertensive.",
                    )
                )
            elif sys >= 140 or dia >= 90:
                alerts.append(
                    ClinicalAlert(
                        category="RED_FLAG",
                        severity="WARNING",
                        title="Stage 2 Hypertension Detected",
                        description=f"Blood pressure {sys}/{dia} mmHg indicates uncontrolled hypertension.",
                        action_required="Initiate Jan Aushadhi Telmisartan / Amlodipine regimen and schedule 7-day follow-up.",
                    )
                )
                lifestyle_advice.append("DASH Diet: Limit dietary salt to < 5g/day, reduce fried foods, 30 min daily brisk walk.")
        except Exception:
            pass

    # SpO2 check
    spo2 = vitals.get("spo2")
    if spo2 is not None:
        try:
            spo2_val = float(spo2)
            if spo2_val < 90:
                is_emergency = True
                referral_urgency = "EMERGENCY_108"
                alerts.append(
                    ClinicalAlert(
                        category="RED_FLAG",
                        severity="CRITICAL",
                        title="Severe Hypoxia (SpO2 < 90%)",
                        description=f"Oxygen saturation is critically low at {spo2_val}%.",
                        action_required="Initiate high-flow supplemental oxygen immediately and transfer via emergency referral.",
                    )
                )
        except Exception:
            pass

    # Temperature check
    temp = vitals.get("temp") or vitals.get("temperature")
    if temp is not None:
        try:
            temp_val = float(temp)
            if temp_val >= 103.0:
                alerts.append(
                    ClinicalAlert(
                        category="RED_FLAG",
                        severity="WARNING",
                        title="High Grade Pyrexia (Fever > 103°F)",
                        description=f"Body temperature recorded at {temp_val}°F.",
                        action_required="Perform cold sponging, administer Paracetamol 650mg, and investigate malaria/dengue markers.",
                    )
                )
        except Exception:
            pass

    # 5. Differential Diagnosis Generator (Rule-based NLP keyword mapper)
    complaints_text = " ".join(data.chief_complaints).lower()
    if data.provisional_diagnosis:
        complaints_text += f" {data.provisional_diagnosis.lower()}"

    if any(k in complaints_text for k in ["cough", "phlegm", "chest congestion", "breath"]):
        diff_diagnoses.append(
            DifferentialDiagnosis(
                condition_name="Acute Bronchitis / Lower Respiratory Infection",
                icd10_code="J20.9",
                confidence_score=0.88,
                key_indicators=["Productive cough", "Wheezing", "Subfebrile temperature"],
            )
        )
        lifestyle_advice.append("Steam inhalation twice daily, adequate hydration, avoid exposure to smoke/chulha dust.")

    if any(k in complaints_text for k in ["fever", "chills", "rigors", "joint pain", "headache"]):
        diff_diagnoses.append(
            DifferentialDiagnosis(
                condition_name="Suspected Vector-Borne Viral Infection (Dengue / Malaria)",
                icd10_code="A90",
                confidence_score=0.82,
                key_indicators=["High fever", "Retro-orbital pain", "Myalgia"],
            )
        )
        lifestyle_advice.append("Check platelet counts and blood smear for malarial parasite. Maintain oral fluid intake.")

    if any(k in complaints_text for k in ["chest pain", "sweating", "radiating pain", "palpitation"]):
        is_emergency = True
        referral_urgency = "EMERGENCY_108"
        diff_diagnoses.append(
            DifferentialDiagnosis(
                condition_name="Acute Coronary Syndrome (Suspected Myocardial Infarction)",
                icd10_code="I21.9",
                confidence_score=0.92,
                key_indicators=["Substernal chest tightness", "Diaphoresis", "Radiation to left arm"],
            )
        )
        alerts.append(
            ClinicalAlert(
                category="RED_FLAG",
                severity="CRITICAL",
                title="Cardiac Red Flag: Acute Coronary Syndrome",
                description="Presenting symptoms suggest active cardiac ischemia.",
                action_required="Perform immediate 12-lead ECG, chew Aspirin 300mg + Sorbitrate, and activate 108 Emergency transport.",
            )
        )

    if any(k in complaints_text for k in ["thirst", "frequent urination", "polyuria", "weight loss"]):
        diff_diagnoses.append(
            DifferentialDiagnosis(
                condition_name="Type 2 Diabetes Mellitus (Uncontrolled)",
                icd10_code="E11.9",
                confidence_score=0.85,
                key_indicators=["Polyuria", "Polydipsia", "Elevated fasting blood sugar"],
            )
        )
        lifestyle_advice.append("Low glycemic index diet: avoid refined sugars and potatoes, check HbA1c every 3 months.")

    # Determine overall risk level
    has_critical = any(a.severity == "CRITICAL" for a in alerts)
    has_warning = any(a.severity == "WARNING" for a in alerts)

    if is_emergency or has_critical:
        risk_level = "CRITICAL_EMERGENCY" if is_emergency else "HIGH"
    elif has_warning:
        risk_level = "MODERATE"
    else:
        risk_level = "LOW"

    rationale = (
        f"CDSS analyzed {len(data.proposed_medications)} medication(s), {len(patient_allergies)} recorded allergy profile(s), "
        f"and patient vitals snapshot. Identified {len(alerts)} clinical alert(s) and {len(interactions)} drug interaction(s)."
    )

    return CdssEvaluateResponse(
        risk_level=risk_level,
        requires_immediate_referral=is_emergency,
        referral_urgency=referral_urgency if is_emergency else "ROUTINE",
        alerts=alerts,
        drug_interactions=interactions,
        differential_diagnoses=diff_diagnoses,
        lifestyle_and_monitoring_advice=lifestyle_advice,
        rationale_summary=rationale,
    )
