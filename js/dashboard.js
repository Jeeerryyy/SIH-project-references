/**
 * Arogya Mitra - Clinical Workstation & Doctor Assessment Station Logic
 * ABDM Compliant Doctor Portal: OPD Queue, In-Person Consultation,
 * Video Teleconsultation, Generic Drug Formulary, Referrals & Follow-ups
 */

// OPD Patient Records Dataset
const opdPatientsData = {
  'A-042': {
    token: '#A-042',
    name: 'Ramesh Pawar',
    initials: 'RP',
    avatarBg: '#2563eb',
    ageGender: '52 Yrs / Male',
    uhid: 'MH-2026-004291',
    subCenter: 'Dindori Sub-Center 03 (ASHA Savita Kadam)',
    consultationType: 'remote',
    typeBadgeText: '📹 Remote Tele-OPD',
    typeBadgeStyle: 'background: #fef3c7; color: #92400e;',
    allergyText: 'Allergy: Penicillin',
    allergyStyle: 'background: #fee2e2; color: #b91c1c;',
    vitals: {
      bp: '148/92',
      bpStatus: 'Elevated (Stage 1)',
      bpColor: '#b91c1c',
      hr: '88',
      hrStatus: 'Normal',
      hrColor: '#16a34a',
      rbs: '218',
      rbsStatus: 'High Post-Prandial',
      rbsColor: '#b91c1c',
      spo2: '97%',
      spo2Status: 'Optimal',
      spo2Color: '#16a34a',
      temp: '98.6°F',
      tempStatus: 'Afebrile',
      tempColor: '#16a34a'
    },
    icd: 'ICD-11: 5A11 / BA00',
    diagnosis: 'Uncontrolled Type 2 Diabetes Mellitus + Essential Hypertension',
    notes: 'Patient connecting remotely via Arogya Mitra Teleconsult with ASHA Savita Kadam. Reports persistent mild headache and lethargy for 2 weeks. Adherence to diet has been irregular. Serum creatinine was 1.4 mg/dL last month (eGFR ~42 mL/min). Ordered HbA1c and Serum Electrolytes.',
    erx: '1. Tab. Metformin 500mg (1-0-1) After Food x 30 Days [Gov. Generic: ₹8.50]\n2. Tab. Telmisartan 40mg (1-0-0) Morning x 30 Days [Gov. Generic: ₹12.00]\n3. Tab. Atorvastatin 10mg (0-0-1) Night x 30 Days [Gov. Generic: ₹14.50]',
    actionButtons: [
      {
        label: '📹 Connect Video',
        class: 'btn-primary-emerald',
        onClick: "switchDashboardTab('tab-teleconsult')"
      }
    ]
  },
  'A-043': {
    token: '#A-043',
    name: 'Kavita Jadhav',
    initials: 'KJ',
    avatarBg: '#0f172a',
    ageGender: '28 Yrs / Female',
    uhid: 'MH-2026-009144',
    subCenter: 'In-Person (Room 104 Walk-In / Triage)',
    consultationType: 'in-person',
    typeBadgeText: '🏥 In-Person (Urgent Triage)',
    typeBadgeStyle: 'background: #ffedd5; color: #c2410c;',
    allergyText: 'Allergy: Sulfa Drugs',
    allergyStyle: 'background: #fee2e2; color: #b91c1c;',
    vitals: {
      bp: '110/72',
      bpStatus: 'Normal',
      bpColor: '#16a34a',
      hr: '104',
      hrStatus: 'Tachycardia',
      hrColor: '#ea580c',
      rbs: '98',
      rbsStatus: 'Normal Fasting',
      rbsColor: '#16a34a',
      spo2: '98%',
      spo2Status: 'Optimal',
      spo2Color: '#16a34a',
      temp: '103.2°F',
      tempStatus: 'High Grade Fever',
      tempColor: '#b91c1c'
    },
    icd: 'ICD-11: 1F40 / MG22',
    diagnosis: 'Acute Febrile Illness with Dehydration (Suspected Dengue / Malaria)',
    notes: 'In-person urgent checkup. High grade fever since 3 days with chills, rigors, nausea, and 2 episodes of non-bilious vomiting. Mild epigastric tenderness. NS1 antigen, MP card test, and CBC ordered immediately.',
    erx: '1. Tab. Paracetamol 650mg (1-1-1) After Food x 5 Days [Gov. Generic: ₹4.20]\n2. Tab. Ondansetron 4mg (1-0-1) Before Food x 3 Days [Gov. Generic: ₹6.00]\n3. Oral Rehydration Salts (ORS) Sachets (2 packets/day in 1L water) x 3 Days [Gov. Generic: ₹5.50]',
    actionButtons: [
      {
        label: '🧪 Order Stat Labs (CBC / NS1)',
        class: 'btn-primary-blue',
        onClick: "showToast('Stat lab orders sent to Hospital Pathology: CBC, NS1 Antigen, MP Card')"
      },
      {
        label: '🫁 Clinical Exam Notes',
        class: 'btn-secondary-white',
        onClick: "showToast('In-Person Exam: Temp 103.2°F, mild dehydration, pulse 104 bpm regular')"
      }
    ]
  },
  'A-045': {
    token: '#A-045',
    name: 'Vikas Deshmukh',
    initials: 'VD',
    avatarBg: '#059669',
    ageGender: '36 Yrs / Male',
    uhid: 'MH-2026-004351',
    subCenter: 'In-Person (Room 104 Followup Desk)',
    consultationType: 'in-person',
    typeBadgeText: '🏥 In-Person (Routine Followup)',
    typeBadgeStyle: 'background: #dcfce7; color: #15803d;',
    allergyText: 'NKDA (No Drug Allergies)',
    allergyStyle: 'background: #f1f5f9; color: #475569;',
    vitals: {
      bp: '130/84',
      bpStatus: 'Pre-Hypertension (Stable)',
      bpColor: '#b45309',
      hr: '74',
      hrStatus: 'Normal',
      hrColor: '#16a34a',
      rbs: '108',
      rbsStatus: 'Normal',
      rbsColor: '#16a34a',
      spo2: '99%',
      spo2Status: 'Optimal',
      spo2Color: '#16a34a',
      temp: '98.4°F',
      tempStatus: 'Afebrile',
      tempColor: '#16a34a'
    },
    icd: 'ICD-11: BA00',
    diagnosis: 'Essential Hypertension (Controlled on Monotherapy)',
    notes: 'In-person routine monthly BP followup. Patient seated in clinic. Reports compliant medication intake and daily 30-min walking. No chest discomfort, dizziness, or visual disturbances.',
    erx: '1. Tab. Amlodipine 5mg (1-0-0) Morning x 30 Days [Gov. Generic: ₹7.00]\n2. Tab. Calcium + Vit D3 (0-1-0) After Food x 30 Days [Gov. Generic: ₹11.50]',
    actionButtons: [
      {
        label: '🩺 Physical BP Check',
        class: 'btn-primary-blue',
        onClick: "showToast('Manual Sphygmomanometer Check in clinic: 128/82 mmHg (sitting)')"
      },
      {
        label: '🖨️ Print OPD Slip',
        class: 'btn-secondary-white',
        onClick: "showToast('OPD consultation slip sent to Room 104 thermal printer')"
      }
    ]
  },
  'A-046': {
    token: '#A-046',
    name: 'Pooja Salve',
    initials: 'PS',
    avatarBg: '#475569',
    ageGender: '24 Yrs / Female',
    uhid: 'MH-2026-007821',
    subCenter: 'In-Person (Room 104 Walk-In)',
    consultationType: 'in-person',
    typeBadgeText: '🏥 In-Person (Walk-In Checkup)',
    typeBadgeStyle: 'background: #f1f5f9; color: #475569;',
    allergyText: 'Allergy: NSAIDs (Ibuprofen)',
    allergyStyle: 'background: #fee2e2; color: #b91c1c;',
    vitals: {
      bp: '118/76',
      bpStatus: 'Normal',
      bpColor: '#16a34a',
      hr: '78',
      hrStatus: 'Normal',
      hrColor: '#16a34a',
      rbs: '92',
      rbsStatus: 'Normal',
      rbsColor: '#16a34a',
      spo2: '99%',
      spo2Status: 'Optimal',
      spo2Color: '#16a34a',
      temp: '99.1°F',
      tempStatus: 'Mild Sub-febrile',
      tempColor: '#b45309'
    },
    icd: 'ICD-11: CA40',
    diagnosis: 'Acute Upper Respiratory Tract Infection (URI) / Viral Rhinitis',
    notes: 'In-person examination. Productive cough with clear sputum for 4 days, nasal congestion and throat irritation. Chest clear on auscultation. Advised steam inhalation and warm fluid intake.',
    erx: '1. Syp. Ambroxol + Guaifenesin 100ml (2 tsp TDS) x 5 Days [Gov. Generic: ₹18.00]\n2. Tab. Cetirizine 10mg (0-0-1) Night x 5 Days [Gov. Generic: ₹3.50]\n3. Tab. Vitamin C 500mg (1-0-0) x 10 Days [Gov. Generic: ₹6.00]',
    actionButtons: [
      {
        label: '🩺 Throat & Auscultation',
        class: 'btn-primary-blue',
        onClick: "showToast('Clinical Exam: Mild pharyngeal congestion; lungs clear vesicular.')"
      },
      {
        label: '🖨️ Print eRx',
        class: 'btn-secondary-white',
        onClick: "showToast('Generic prescription printed for patient')"
      }
    ]
  }
};

