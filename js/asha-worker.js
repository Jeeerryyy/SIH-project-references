/**
 * MCCPHP - Frontline Worker (ASHA / ANM) Field Station Logic
 * Offline-first sync, Marathi/English bilingual support, and high-risk maternal alerts
 */

// Language Dictionary (English & Marathi)
const i18nDict = {
  mr: {
    lang_btn: "मराठी",
    tab_overview: "आजची कामे व भेट यादी",
    tab_anc: "गरोदर माता व नवजात बाळ आरोग्य (माता काळजी)",
    tab_survey: "कुटुंब आरोग्य सर्वेक्षण व डिजिटल आरोग्य कार्ड",
    tab_ncd: "रक्तदाब व मधुमेह तपासणी (तपासणी यादी)",
    tab_referrals: "रुग्ण रेफरल व पाठपुरावा ट्रॅकर",
    tab_emergency: "आपत्कालीन रुग्णवाहिका व SOS",
    kpi_households: "नियुक्त दैनिक कार्ये (Assigned Tasks)",
    kpi_anc_count: "सक्रिय गरोदर माता",
    kpi_abha_rate: "डिजिटल आरोग्य कार्ड प्रमाण",
    kpi_visits_today: "आजच्या नियोजित गृहभेटी",
    alert_banner_title: "अति-जोखीम रेड अलर्ट: सुनिता गायकवाड (३४ वर्षे • ३२ आठवडे)",
    alert_banner_desc: "तीव्र प्री-एक्लॅम्पसिया अलर्ट (रक्तदाब १५४/९८ mmHg, हिमोग्लोबिन ७.४ g/dL). जिल्हा रुग्णालय नाशिक येथे पाठवले.",
    btn_view_emergency: "रुग्णवाहिका बोलवा",
    tbl_visits_title: "आजच्या गृहभेटी यादी (Home Visit Checklist)",
    th_patient: "रुग्णाचे नाव / लाभार्थी",
    th_village: "गाव / वाडी",
    th_category: "उद्देश / प्रवर्ग",
    th_status: "आरोग्य स्थिती / Vitals",
    th_actions: "कृती",
    anc_reg_title: "गरोदर व स्तनदा माता आरोग्य नोंदवही (Maternal Care Register)",
    form_hh_title: "नवीन कुटुंब व सदस्य नोंदणी (Family Health Survey)",
    cbac_title: "रक्तदाब व मधुमेह तपासणी यादी (General Health Checklist)",
    dispatch_title: "🚨 आपत्कालीन रुग्णवाहिका नियंत्रण कक्ष"
  },
  en: {
    lang_btn: "English",
    tab_overview: "Daily Work & Home Visits",
    tab_anc: "Pregnancy & Newborn Health (Maternal Care)",
    tab_survey: "Family Health Survey & Digital Health Card",
    tab_ncd: "Blood Pressure & Diabetes Checkup (Health Checklist)",
    tab_referrals: "Referrals & Follow-Up Care",
    tab_emergency: "Emergency Ambulance & SOS Help",
    kpi_households: "Assigned Daily Field Tasks",
    kpi_anc_count: "Active Pregnancies Tracked",
    kpi_abha_rate: "Digital Health Card Creation Rate",
    kpi_visits_today: "Scheduled Visits Today",
    alert_banner_title: "High-Risk Red Alert: Sunita Gaikwad (34 F • 32 Weeks)",
    alert_banner_desc: "Severe Pre-eclampsia Alert (BP 154/98 mmHg, Hb 7.4 g/dL). Enqueued to DH Nashik OBGYN Room 108.",
    btn_view_emergency: "Dispatch Ambulance",
    tbl_visits_title: "Today's Home Visit Checklist",
    th_patient: "Beneficiary / Patient",
    th_village: "Village / Wadi",
    th_category: "Care Purpose / Category",
    th_status: "Health Status / Vitals",
    th_actions: "Action",
    anc_reg_title: "Pregnancy & Newborn Health Register (Maternal Care)",
    form_hh_title: "New Family & Member Registration (Health Survey)",
    cbac_title: "Blood Pressure & Diabetes Checklist (General Health Screening)",
    dispatch_title: "🚨 Emergency Ambulance Tele-Dispatch Terminal"
  }
};

