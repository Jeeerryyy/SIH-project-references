/**
 * MCCPHP - Hospital Queue Manager (Profile 2) & Hospital Administrator (Profile 3)
 * Clean, minimal, high-performance workstation controller.
 */

// Global State
let currentCallingToken = "A-042";
let currentProfile = "queue-manager"; // 'queue-manager' or 'hospital-admin'
let tokenCounter = 48;

let currentPatient = {
  name: "Ramesh Pawar (52 M)",
  uhid: "MH-2026-004291",
  token: "A-042",
  room: "Room 104",
  doctor: "Dr. Ramesh Patil (MD)",
  triage: "ESI 3 - Urgent",
  complaint: "Chest Tightness & Dyspnea"
};

let consultSecondsElapsed = 434; // 07:14 min
let consultTimerInterval = null;

// Queue Database by Room
const roomQueueData = {
  "room-104": {
    doctor: "Dr. Ramesh Patil (Internal Med)",
    roomLabel: "ROOM 104 • INTERNAL MEDICINE",
    activeToken: "A-042",
    patientName: "Ramesh Pawar (52 M)",
    uhid: "MH-2026-004291",
    triage: "ESI 3 - Urgent",
    triageClass: "triage-yellow",
    complaint: "⚠️ Chest discomfort, Known T2DM • Scheduled Review",
    vitals: "BP: 130/84 | SpO2: 97% | HR: 76",
    redCount: 2,
    yellowCount: 4,
    greenCount: 7,
    blueCount: 5
  },
  "room-102": {
    doctor: "Dr. Sneha Shinde (Pediatrics)",
    roomLabel: "ROOM 102 • PEDIATRICS OPD",
    activeToken: "P-018",
    patientName: "Anaya Shinde (4 F)",
    uhid: "MH-2026-004812",
    triage: "ESI 3 - Urgent",
    triageClass: "triage-yellow",
    complaint: "High fever 102°F + Persistent vomiting & Dehydration",
    vitals: "Temp: 102.2°F | SpO2: 98% | HR: 110",
    redCount: 1,
    yellowCount: 3,
    greenCount: 4,
    blueCount: 1
  },
  "room-108": {
    doctor: "Dr. Anil Kadam (Gynecology & ANC)",
    roomLabel: "ROOM 108 • OBSTETRICS & ANC",
    activeToken: "G-029",
    patientName: "Sunita Gaikwad (34 F)",
    uhid: "MH-2026-008910",
    triage: "ESI 2 - High Priority",
    triageClass: "triage-orange",
    complaint: "Severe Pre-eclampsia BP 154/98 • ANC 3rd Trimester",
    vitals: "BP: 154/98 | SpO2: 98% | HR: 108",
    redCount: 2,
    yellowCount: 5,
    greenCount: 6,
    blueCount: 1
  },
  "triage-bay": {
    doctor: "Dr. Sandeep Deshmukh (Emergency Physician)",
    roomLabel: "EMERGENCY TRIAGE BAY (RED/YELLOW)",
    activeToken: "EM-007",
    patientName: "Babanrao Shirole (68 M)",
    uhid: "MH-2026-009941",
    triage: "ESI 1 - Resuscitation",
    triageClass: "triage-red",
    complaint: "SpO2 84% • Acute Respiratory Distress • O2 started",
    vitals: "SpO2: 84% | HR: 122 | BP: 140/90",
    redCount: 4,
    yellowCount: 2,
    greenCount: 0,
    blueCount: 0
  },
  "lab-01": {
    doctor: "Tech. Sunita B. (Phlebotomy Counter)",
    roomLabel: "CENTRAL DIAGNOSTICS & BLOOD LAB",
    activeToken: "L-055",
    patientName: "Ganesh Kadam (31 M)",
    uhid: "MH-2026-004390",
    triage: "ESI 5 - Fast-Track",
    triageClass: "triage-blue",
    complaint: "Fasting Blood Sugar & Lipid Profile Sample Collection",
    vitals: "Routine Fasting Sample",
    redCount: 0,
    yellowCount: 1,
    greenCount: 2,
    blueCount: 3
  },
  "pharmacy-02": {
    doctor: "Pharm. Vinod Shinde (Government Pharmacy)",
    roomLabel: "GOVT. PHARMACY (DISPENSARY 02)",
    activeToken: "RX-112",
    patientName: "Mangala Shinde (58 F)",
    uhid: "MH-2026-004381",
    triage: "ESI 5 - Fast-Track",
    triageClass: "triage-blue",
    complaint: "Chronic NCD Monthly Generic Drug Refill",
    vitals: "Monthly Prescription Dispense",
    redCount: 0,
    yellowCount: 0,
    greenCount: 2,
    blueCount: 9
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('MCCPHP Queue & Hospital Admin Workstation Initialized.');
  startConsultTimer();
  initDeviceModeSwitcher();
  initLoginScreenToggle();
  updateQueueCounts();

  // Check URL param for profile
  const urlParams = new URLSearchParams(window.location.search);
  const requestedProfile = urlParams.get('profile');
  
  if (requestedProfile === 'admin' || requestedProfile === 'hospital-admin') {
    switchProfile('hospital-admin');
  } else {
    switchProfile('queue-manager');
  }
});