let currentPatientToken = 'A-042';
let teleconsultTimerInterval = null;
let teleconsultElapsedSeconds = 252; // 4m 12s initial

document.addEventListener('DOMContentLoaded', () => {
  initDeviceModeSwitcher();
  initLoginScreenToggle();

  // Initialize initial patient action buttons
  loadOpdPatient('A-042');

  // Tab Navigation Controller across all 5 Workstation Views
  const tabs = document.querySelectorAll('.dashboard-tab-item');
  const viewPanels = document.querySelectorAll('.dashboard-tab-panel');
  const footerStatusText = document.getElementById('footerStatusText');
  const nextStepBtn = document.getElementById('nextStepBtn');
  const prevStepBtn = document.getElementById('prevStepBtn');

  const tabOrder = ['tab-overview', 'tab-teleconsult', 'tab-referrals', 'tab-followups', 'tab-jan-aushadhi'];

  function switchDashboardTab(targetTabId) {
    showScreen('screenMainApp');

    // Update top tabs
    tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.target === targetTabId);
    });

    // Update sidebar navigation icons
    document.querySelectorAll('.window-icon-btn').forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      btn.classList.toggle('active', onclickAttr.includes(targetTabId));
    });

    // Update mobile bottom tabs
    document.querySelectorAll('.mobile-bottom-tab').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-bottom-tab') === targetTabId);
    });

    // Update panels
    viewPanels.forEach(panel => {
      panel.style.display = panel.id === targetTabId ? 'block' : 'none';
    });

    // Update breadcrumb active tab name
    const breadcrumbTabName = document.getElementById('breadcrumbActiveTabName');
    if (breadcrumbTabName) {
      if (targetTabId === 'tab-overview') {
        breadcrumbTabName.textContent = '🩺 Patient Consultation & eRx';
      } else if (targetTabId === 'tab-teleconsult') {
        breadcrumbTabName.textContent = '📹 Video Teleconsultation';
      } else if (targetTabId === 'tab-referrals') {
        breadcrumbTabName.textContent = '📥 My Hospital Referrals';
      } else if (targetTabId === 'tab-followups') {
        breadcrumbTabName.textContent = '📅 Follow-Up Patients Tracker';
      } else if (targetTabId === 'tab-jan-aushadhi') {
        breadcrumbTabName.textContent = '💊 Generic Medicine Stock';
      }
    }

    // Update footer status text
    if (footerStatusText) {
      if (targetTabId === 'tab-overview') {
        const p = opdPatientsData[currentPatientToken] || opdPatientsData['A-042'];
        const typeStr = p.consultationType === 'remote' ? 'Remote Video' : 'In-Person';
        footerStatusText.innerHTML = `🩺 Status: Active ${typeStr} Encounter (${p.name} • ${p.token})`;
      } else if (targetTabId === 'tab-teleconsult') {
        footerStatusText.innerHTML = '📹 Status: Video Teleconsultation Station Active';
      } else if (targetTabId === 'tab-referrals') {
        footerStatusText.innerHTML = '📥 Status: Inbound &amp; Outbound Hospital Referrals Sync Active';
      } else if (targetTabId === 'tab-followups') {
        footerStatusText.innerHTML = '📅 Status: NCD &amp; Chronic Follow-Up Tracker Active (48 Patients)';
      } else if (targetTabId === 'tab-jan-aushadhi') {
        footerStatusText.innerHTML = '💊 Status: Generic Drug Stock Synchronized';
      }
    }
  }

  window.switchDashboardTab = switchDashboardTab;

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchDashboardTab(tab.dataset.target);
    });
  });

  // Next / Previous Step Navigation
  if (nextStepBtn) {
    nextStepBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.dashboard-tab-item.active');
      const currentId = activeTab ? activeTab.dataset.target : tabOrder[0];
      const currentIndex = tabOrder.indexOf(currentId);
      const nextIndex = (currentIndex + 1) % tabOrder.length;
      switchDashboardTab(tabOrder[nextIndex]);
    });
  }

  if (prevStepBtn) {
    prevStepBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.dashboard-tab-item.active');
      const currentId = activeTab ? activeTab.dataset.target : tabOrder[0];
      const currentIndex = tabOrder.indexOf(currentId);
      const prevIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
      switchDashboardTab(tabOrder[prevIndex]);
    });
  }

  // Generic Medicine Table Filter / Search
  const tableSearch = document.getElementById('tableSearchInput');
  if (tableSearch) {
    tableSearch.addEventListener('input', function() {
      const q = this.value.toLowerCase();
      document.querySelectorAll('.mccphp-data-table tbody tr').forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }
});