let currentLang = 'en';
let isOffline = false;
let pendingSyncCount = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('MCCPHP ASHA Field Station Initialized.');
  initDeviceModeSwitcher();
  initLoginScreenToggle();
});

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
        showToast('Viewing Frontline Field Station Dashboard');
      } else {
        showScreen('screenLogin');
        if (lblToggle) lblToggle.textContent = 'Back to App';
        showToast('Viewing Frontline Worker Sign-In Screen');
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

// Quick 1-Click Login Simulation
function loginAsAshaWorker() {
  showScreen('screenMainApp');
  const lblToggle = document.getElementById('lblLoginToggle');
  if (lblToggle) lblToggle.textContent = 'View Login Screen';
  showToast('Logged in as Sangita Patil (ASHA Worker • Dindori PHC)');
}

// Tab Switcher with Mobile Bottom Nav and Sidebar Icon Sync
function switchAshaTab(tabId) {
  showScreen('screenMainApp');

  // Sidebar Nav Items & Legacy Tab Items
  document.querySelectorAll('.asha-nav-item, .asha-tab-item, .window-icon-btn').forEach(item => {
    const tabAttr = item.getAttribute('data-tab');
    const onclickAttr = item.getAttribute('onclick') || '';
    if (tabAttr === tabId || onclickAttr.includes(tabId)) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Mobile Bottom Tabs
  document.querySelectorAll('.mobile-bottom-tab').forEach(btn => {
    if (btn.getAttribute('data-bottom-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Content Panels
  document.querySelectorAll('.asha-panel').forEach(panel => {
    if (panel.id === tabId) {
      panel.style.display = 'block';
      panel.classList.add('active');
    } else {
      panel.style.display = 'none';
      panel.classList.remove('active');
    }
  });
}

// Toggle Language (Bilingual support)
function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'mr' : 'en';
  const dict = i18nDict[currentLang];

  const langLbl = document.getElementById('langLabel');
  if (langLbl) langLbl.textContent = dict.lang_btn;
  
  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  showToast(currentLang === 'mr' ? "भाषा मराठी मध्ये बदलली." : "Language switched to English.");
}

// Toggle Offline Mode Simulation
function toggleOfflineModeSimulation() {
  isOffline = !isOffline;
  const pill = document.getElementById('connStatusPill');
  const dot = document.getElementById('connDot');
  const text = document.getElementById('connStatusText');
  const toggleBtnLbl = document.getElementById('btnToggleOfflineLabel');

  if (isOffline) {
    dot.className = 'status-dot offline';
    text.textContent = 'Offline Mode (Local Cache Active)';
    pill.style.background = '#fee2e2';
    pill.style.borderColor = '#fca5a5';
    toggleBtnLbl.textContent = 'Switch to Online Mode';
    showToast('Offline Mode Activated. All records will be stored in IndexedDB.');
  } else {
    dot.className = 'status-dot';
    text.textContent = 'Online (Live Sync)';
    pill.style.background = '#f1f5f9';
    pill.style.borderColor = '#cbd5e1';
    toggleBtnLbl.textContent = 'Simulate Offline Mode';
    showToast('Back Online. Background sync engine active.');
  }
}

// Trigger Manual Sync
function triggerManualSync() {
  const syncBtn = document.getElementById('lblSyncBtn');
  syncBtn.textContent = 'Syncing...';
  
  setTimeout(() => {
    pendingSyncCount = 0;
    syncBtn.textContent = `Sync (${pendingSyncCount} Queued)`;
    showToast('✓ All local household, ANC, and CBAC records successfully synchronized with MCCPHP State Gateway.');
  }, 1200);
}

// Submit Household Survey Record
function submitHouseholdRecord() {
  const headName = document.getElementById('hhHeadName').value;
  const mockABHA = '91-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
  
  if (isOffline) {
    pendingSyncCount++;
    document.getElementById('lblSyncBtn').textContent = `Sync (${pendingSyncCount} Queued)`;
  }

  // Add to Offline queue UI
  const queueList = document.getElementById('offlineQueueList');
  if (queueList) {
    const item = document.createElement('div');
    item.style.cssText = "background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;";
    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
        <strong>HH: ${headName}</strong>
        <span style="color: ${isOffline ? '#d97706' : '#059669'}; font-weight: 700;">${isOffline ? '⌛ Queued Offline' : '✓ Synced'}</span>
      </div>
      <span style="font-size: 11px; color: #64748b;">ABHA: ${mockABHA} • Generated Just Now</span>
    `;
    queueList.prepend(item);
  }

  showToast(`Success! ABHA Card created for ${headName} [ABHA: ${mockABHA}]`);
  document.getElementById('householdForm').reset();
}

// Calculate CBAC Risk Score
function calculateCBACScore() {
  const age = parseInt(document.getElementById('cbacAge').value) || 0;
  const tobacco = parseInt(document.getElementById('cbacTobacco').value) || 0;
  const alcohol = parseInt(document.getElementById('cbacAlcohol').value) || 0;
  const waist = parseInt(document.getElementById('cbacWaist').value) || 0;
  const activity = parseInt(document.getElementById('cbacActivity').value) || 0;
  const family = parseInt(document.getElementById('cbacFamily').value) || 0;

  const total = age + tobacco + alcohol + waist + activity + family;
  document.getElementById('cbacTotalScore').textContent = `${total} / 10`;
}

// Submit CBAC Assessment
function submitCBAC() {
  const name = document.getElementById('cbacName').value;
  showToast(`✓ CBAC Score recorded for ${name}. High NCD risk encounter created and routed to PHC Medical Officer.`);
}

// Initiate Emergency Referral
function initiateEmergencyReferral(patientName) {
  switchAshaTab('tab-emergency');
  showToast(`Emergency referral pathway initiated for ${patientName}`);
}

// Open Care Plan
function openCarePlan(uhid) {
  location.href = `followup.html`;
}

// Mark Immunization Given
function recordImmunization() {
  showToast('✓ Pentavalent-3 dose recorded. Digital immunization card updated on ABDM.');
}

// Open New ANC Modal
function openNewANCModal() {
  switchAshaTab('tab-survey');
  showToast('Please enumerate beneficiary details to register new ANC mother.');
}

// Dispatch 108 Ambulance
function dispatch108Ambulance() {
  showToast('🚨 108 Emergency Ambulance Dispatched! Vehicle MH-15-EM-1082 en route. Live GPS tracker active.');
}

function trigger108Dispatch() {
  showToast('🚨 108 Emergency GPS Dispatch Confirmed. District Hospital Crash Bay 1 alerted.');
}

// Mark ASHA Care Follow-Up Completed
function markAshaFollowupDone(cardId, statusTextId, patientName) {
  const statusEl = document.getElementById(statusTextId);
  if (statusEl) {
    statusEl.innerHTML = '<span style="color: #059669; font-weight: 700;">✓ Home Follow-Up Completed &amp; Synced</span>';
  }
  const card = document.getElementById(cardId);
  if (card) {
    card.style.borderColor = '#86efac';
    card.style.background = '#f0fdf4';
  }
  showToast(`✓ Follow-up for ${patientName} completed & synced with Medical Officer.`);
}

// Toast Helper
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
      z-index: 99999;
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