// Switch Between Profile 2 (Queue Manager) and Profile 3 (Hospital Admin)
function switchProfile(profileId) {
  currentProfile = profileId;
  const btnProfileDoctor = document.getElementById('btnProfileDoctor');
  const btnProfileQueue = document.getElementById('btnProfileQueue');
  const btnProfileAdmin = document.getElementById('btnProfileAdmin');
  const tabStrip = document.getElementById('queueTabStrip');
  const sidebarNav = document.getElementById('sidebarNavIcons');
  const sidebarAvatar = document.getElementById('sidebarUserAvatar');
  const roleHeader = document.getElementById('breadcrumbRoleHeader');
  const subHeader = document.getElementById('breadcrumbSubHeader');
  const roomSelectorWrap = document.getElementById('roomSelectorWrap');
  const mobileAvatar = document.getElementById('mobileAvatarBadge');
  const mobileGreeting = document.getElementById('mobileGreetingText');
  const mobileStatusSub = document.getElementById('mobileStatusSub');

  if (profileId === 'queue-manager') {
    if (btnProfileQueue) btnProfileQueue.classList.add('active');
    if (btnProfileAdmin) btnProfileAdmin.classList.remove('active');
    if (btnProfileDoctor) btnProfileDoctor.classList.remove('active');

    if (sidebarAvatar) {
      sidebarAvatar.textContent = 'SS';
      sidebarAvatar.style.background = '#5438dc';
      sidebarAvatar.title = 'Suresh Shinde (OPD Queue Lead)';
    }
    if (mobileAvatar) {
      mobileAvatar.textContent = 'SS';
      mobileAvatar.style.background = '#5438dc';
    }
    if (mobileGreeting) mobileGreeting.textContent = 'Suresh Shinde (Queue Lead)';
    if (mobileStatusSub) mobileStatusSub.textContent = 'DH Nashik • Counter 01 Active';

    if (roleHeader) roleHeader.textContent = 'OPD Registration & Queue Hub';
    if (subHeader) subHeader.textContent = 'In-Person Appointment Booking & Room Dispatch';
    if (roomSelectorWrap) roomSelectorWrap.style.display = 'flex';

    // Render Tabs for Queue Manager
    if (tabStrip) {
      tabStrip.innerHTML = `
        <button class="queue-tab-item active" data-tab="tab-inperson-booking" onclick="switchQueueTab('tab-inperson-booking')">
          <i class="fas fa-calendar-plus"></i> In-Person Walk-In Booking
        </button>
        <button class="queue-tab-item" data-tab="tab-live-board" onclick="switchQueueTab('tab-live-board')">
          <i class="fas fa-list-ol"></i> Live OPD Room Queue Dispatcher
          <span class="tab-pill-counter" id="liveQueueCountBadge">18</span>
        </button>
        <button class="queue-tab-item" data-tab="tab-patient-stub" onclick="switchQueueTab('tab-patient-stub')">
          <i class="fas fa-ticket-alt"></i> Patient Boarding Pass &amp; QR
        </button>
      `;
    }

    // Render Sidebar Icons for Queue Manager
    if (sidebarNav) {
      sidebarNav.innerHTML = `
        <button class="window-icon-btn active" title="In-Person Booking &amp; Registration" onclick="switchQueueTab('tab-inperson-booking')">
          <i class="fas fa-calendar-plus"></i>
        </button>
        <button class="window-icon-btn" title="Live Room Queue Dispatcher" onclick="switchQueueTab('tab-live-board')">
          <i class="fas fa-list-ol"></i>
        </button>
        <button class="window-icon-btn" title="Patient Digital Queue Pass" onclick="switchQueueTab('tab-patient-stub')">
          <i class="fas fa-ticket-alt"></i>
        </button>
      `;
    }

    switchQueueTab('tab-inperson-booking');
    showToast('Switched to Profile 2: OPD Queue Manager & Walk-In Desk');

  } else if (profileId === 'hospital-admin') {
    if (btnProfileAdmin) btnProfileAdmin.classList.add('active');
    if (btnProfileQueue) btnProfileQueue.classList.remove('active');
    if (btnProfileDoctor) btnProfileDoctor.classList.remove('active');

    if (sidebarAvatar) {
      sidebarAvatar.textContent = 'SD';
      sidebarAvatar.style.background = '#0284c7';
      sidebarAvatar.title = 'Dr. Sunita Deshmukh (Medical Superintendent)';
    }
    if (mobileAvatar) {
      mobileAvatar.textContent = 'SD';
      mobileAvatar.style.background = '#0284c7';
    }
    if (mobileGreeting) mobileGreeting.textContent = 'Dr. Sunita Deshmukh (Med Superintendent)';
    if (mobileStatusSub) mobileStatusSub.textContent = 'DH Nashik • Hospital Command Active';

    if (roleHeader) roleHeader.textContent = 'Hospital Operations & Staff/Inventory Command';
    if (subHeader) subHeader.textContent = 'Facility Overview, Roster & Priority Urgency Tracker';
    if (roomSelectorWrap) roomSelectorWrap.style.display = 'none';

    // Render Tabs for Hospital Admin
    if (tabStrip) {
      tabStrip.innerHTML = `
        <button class="queue-tab-item active" data-tab="tab-triage-matrix" onclick="switchQueueTab('tab-triage-matrix')">
          <i class="fas fa-traffic-light"></i> Waiting Line &amp; Triage Priority
        </button>
        <button class="queue-tab-item" data-tab="tab-staff-roster" onclick="switchQueueTab('tab-staff-roster')">
          <i class="fas fa-user-md"></i> Staff &amp; Doctors On-Duty Roster
        </button>
        <button class="queue-tab-item" data-tab="tab-inventory-alerts" onclick="switchQueueTab('tab-inventory-alerts')">
          <i class="fas fa-pills"></i> Medicine Inventory &amp; Stock Alerts
        </button>
        <button class="queue-tab-item" data-tab="tab-crash-beds" onclick="switchQueueTab('tab-crash-beds')">
          <i class="fas fa-procedures"></i> Emergency Bay &amp; Crash Beds
        </button>
      `;
    }

    // Render Sidebar Icons for Hospital Admin
    if (sidebarNav) {
      sidebarNav.innerHTML = `
        <button class="window-icon-btn active" title="Waiting Line &amp; Urgency Priority Check" onclick="switchQueueTab('tab-triage-matrix')">
          <i class="fas fa-traffic-light"></i>
        </button>
        <button class="window-icon-btn" title="Doctor &amp; Staff Shift Roster" onclick="switchQueueTab('tab-staff-roster')">
          <i class="fas fa-user-md"></i>
        </button>
        <button class="window-icon-btn" title="Medicine Inventory &amp; Stock" onclick="switchQueueTab('tab-inventory-alerts')">
          <i class="fas fa-pills"></i>
        </button>
        <button class="window-icon-btn" title="Crash Beds &amp; Oxygen Bank" onclick="switchQueueTab('tab-crash-beds')">
          <i class="fas fa-procedures"></i>
        </button>
      `;
    }

    switchQueueTab('tab-triage-matrix');
    showToast('Switched to Profile 3: Hospital Administrator & Operations Command');
  }
}