// Load and Switch Active Patient in Room 104 OPD
function loadOpdPatient(tokenId) {
  const p = opdPatientsData[tokenId];
  if (!p) return;

  currentPatientToken = tokenId;

  // Highlight queue chips
  document.querySelectorAll('.queue-patient-chip').forEach(chip => {
    chip.classList.toggle('active-patient', chip.dataset.token === tokenId);
  });

  // Update Header details
  const avatarEl = document.getElementById('patientAvatarEl');
  const nameEl = document.getElementById('patientNameEl');
  const ageGenderEl = document.getElementById('patientAgeGenderEl');
  const uhidEl = document.getElementById('patientUhidEl');
  const tokenEl = document.getElementById('patientTokenEl');
  const typeBadge = document.getElementById('patientTypeBadge');
  const allergyBadge = document.getElementById('patientAllergyBadge');
  const subCenterEl = document.getElementById('patientSubCenterEl');
  const actionContainer = document.getElementById('patientActionButtonsContainer');

  if (avatarEl) {
    avatarEl.textContent = p.initials;
    avatarEl.style.background = p.avatarBg;
  }
  if (nameEl) nameEl.textContent = p.name;
  if (ageGenderEl) ageGenderEl.textContent = p.ageGender;
  if (uhidEl) uhidEl.textContent = p.uhid;
  if (tokenEl) tokenEl.textContent = p.token;
  if (subCenterEl) subCenterEl.textContent = p.subCenter;

  if (typeBadge) {
    typeBadge.textContent = p.typeBadgeText;
    typeBadge.style.cssText = `font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${p.typeBadgeStyle}`;
  }

  if (allergyBadge) {
    allergyBadge.textContent = p.allergyText;
    allergyBadge.style.cssText = `font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${p.allergyStyle}`;
  }

  // Render contextual action buttons for In-Person vs Remote Video
  if (actionContainer) {
    actionContainer.innerHTML = '';
    if (p.actionButtons && p.actionButtons.length > 0) {
      p.actionButtons.forEach(btn => {
        const btnEl = document.createElement('button');
        btnEl.className = btn.class;
        btnEl.style.cssText = `padding: 6px 12px; font-size: 12px; cursor: pointer; ${btn.style || ''}`;
        btnEl.setAttribute('onclick', btn.onClick);
        btnEl.innerHTML = btn.label;
        actionContainer.appendChild(btnEl);
      });
    }
  }

  // Update Vitals
  const vBp = document.getElementById('vitalBp');
  const vHr = document.getElementById('vitalHr');
  const vRbs = document.getElementById('vitalRbs');
  const vSpo2 = document.getElementById('vitalSpo2');
  const vTemp = document.getElementById('vitalTemp');

  if (vBp) {
    vBp.innerHTML = `${p.vitals.bp} <span style="font-size: 10px; font-weight: 600; color: #64748b;">mmHg</span>`;
    vBp.style.color = p.vitals.bpColor;
    if (vBp.nextElementSibling) {
      vBp.nextElementSibling.textContent = p.vitals.bpStatus;
      vBp.nextElementSibling.style.color = p.vitals.bpColor;
    }
  }

  if (vHr) {
    vHr.innerHTML = `${p.vitals.hr} <span style="font-size: 10px; font-weight: 600; color: #64748b;">bpm</span>`;
    vHr.style.color = p.vitals.hrColor;
    if (vHr.nextElementSibling) {
      vHr.nextElementSibling.textContent = p.vitals.hrStatus;
      vHr.nextElementSibling.style.color = p.vitals.hrColor;
    }
  }

  if (vRbs) {
    vRbs.innerHTML = `${p.vitals.rbs} <span style="font-size: 10px; font-weight: 600; color: #64748b;">mg/dL</span>`;
    vRbs.style.color = p.vitals.rbsColor;
    if (vRbs.nextElementSibling) {
      vRbs.nextElementSibling.textContent = p.vitals.rbsStatus;
      vRbs.nextElementSibling.style.color = p.vitals.rbsColor;
    }
  }

  if (vSpo2) {
    vSpo2.innerHTML = p.vitals.spo2;
    vSpo2.style.color = p.vitals.spo2Color;
    if (vSpo2.nextElementSibling) {
      vSpo2.nextElementSibling.textContent = p.vitals.spo2Status;
      vSpo2.nextElementSibling.style.color = p.vitals.spo2Color;
    }
  }

  if (vTemp) {
    vTemp.innerHTML = p.vitals.temp;
    vTemp.style.color = p.vitals.tempColor;
    if (vTemp.nextElementSibling) {
      vTemp.nextElementSibling.textContent = p.vitals.tempStatus;
      vTemp.nextElementSibling.style.color = p.vitals.tempColor;
    }
  }

  // Update Diagnosis & eRx text areas
  const diagInput = document.getElementById('opdDiagnosisInput');
  const notesInput = document.getElementById('opdNotesInput');
  const erxText = document.getElementById('opdErxText');

  if (diagInput) diagInput.value = p.diagnosis;
  if (notesInput) notesInput.value = p.notes;
  if (erxText) erxText.value = p.erx;

  const modeStr = p.consultationType === 'remote' ? 'Remote Teleconsult' : 'In-Person OPD';
  showToast(`Loaded Patient Record: ${p.name} (${p.token} • ${modeStr})`);
}