// Live Consultation Timer
function startConsultTimer() {
  if (consultTimerInterval) clearInterval(consultTimerInterval);
  
  consultTimerInterval = setInterval(() => {
    consultSecondsElapsed++;
    const mins = Math.floor(consultSecondsElapsed / 60);
    const secs = consultSecondsElapsed % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const timerEl = document.getElementById('consultTimer');
    if (timerEl) {
      timerEl.textContent = `Consult Elapsed: ${formatted} min`;
    }
  }, 1000);
}

// Tab Switcher
function switchQueueTab(tabId) {
  showScreen('screenMainApp');

  // Update Tab Items
  document.querySelectorAll('.queue-tab-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update Internal Sidebar Icons
  document.querySelectorAll('.window-nav-icons .window-icon-btn').forEach(btn => {
    const fnStr = btn.getAttribute('onclick') || '';
    if (fnStr.includes(tabId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Mobile Bottom Tabs
  document.querySelectorAll('.mobile-bottom-tab').forEach(btn => {
    const fnStr = btn.getAttribute('onclick') || '';
    if (fnStr.includes(tabId)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update Panels
  document.querySelectorAll('.queue-panel').forEach(panel => {
    if (panel.id === tabId) {
      panel.style.display = 'block';
      panel.classList.add('active');
    } else {
      panel.style.display = 'none';
      panel.classList.remove('active');
    }
  });

  if (tabId === 'tab-live-board') {
    updateQueueCounts();
  }
}

// Update Attending Doctor when Department changes
function updateBookingDoctor(dept) {
  const docInput = document.getElementById('bookDoctor');
  if (!docInput) return;

  if (dept === 'room-104') docInput.value = 'Dr. Ramesh Patil (MD)';
  else if (dept === 'room-102') docInput.value = 'Dr. Sneha Shinde (Pediatrics)';
  else if (dept === 'room-108') docInput.value = 'Dr. Anil Kadam (OB-GYN)';
  else if (dept === 'triage-bay') docInput.value = 'Dr. Sandeep Deshmukh (Emergency)';
  else if (dept === 'lab-01') docInput.value = 'Tech. Sunita B. (Phlebotomy)';
  else docInput.value = 'Dr. Ramesh Patil (MD)';
}

// In-Person Appointment Booking & Token Slip Generation
function bookInPersonPatient() {
  const name = document.getElementById('bookPatientName').value || 'Walk-In Patient';
  const ageGen = document.getElementById('bookPatientAgeGender').value || '35 M';
  const mobile = document.getElementById('bookPatientMobile').value || '+91 98221 44091';
  const abha = document.getElementById('bookPatientABHA').value || '91-4421-9980-1209';
  const dept = document.getElementById('bookDept').value;
  const doctor = document.getElementById('bookDoctor').value;
  const complaint = document.getElementById('bookComplaint').value || 'General Consultation';
  const triage = document.getElementById('bookTriage').value;

  tokenCounter++;
  const generatedToken = `A-${String(tokenCounter).padStart(3, '0')}`;

  // Update Live Token Preview on the right
  const previewTokenEl = document.getElementById('previewTokenId');
  const previewPatientEl = document.getElementById('previewPatientTitle');
  const previewDeptEl = document.getElementById('previewDeptTitle');

  if (previewTokenEl) previewTokenEl.textContent = `#${generatedToken}`;
  if (previewPatientEl) previewPatientEl.textContent = `${name} (${ageGen})`;
  if (previewDeptEl) previewDeptEl.textContent = `${dept === 'room-104' ? 'General Medicine • Room 104' : dept} • ${doctor}`;

  // Update Boarding Pass Tab (#tab-patient-stub)
  const passTokenEl = document.getElementById('passTokenText');
  const passPatientEl = document.getElementById('passPatientName');
  const passUHIDEl = document.getElementById('passUHID');

  if (passTokenEl) passTokenEl.textContent = `#${generatedToken}`;
  if (passPatientEl) passPatientEl.textContent = `${name} (${ageGen})`;
  if (passUHIDEl) passUHIDEl.textContent = abha;

  // Insert into live queue grid
  let targetColumn = 'greenQueueList';
  let esiClass = 'card-green';
  let esiTier = 'green';

  if (triage.includes('ESI 2') || triage.includes('ESI 1')) {
    targetColumn = 'redQueueList';
    esiClass = 'card-red';
    esiTier = 'red';
  } else if (triage.includes('ESI 3')) {
    targetColumn = 'yellowQueueList';
    esiClass = 'card-yellow';
    esiTier = 'yellow';
  } else if (triage.includes('ESI 5')) {
    targetColumn = 'blueQueueList';
    esiClass = 'card-blue';
    esiTier = 'blue';
  }

  const colContainer = document.getElementById(targetColumn);
  if (colContainer) {
    const newCard = document.createElement('div');
    newCard.className = `queue-patient-card ${esiClass}`;
    newCard.setAttribute('data-esi', esiTier);
    newCard.onclick = () => previewPatient(abha, name, generatedToken, triage);
    newCard.innerHTML = `
      <div class="card-top-row">
        <span class="card-token-id">#${generatedToken}</span>
        <span class="card-wait-badge wait-low">Just Booked</span>
      </div>
      <div class="card-patient-name">${name} (${ageGen})</div>
      <div class="card-complaint">${complaint}</div>
      <div class="card-footer-row">
        <span class="card-dept">Room 104</span>
        <button class="btn-call-inline" onclick="event.stopPropagation(); callSpecificToken('${generatedToken}', '${name}', '${triage}')">Call In</button>
      </div>
    `;
    colContainer.prepend(newCard);
  }

  // Update counters
  const totalEl = document.getElementById('tickerTotalWait');
  if (totalEl) totalEl.textContent = `${tokenCounter - 30} Patients`;

  showToast(`🎟️ In-Person Token #${generatedToken} generated for ${name}. SMS sent to ${mobile}`);
}

// Room Selector Switcher
function switchOPDRoom(roomId) {
  const data = roomQueueData[roomId];
  if (!data) return;

  consultSecondsElapsed = 120 + Math.floor(Math.random() * 200);

  document.getElementById('currentActiveToken').textContent = data.activeToken;
  document.getElementById('currentPatientName').textContent = data.patientName;
  document.getElementById('currentRoomLabel').textContent = data.roomLabel;
  if (document.getElementById('currentComplaint')) {
    document.getElementById('currentComplaint').textContent = data.complaint;
  }
  
  const pill = document.getElementById('currentTriagePill');
  if (pill) {
    pill.textContent = data.triage;
    pill.className = `triage-pill ${data.triageClass}`;
  }

  if (document.getElementById('redCount')) document.getElementById('redCount').textContent = data.redCount;
  if (document.getElementById('yellowCount')) document.getElementById('yellowCount').textContent = data.yellowCount;
  if (document.getElementById('greenCount')) document.getElementById('greenCount').textContent = data.greenCount;
  if (document.getElementById('blueCount')) document.getElementById('blueCount').textContent = data.blueCount;
  
  const total = data.redCount + data.yellowCount + data.greenCount + data.blueCount;
  const badge = document.getElementById('liveQueueCountBadge');
  if (badge) badge.textContent = total;
  if (document.getElementById('tickerTotalWait')) document.getElementById('tickerTotalWait').textContent = `${total} Patients`;

  showToast(`Switched view to ${data.doctor}`);
}

// Call Next Patient
function callNextPatient() {
  const nextPool = [
    { tok: 'A-043', name: 'Kavita Jadhav (28 F)', triage: 'ESI 3 - Urgent', cls: 'triage-yellow', complaint: 'High Grade Fever (103°F) + Vomiting & Dehydration' },
    { tok: 'A-044', name: 'Deepak More (44 M)', triage: 'ESI 3 - Urgent', cls: 'triage-yellow', complaint: 'Severe Colic Pain • Post Ultrasound Review' },
    { tok: 'A-045', name: 'Vikas Deshmukh (36 M)', triage: 'ESI 4 - Standard', cls: 'triage-green', complaint: 'Routine Blood Pressure Monitoring • HTN' },
    { tok: 'A-046', name: 'Pooja Salve (24 F)', triage: 'ESI 4 - Standard', cls: 'triage-green', complaint: 'Mild Upper Respiratory Infection / Cough' }
  ];
  
  const randomIdx = Math.floor(Math.random() * nextPool.length);
  const nextP = nextPool[randomIdx];

  consultSecondsElapsed = 0;
  if (document.getElementById('currentActiveToken')) document.getElementById('currentActiveToken').textContent = nextP.tok;
  if (document.getElementById('currentPatientName')) document.getElementById('currentPatientName').textContent = nextP.name;
  if (document.getElementById('currentComplaint')) document.getElementById('currentComplaint').textContent = nextP.complaint;
  
  const pill = document.getElementById('currentTriagePill');
  if (pill) {
    pill.textContent = nextP.triage;
    pill.className = `triage-pill ${nextP.cls}`;
  }

  triggerVoiceAnnouncement(nextP.tok, nextP.name, "Room 104");
}

// Call Specific Token from Card
function callSpecificToken(token, name, esiLevel) {
  consultSecondsElapsed = 0;
  document.getElementById('currentActiveToken').textContent = token;
  document.getElementById('currentPatientName').textContent = name;
  
  triggerVoiceAnnouncement(token, name, "Room 104");
  showToast(`Calling Token #${token} (${name}) to Room 104 [${esiLevel}]`);
}

// Voice / Audio Speech Announcement (Marathi & English)
function triggerVoiceAnnouncement(token, name, room) {
  const firstName = name.split(' ')[0];
  const marathiText = `कृपया टोकन क्रमांक ${token}, ${firstName}, ${room} मध्ये यावे.`;
  const engText = `Token number ${token}, ${name}, please proceed to ${room}.`;
  
  const banner = document.getElementById('audioAnnouncementBanner');
  const bannerText = document.getElementById('announcementText');
  
  if (bannerText) {
    bannerText.innerHTML = `<strong>मराठी:</strong> "${marathiText}"<br><strong>English:</strong> "${engText}"`;
  }
  if (banner) banner.style.display = 'flex';

  // Browser SpeechSynthesis API if available
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Token ${token}. ${firstName}. Please proceed to ${room}.`);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  setTimeout(() => {
    if (banner) banner.style.display = 'none';
  }, 6000);
}

// Recall Current Patient
function recallCurrentPatient() {
  const token = document.getElementById('currentActiveToken').textContent;
  const name = document.getElementById('currentPatientName').textContent;
  triggerVoiceAnnouncement(token, name, "Room 104");
  showToast(`Re-announcing Token #${token}`);
}

// Complete and Call Next
function completeAndNext() {
  const token = document.getElementById('currentActiveToken').textContent;
  showToast(`Token #${token} consultation marked COMPLETE. Interoperable FHIR Encounter saved.`);
  setTimeout(() => {
    callNextPatient();
  }, 1000);
}

// Reroute to Lab
function reroutePatient(dept) {
  const token = document.getElementById('currentActiveToken').textContent;
  showToast(`Token #${token} re-routed to ${dept} with priority requisition.`);
}

// ============================================================================
// DRAG & DROP TRIAGE QUEUE HANDLERS
// ============================================================================

let draggedCard = null;

function handleQueueDragStart(e) {
  draggedCard = e.currentTarget;
  e.dataTransfer.setData('text/plain', draggedCard.id);
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    if (draggedCard) draggedCard.classList.add('dragging');
  }, 0);
}

function handleQueueDragEnd(e) {
  if (draggedCard) {
    draggedCard.classList.remove('dragging');
    draggedCard = null;
  }
  document.querySelectorAll('.queue-column, .queue-card-list').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleQueueDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.currentTarget.closest('.queue-column');
  if (col) {
    const list = col.querySelector('.queue-card-list');
    if (list) list.classList.add('drag-over');
  }
}

function handleQueueDragLeave(e) {
  const col = e.currentTarget.closest('.queue-column');
  if (col) {
    const list = col.querySelector('.queue-card-list');
    if (list) list.classList.remove('drag-over');
  }
}

function handleQueueDrop(e, targetTier) {
  e.preventDefault();
  const col = e.currentTarget.closest('.queue-column');
  const list = col ? col.querySelector('.queue-card-list') : null;
  if (!list || !draggedCard) return;

  list.classList.remove('drag-over');
  
  const fromTier = draggedCard.getAttribute('data-esi') || 'unknown';
  
  // Append card to new list
  list.appendChild(draggedCard);
  draggedCard.setAttribute('data-esi', targetTier);
  draggedCard.classList.remove('card-red', 'card-yellow', 'card-green', 'card-blue');
  draggedCard.classList.add(`card-${targetTier}`);

  // Update card wait badge & footer button based on destination tier
  const waitBadge = draggedCard.querySelector('.card-wait-badge');
  const deptLabel = draggedCard.querySelector('.card-dept');
  const actionBtn = draggedCard.querySelector('.btn-call-inline');
  const token = draggedCard.querySelector('.card-token-id')?.textContent || '';
  const patientName = draggedCard.querySelector('.card-patient-name')?.textContent || '';

  const tierMeta = {
    red: { name: 'Emergency Critical', badgeCls: 'wait-high', dept: 'EMERGENCY BAY 1', btnText: 'Call Now', esiLvl: 'ESI-1 / Critical' },
    yellow: { name: 'Urgent Priority', badgeCls: 'wait-med', dept: 'ROOM 104', btnText: 'Call In', esiLvl: 'ESI-3 / Urgent' },
    green: { name: 'General Checkup', badgeCls: 'wait-low', dept: 'ROOM 104', btnText: 'Call In', esiLvl: 'ESI-4 / Standard' },
    blue: { name: 'Quick Refill & Lab', badgeCls: 'wait-fast', dept: 'DISPENSARY 02', btnText: 'Dispense', esiLvl: 'ESI-5 / Non-Urgent' }
  };

  const meta = tierMeta[targetTier] || tierMeta.green;

  if (waitBadge) {
    waitBadge.className = `card-wait-badge ${meta.badgeCls}`;
  }
  if (deptLabel && !draggedCard.classList.contains('active-focus')) {
    deptLabel.textContent = meta.dept;
  }
  if (actionBtn) {
    actionBtn.textContent = meta.btnText;
  }

  // Visual pulse animation
  draggedCard.classList.add('drop-pulse');
  setTimeout(() => {
    draggedCard?.classList.remove('drop-pulse');
  }, 450);

  // Update count badges
  updateQueueCounts();

  if (fromTier !== targetTier) {
    showToast(`✓ Moved Token ${token} (${patientName}) to ${meta.name} [${meta.esiLvl}]`);
  }
}

function updateQueueCounts() {
  const redCount = document.querySelectorAll('#redQueueList .queue-patient-card').length;
  const yellowCount = document.querySelectorAll('#yellowQueueList .queue-patient-card').length;
  const greenCount = document.querySelectorAll('#greenQueueList .queue-patient-card').length;
  const blueCount = document.querySelectorAll('#blueQueueList .queue-patient-card').length;
  const total = redCount + yellowCount + greenCount + blueCount;

  const elRed = document.getElementById('redCount');
  const elYellow = document.getElementById('yellowCount');
  const elGreen = document.getElementById('greenCount');
  const elBlue = document.getElementById('blueCount');

  if (elRed) elRed.textContent = redCount;
  if (elYellow) elYellow.textContent = yellowCount;
  if (elGreen) elGreen.textContent = greenCount;
  if (elBlue) elBlue.textContent = blueCount;

  // Update filter buttons
  const chips = document.querySelectorAll('.filter-chips-wrap .filter-chip-btn');
  if (chips.length >= 5) {
    chips[0].textContent = `All Waiting (${total})`;
    chips[1].textContent = `🔴 Emergency (${redCount})`;
    chips[2].textContent = `🟡 Urgent (${yellowCount})`;
    chips[3].textContent = `🟢 General (${greenCount})`;
    chips[4].textContent = `🔵 Refills (${blueCount})`;
  }
}

// Filter Queue By ESI Level
function filterQueueByESI(tier, btnEl) {
  document.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  const cols = document.querySelectorAll('.queue-column');
  cols.forEach(col => {
    if (tier === 'all' || col.getAttribute('data-tier') === tier) {
      col.style.display = 'flex';
    } else {
      col.style.display = 'none';
    }
  });
}

// Search Queue Patients
function searchQueuePatients(query) {
  const q = query.trim().toLowerCase();
  const cards = document.querySelectorAll('.queue-patient-card');
  
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (!q || text.includes(q)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Quick Scenario Presets for Triage
const triagePresets = {
  preeclampsia: {
    uhid: "MH-2026-009124",
    name: "Lata Thorat, 39 F",
    hr: 118,
    spo2: 91,
    bp: "158/96",
    temp: 101.4,
    pain: "8",
    flag: "anc-high-risk",
    symptoms: "Severe headache, blurred vision, pedal edema, BP 158/96 at 32 weeks gestation. Suspected Pre-eclampsia."
  },
  hypoxia: {
    uhid: "MH-2026-009941",
    name: "Babanrao Shirole, 68 M",
    hr: 124,
    spo2: 83,
    bp: "140/92",
    temp: 99.2,
    pain: "5",
    flag: "no",
    symptoms: "SpO2 83% on room air, severe shortness of breath, bilateral lung crepitations. Acute Hypoxia."
  },
  fever: {
    uhid: "MH-2026-004312",
    name: "Kavita Jadhav, 28 F",
    hr: 104,
    spo2: 97,
    bp: "118/76",
    temp: 103.2,
    pain: "5",
    flag: "no",
    symptoms: "High grade fever 103.2°F since 2 days, chills, persistent vomiting, mild dehydration."
  },
  routine: {
    uhid: "MH-2026-004351",
    name: "Vikas Deshmukh, 36 M",
    hr: 74,
    spo2: 99,
    bp: "128/82",
    temp: 98.6,
    pain: "2",
    flag: "no",
    symptoms: "Routine hypertension and blood sugar follow-up review. No acute complaints."
  }
};

function loadTriagePreset(key) {
  const p = triagePresets[key];
  if (!p) return;

  if (document.getElementById('triageUHID')) document.getElementById('triageUHID').value = p.uhid;
  if (document.getElementById('triageName')) document.getElementById('triageName').value = p.name;
  if (document.getElementById('triageHR')) document.getElementById('triageHR').value = p.hr;
  if (document.getElementById('triageSpO2')) document.getElementById('triageSpO2').value = p.spo2;
  if (document.getElementById('triageBP')) document.getElementById('triageBP').value = p.bp;

  liveUpdateTriagePreview();
  showToast(`Loaded Clinical Scenario: ${p.name}`);
}

// Live Triage Predictor / Score Calculator
function liveUpdateTriagePreview() {
  const hr = parseInt(document.getElementById('triageHR')?.value) || 80;
  const spo2 = parseInt(document.getElementById('triageSpO2')?.value) || 98;
  const bpStr = document.getElementById('triageBP')?.value || "120/80";

  const sysBP = parseInt(bpStr.split('/')[0]) || 120;
  const diaBP = parseInt(bpStr.split('/')[1]) || 80;

  let scoreLabel = "ESI Level 4 (Standard Routine)";
  let color = "#15803d";
  let rationale = [];
  let suggestedBay = "Room 104 (Internal Med)";

  // ESI Level 1 Criteria
  if (spo2 < 85 || hr > 150 || hr < 40) {
    scoreLabel = "ESI Level 1 (Resuscitation / Immediate)";
    color = "#b91c1c";
    rationale.push(`• Critical vital alert: SpO2 ${spo2}% / HR ${hr} BPM`);
    suggestedBay = "Crash Resuscitation Bay 1";
  }
  // ESI Level 2 Criteria
  else if (spo2 <= 92 || sysBP >= 160 || diaBP >= 100) {
    scoreLabel = "ESI Level 2 (Emergent / High Priority)";
    color = "#c2410c";
    if (sysBP >= 140 || diaBP >= 90) {
      rationale.push("• Severe Pre-eclampsia in ANC (BP > 140/90)");
      suggestedBay = "OB-GYN Emergency Bay";
    }
    if (spo2 <= 92) rationale.push(`• Hypoxia alert: SpO2 ${spo2}% (&le; 92%)`);
  }
  // ESI Level 3 Criteria
  else if (hr >= 105) {
    scoreLabel = "ESI Level 3 (Urgent / Multi-Resource)";
    color = "#b45309";
    rationale.push(`• Mild tachycardia (${hr} BPM)`);
    suggestedBay = "Room 104 (Internal Med)";
  }

  if (rationale.length === 0) {
    rationale.push("• Stable physiological vitals within normal adult thresholds");
  }

  const labelEl = document.getElementById('predScoreLabel');
  if (labelEl) {
    labelEl.textContent = scoreLabel;
    labelEl.style.color = color;
  }
  
  const ratEl = document.getElementById('predRationale');
  if (ratEl) ratEl.innerHTML = rationale.join('<br>');
  
  const routeBadge = document.querySelector('.pred-route-badge');
  if (routeBadge) routeBadge.textContent = `Bay: ${suggestedBay}`;
}

// Calculate & Submit Triage Form
function calculateTriageScore() {
  const uhid = document.getElementById('triageUHID')?.value || 'MH-2026-009124';
  const name = document.getElementById('triageName')?.value || 'Patient';
  tokenCounter++;
  const token = `A-${String(tokenCounter).padStart(3, '0')}`;
  
  showToast(`Success! Patient ${name} (${uhid}) triaged and enqueued with Token #${token}`);
  
  setTimeout(() => {
    switchProfile('queue-manager');
    switchQueueTab('tab-live-board');
  }, 1000);
}

// Preview Patient Boarding Pass
function previewPatient(uhid, name, token, esi) {
  switchQueueTab('tab-patient-stub');
  if (document.getElementById('passTokenText')) document.getElementById('passTokenText').textContent = '#' + token;
  if (document.getElementById('passPatientName')) document.getElementById('passPatientName').textContent = name;
  if (document.getElementById('passUHID')) document.getElementById('passUHID').textContent = uhid;
  showToast(`Viewing boarding pass for #${token} (${name})`);
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
        showToast('Viewing Hospital Workstation');
      } else {
        showScreen('screenLogin');
        if (lblToggle) lblToggle.textContent = 'Back to App';
        showToast('Viewing Staff Sign-In Screen');
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
function loginAsNurse() {
  showScreen('screenMainApp');
  const lblToggle = document.getElementById('lblLoginToggle');
  if (lblToggle) lblToggle.textContent = 'View Login Screen';
  showToast('Logged in as Suresh Shinde (Registration Desk Lead)');
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