// Complete Current Patient Encounter and Advance to Next in Queue
function completeEncounterAndCallNext() {
  const currentP = opdPatientsData[currentPatientToken];
  const keys = Object.keys(opdPatientsData);
  const currentIndex = keys.indexOf(currentPatientToken);
  const nextIndex = (currentIndex + 1) % keys.length;
  const nextKey = keys[nextIndex];

  showToast(`✓ Encounter for ${currentP ? currentP.name : 'Patient'} completed & pushed to ABDM repository. Calling next patient...`);

  setTimeout(() => {
    loadOpdPatient(nextKey);
  }, 600);
}

// Teleconsultation Call Flow Handlers
function acceptTeleconsultCall() {
  const standbyView = document.getElementById('teleconsultStandbyView');
  const session = document.getElementById('teleconsultActiveSession');

  if (standbyView) standbyView.style.display = 'none';
  if (session) session.style.display = 'grid';

  // Reset and start live call timer from 00:00
  teleconsultElapsedSeconds = 0;
  if (teleconsultTimerInterval) {
    clearInterval(teleconsultTimerInterval);
  }

  const timerEl = document.getElementById('teleconsultTimer');
  if (timerEl) {
    timerEl.textContent = '● Live: 00:00 • HD 1080p';
  }

  teleconsultTimerInterval = setInterval(() => {
    teleconsultElapsedSeconds++;
    const mins = Math.floor(teleconsultElapsedSeconds / 60).toString().padStart(2, '0');
    const secs = (teleconsultElapsedSeconds % 60).toString().padStart(2, '0');
    if (timerEl) {
      timerEl.textContent = `● Live: ${mins}:${secs} • HD 1080p`;
    }
  }, 1000);

  showToast('📞 Live Encrypted WebRTC Session Started: Connected to Dindori Sub-Center 03 (ASHA Savita Kadam)');
}

function endTeleconsult() {
  if (teleconsultTimerInterval) {
    clearInterval(teleconsultTimerInterval);
    teleconsultTimerInterval = null;
  }

  const mins = Math.floor(teleconsultElapsedSeconds / 60).toString().padStart(2, '0');
  const secs = (teleconsultElapsedSeconds % 60).toString().padStart(2, '0');
  const durationStr = `${mins}m ${secs}s`;

  showToast(`Teleconsultation ended (Duration: ${durationStr}). Encounter notes & eRx saved to ABDM.`);

  const standbyView = document.getElementById('teleconsultStandbyView');
  const session = document.getElementById('teleconsultActiveSession');

  if (session) session.style.display = 'none';
  if (standbyView) standbyView.style.display = 'block';
}

function signAndSendPrescription() {
  showToast('✓ e-Prescription digitally signed (Dr. Ramesh Patil, HPR-MH-9482) & pushed to Arogya Mitra patient app.');
}

// Generic Medicine Search & Add
function filterJanMedicines() {
  const query = document.getElementById('janMedSearch').value.toLowerCase();
  const rows = document.querySelectorAll('#janMedTable tbody tr');
  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

function addGenericToRx(medName) {
  showToast(`Added ${medName} (Government Generic) to active eRx prescription.`);
  switchDashboardTab('tab-overview');
}

// Device Mode Switcher (Mobile App Simulator vs Desktop View)
function initDeviceModeSwitcher() {
  const deviceFrame = document.getElementById('phoneDeviceFrame');
  const btnMobile = document.getElementById('btnViewMobile');
  const btnDesktop = document.getElementById('btnViewDesktop');

  if (!deviceFrame || !btnMobile || !btnDesktop) return;

  btnMobile.addEventListener('click', () => {
    btnMobile.classList.add('active');
    btnDesktop.classList.remove('active');
    deviceFrame.classList.remove('desktop-mode');
    showToast('Switched to Mobile App Simulator Mode');
  });

  btnDesktop.addEventListener('click', () => {
    btnDesktop.classList.add('active');
    btnMobile.classList.remove('active');
    deviceFrame.classList.add('desktop-mode');
    showToast('Switched to Desktop Expanded View Mode');
  });
}

// Login Screen Toggle
function initLoginScreenToggle() {
  const btnToggle = document.getElementById('btnToggleLoginScreen');
  const lblToggle = document.getElementById('lblLoginToggle');

  if (btnToggle) {
    btnToggle.addEventListener('click', () => {
      const loginScreen = document.getElementById('screenLogin');
      const isLoginVisible = loginScreen && loginScreen.style.display !== 'none';

      if (isLoginVisible) {
        showScreen('screenMainApp');
        if (lblToggle) lblToggle.textContent = 'View Login Screen';
        showToast('Viewing Doctor Clinical Dashboard');
      } else {
        showScreen('screenLogin');
        if (lblToggle) lblToggle.textContent = 'Back to App';
        showToast('Viewing Doctor Sign-In Screen (HPR Portal)');
      }
    });
  }
}

// Screen Routing helper
function showScreen(screenId) {
  const loginScreen = document.getElementById('screenLogin');
  const mainApp = document.getElementById('screenMainApp');
  const bottomNav = document.querySelector('.mobile-bottom-nav');

  if (screenId === 'screenLogin') {
    if (loginScreen) loginScreen.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
    if (bottomNav) bottomNav.style.display = 'none';
  } else {
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    if (bottomNav) bottomNav.style.display = 'flex';
  }
}

// Fast Login
function loginAsDoctor() {
  showScreen('screenMainApp');
  const lblToggle = document.getElementById('lblLoginToggle');
  if (lblToggle) lblToggle.textContent = 'View Login Screen';
  showToast('Logged in as Dr. Ramesh Patil (MD • General Medicine OPD)');
}

// Global Toast Helper
function showToast(msg) {
  let toast = document.getElementById('mccphpGlobalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mccphpGlobalToast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0d1b2a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 999999;
      border-left: 4px solid #06d6a0;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span>✓</span><span>${msg}</span>`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3500);
}
