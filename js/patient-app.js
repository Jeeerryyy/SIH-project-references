/**
 * ==========================================================================
 * Arogya Mitra - Patient Health Application Controller
 * Emergency SOS System, Simplified Navigation & Plain Language Logic
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initDeviceModeSwitcher();
  initNavigationTabs();
  initRecordsScreenLogic();
  initBottomSheets();
  initSymptomChips();
  initCaseProgressEngine();
  initLanguageSelector();
  initModals();
  initScannerSimulation();
  initToastSystem();
  initLoginScreenToggle();
});

/* ==========================================================================
   1. DEVICE MODE SWITCHER (Desktop vs Mobile Simulator)
   ========================================================================== */
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

/* ==========================================================================
   2. LOGIN SCREEN TOGGLER & QUICK LOGIN
   ========================================================================== */
function initLoginScreenToggle() {
  const btnToggleLogin = document.getElementById('btnToggleLoginScreen');
  const btnQuickDemoLogin = document.getElementById('btnQuickDemoLogin');
  const lblToggle = document.getElementById('lblLoginToggle');

  if (btnToggleLogin) {
    btnToggleLogin.addEventListener('click', () => {
      const loginScreen = document.getElementById('screenLogin');
      const isLoginActive = loginScreen && loginScreen.style.display !== 'none';

      if (isLoginActive) {
        showScreen('screenHome');
        if (lblToggle) lblToggle.textContent = 'View Login Screen';
        showToast('Viewing Logged-in Citizen Dashboard');
      } else {
        showScreen('screenLogin');
        if (lblToggle) lblToggle.textContent = 'Back to Dashboard';
        showToast('Viewing Citizen Sign-In Screen (with 1-Tap SOS)');
      }
    });
  }

  if (btnQuickDemoLogin) {
    btnQuickDemoLogin.addEventListener('click', () => {
      showScreen('screenHome');
      if (lblToggle) lblToggle.textContent = 'View Login Screen';
      showToast('Logged in successfully as Parth Ranka (parthracka16@abdm)');
    });
  }
}

/* ==========================================================================
   3. SCREEN ROUTING & BOTTOM NAVIGATION
   ========================================================================== */
function showScreen(screenId) {
  const screens = document.querySelectorAll('.app-view-screen');
  const navTabs = document.querySelectorAll('.bottom-nav-tab');
  const deviceFrame = document.getElementById('phoneDeviceFrame');
  const navBar = document.querySelector('.curved-bottom-nav-bar');

  screens.forEach(screen => {
    screen.style.display = 'none';
    screen.classList.remove('active');
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.style.display = 'block';
    target.classList.add('active');
  }

  // Handle Login mode / Video Call mode vs App mode navigation visibility
  if (screenId === 'screenLogin' || screenId === 'screenVideoCall') {
    if (deviceFrame) deviceFrame.classList.add('in-login-mode');
    if (navBar) navBar.style.display = 'none';
  } else {
    if (deviceFrame) deviceFrame.classList.remove('in-login-mode');
    if (navBar) navBar.style.display = '';
  }

  // Update corresponding tab active state if matched
  navTabs.forEach(tab => {
    if (tab.getAttribute('data-screen') === screenId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Scroll device body to top
  const scrollBody = document.querySelector('.app-screen-scroll-body');
  if (scrollBody) scrollBody.scrollTop = 0;
}

function navigateToPatientSection(sectionId) {
  showScreen('screenHome');

  // Update active state on single sidebar tabs
  document.querySelectorAll('.bottom-nav-tab').forEach(b => b.classList.remove('active'));
  if (sectionId === 'secGovServices') {
    const b = document.getElementById('tabNavGovServices');
    if (b) b.classList.add('active');
  } else if (sectionId === 'secGovSchemes') {
    const b = document.getElementById('tabNavGovSchemes');
    if (b) b.classList.add('active');
  } else {
    const b = document.getElementById('tabNavHome');
    if (b) b.classList.add('active');
  }

  setTimeout(() => {
    const targetEl = document.getElementById(sectionId);
    const scrollContainer = document.querySelector('.app-screen-scroll-body');
    if (targetEl && scrollContainer) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetEl.classList.add('ring-2', 'ring-emerald-400', 'rounded-2xl', 'transition-all');
      setTimeout(() => targetEl.classList.remove('ring-2', 'ring-emerald-400'), 1500);
    }
  }, 50);
}

function initNavigationTabs() {
  const navTabs = document.querySelectorAll('.bottom-nav-tab');
  const qrPod = document.getElementById('floatingQrPod');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetScreenId = tab.getAttribute('data-screen');
      if (targetScreenId) showScreen(targetScreenId);
    });
  });

  if (qrPod) {
    qrPod.addEventListener('click', () => {
      showScreen('screenScanner');
    });
  }

  // Back buttons inside sub-screens
  document.querySelectorAll('.app-sub-screen-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen('screenHome');
    });
  });

  // Quick Action Buttons router
  document.querySelectorAll('[data-route]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const routeId = btn.getAttribute('data-route');
      if (routeId) showScreen(routeId);
    });
  });
}

/* ==========================================================================
   4. 🚨 EMERGENCY SOS (108) COUNTDOWN & SIREN SYNTHESIZER
   ========================================================================== */
let sosCountdownVal = 5;
let sosTimerInterval = null;
let audioCtx = null;
let sirenOsc = null;
let sirenGain = null;

function playSirenSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    audioCtx = new AudioContext();
    sirenOsc = audioCtx.createOscillator();
    sirenGain = audioCtx.createGain();

    sirenOsc.type = 'sawtooth';
    const now = audioCtx.currentTime;
    sirenOsc.frequency.setValueAtTime(650, now);

    // Oscillate frequency like an emergency medical siren
    for (let i = 0; i < 12; i++) {
      sirenOsc.frequency.exponentialRampToValueAtTime(1150, now + i * 0.45);
      sirenOsc.frequency.exponentialRampToValueAtTime(650, now + (i + 0.5) * 0.45);
    }

    sirenGain.gain.setValueAtTime(0.2, now);
    sirenOsc.connect(sirenGain);
    sirenGain.connect(audioCtx.destination);
    sirenOsc.start();
  } catch (e) {
    console.log('AudioContext not allowed without explicit user gesture', e);
  }
}

function stopSirenSound() {
  if (sirenOsc) {
    try {
      sirenOsc.stop();
      sirenOsc.disconnect();
    } catch (e) {}
    sirenOsc = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {}
    audioCtx = null;
  }
}

function triggerSosCountdown() {
  sosCountdownVal = 5;
  const modal = document.getElementById('modalEmergencySos');
  const countEl = document.getElementById('sosCountdownNumber');
  
  if (modal) modal.classList.add('active');
  if (countEl) countEl.textContent = sosCountdownVal;

  playSirenSound();

  if (sosTimerInterval) clearInterval(sosTimerInterval);

  sosTimerInterval = setInterval(() => {
    sosCountdownVal--;
    if (countEl) countEl.textContent = sosCountdownVal;

    if (sosCountdownVal <= 0) {
      clearInterval(sosTimerInterval);
      stopSirenSound();
      launchEmergencyDispatch();
    }
  }, 1000);
}

function cancelEmergencySos() {
  if (sosTimerInterval) clearInterval(sosTimerInterval);
  stopSirenSound();
  const modal = document.getElementById('modalEmergencySos');
  if (modal) modal.classList.remove('active');
  showToast('Emergency SOS Cancelled. You are safe.');
}

function launchEmergencyDispatch() {
  if (sosTimerInterval) clearInterval(sosTimerInterval);
  stopSirenSound();
  const modal = document.getElementById('modalEmergencySos');
  if (modal) modal.classList.remove('active');

  // Transition to Live Active Emergency Tracking Screen
  showScreen('screenActiveSosTracking');
  showToast('🚨 108 Emergency Ambulance Dispatched from District Hospital Nashik!');
}

function resolveEmergencySos() {
  showScreen('screenHome');
  showToast('✓ Emergency resolved. Patient handed over to medical care.');
}

/* ==========================================================================
   5. MY RECORDS SCREEN CONTROLLER & POLISHED FILTER PILLS
   ========================================================================== */
function initRecordsScreenLogic() {
  const segmentBtns = document.querySelectorAll('.segmented-pill-btn[data-record-segment]');
  const filterPills = document.querySelectorAll('.record-filter-pill');
  const recordItems = document.querySelectorAll('#recordsPopulatedListView [data-record-type]');
  const emptyView = document.getElementById('recordsEmptyStateView');
  const populatedView = document.getElementById('recordsPopulatedListView');
  const searchInput = document.getElementById('inputSearchRecords');
  const toggleDemoBtn = document.getElementById('btnToggleRecordsDemoState');
  const filterFunnelBtn = document.getElementById('btnToggleRecordCategoryPills');
  const categoryFilterRow = document.getElementById('recordsCategoryFilterRow');

  let activeSegment = 'all';
  let activeFilter = 'all';
  let isDemoEmpty = false;

  // Toggle Category Filters Visibility
  if (filterFunnelBtn && categoryFilterRow) {
    filterFunnelBtn.addEventListener('click', () => {
      const isHidden = categoryFilterRow.style.display === 'none';
      categoryFilterRow.style.display = isHidden ? 'flex' : 'none';
      showToast(isHidden ? 'Category filters shown' : 'Category filters hidden');
    });
  }

  // Toggle between Empty and Populated view for demo testing
  if (toggleDemoBtn) {
    toggleDemoBtn.addEventListener('click', () => {
      isDemoEmpty = !isDemoEmpty;
      if (emptyView && populatedView) {
        emptyView.style.display = isDemoEmpty ? 'flex' : 'none';
        populatedView.style.display = isDemoEmpty ? 'none' : 'block';
      }
      showToast(isDemoEmpty ? 'Showing Empty State View' : 'Showing Synced Records View');
    });
  }

  // Segment Buttons (All / Uploaded / Linked)
  segmentBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      segmentBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSegment = btn.getAttribute('data-record-segment');
      applyRecordsFilter();
    });
  });

  // Category Filter Pills
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.getAttribute('data-filter');
      applyRecordsFilter();
    });
  });

  // Search input filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      recordItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        const matchesQuery = !query || text.includes(query);
        const matchesCategory = activeFilter === 'all' || item.getAttribute('data-record-type') === activeFilter;
        item.style.display = (matchesQuery && matchesCategory) ? 'block' : 'none';
      });
    });
  }

  function applyRecordsFilter() {
    let visibleCount = 0;
    recordItems.forEach(item => {
      const type = item.getAttribute('data-record-type');
      const matchesCategory = activeFilter === 'all' || type === activeFilter;
      const matchesSegment = activeSegment === 'all' || 
                             (activeSegment === 'uploaded' && type === 'prescription') ||
                             (activeSegment === 'linked' && type !== 'prescription');

      if (matchesCategory && matchesSegment && !isDemoEmpty) {
        item.style.display = 'block';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (emptyView && populatedView) {
      if (visibleCount === 0 && !isDemoEmpty) {
        emptyView.style.display = 'flex';
      } else if (!isDemoEmpty) {
        emptyView.style.display = 'none';
        populatedView.style.display = 'block';
      }
    }
  }
}

/* ==========================================================================
   6. BOTTOM SHEETS CONTROLLER
   ========================================================================== */
function initBottomSheets() {
  const overlay = document.getElementById('appBottomSheetOverlay');
  const triggerBtns = document.querySelectorAll('[data-sheet-target]');
  const closeBtns = document.querySelectorAll('.close-bottom-sheet-btn');

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetSheetId = btn.getAttribute('data-sheet-target');
      openBottomSheet(targetSheetId);
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      closeBottomSheet();
    });
  });

  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeBottomSheet();
      }
    });
  }

  window.openBottomSheet = function(sheetId) {
    if (!overlay) return;
    overlay.querySelectorAll('.bottom-sheet-dialog-card').forEach(s => s.style.display = 'none');
    const targetSheet = document.getElementById(sheetId);
    if (targetSheet) {
      targetSheet.style.display = 'block';
      overlay.classList.add('active');
    }
  };

  window.closeBottomSheet = function() {
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      overlay.querySelectorAll('.bottom-sheet-dialog-card').forEach(s => s.style.display = 'none');
    }, 250);
  };
}

/* ==========================================================================
   7. CHIEF COMPLAINTS SYMPTOM CHIPS CONTROLLER
   ========================================================================== */
function initSymptomChips() {
  const chips = document.querySelectorAll('.symptom-tag-chip:not(.border-dashed)');
  const addBtn = document.getElementById('btnAddCustomSymptom');
  const inputSymptom = document.getElementById('inputCustomSymptom');
  const saveBtn = document.getElementById('btnSaveChiefComplaints');
  const selectedContainer = document.getElementById('selectedSymptomsTagsContainer');

  let selectedSymptoms = [];

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('selected');
      const text = chip.textContent.trim();
      if (chip.classList.contains('selected')) {
        if (!selectedSymptoms.includes(text)) selectedSymptoms.push(text);
      } else {
        selectedSymptoms = selectedSymptoms.filter(s => s !== text);
      }
    });
  });

  if (addBtn && inputSymptom) {
    addBtn.addEventListener('click', () => {
      const val = inputSymptom.value.trim();
      if (val && !selectedSymptoms.includes(val)) {
        selectedSymptoms.push(val);
        inputSymptom.value = '';
        showToast(`Added: ${val}`);
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (selectedContainer) {
        if (selectedSymptoms.length > 0) {
          selectedContainer.innerHTML = selectedSymptoms
            .map(s => `<span class="inline-block bg-blue-100 text-blue-900 font-bold text-[11px] px-2.5 py-0.5 rounded-full mr-1 mb-1">${s}</span>`)
            .join('');
        } else {
          selectedContainer.innerHTML = `<span class="text-xs text-slate-400 italic">No symptoms selected</span>`;
        }
      }
      closeBottomSheet();
      updateCaseProgressScore();
      showToast('Symptoms Saved');
    });
  }
}

/* ==========================================================================
   8. CASE COMPLETION SCORE ENGINE
   ========================================================================== */
function initCaseProgressEngine() {
  window.updateCaseProgressScore = function() {
    const scoreText = document.getElementById('caseCompletionScoreText');
    const scoreFill = document.getElementById('caseCompletionScoreFill');
    if (!scoreText || !scoreFill) return;

    let score = 10;
    const symptomsContainer = document.getElementById('selectedSymptomsTagsContainer');
    if (symptomsContainer && symptomsContainer.querySelectorAll('span.bg-blue-100').length > 0) {
      score += 25;
    }
    const queryVal = document.getElementById('inputCaseQuery')?.value.trim();
    if (queryVal && queryVal.length > 3) {
      score += 25;
    }

    scoreText.textContent = `${score}.0%`;
    scoreFill.style.width = `${score}%`;
  };

  const queryInput = document.getElementById('inputCaseQuery');
  if (queryInput) {
    queryInput.addEventListener('input', updateCaseProgressScore);
  }

  const submitCaseBtn = document.getElementById('btnSubmitCaseConsultation');
  if (submitCaseBtn) {
    submitCaseBtn.addEventListener('click', () => {
      showToast('Appointment Confirmed! Doctor video link sent via SMS.');
      setTimeout(() => {
        showScreen('screenHome');
      }, 1200);
    });
  }
}

/* ==========================================================================
   9. 13-LANGUAGE SELECTOR MODAL
   ========================================================================== */
function initLanguageSelector() {
  const modal = document.getElementById('modalLanguageSelector');
  const openBtns = [document.getElementById('btnOpenLanguageModal'), document.getElementById('btnSettingsLanguage')];
  const applyBtn = document.getElementById('btnApplyLanguage');
  const langTiles = document.querySelectorAll('.lang-selector-tile');

  openBtns.forEach(b => {
    if (b) b.addEventListener('click', () => modal?.classList.add('active'));
  });

  langTiles.forEach(tile => {
    tile.addEventListener('click', () => {
      langTiles.forEach(t => t.classList.remove('selected'));
      tile.classList.add('selected');
      const langName = tile.querySelector('.lang-name-text')?.textContent || 'English';
      showToast(`Selected Language: ${langName}`);
    });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      modal?.classList.remove('active');
      showToast('Language settings updated across app.');
    });
  }
}

/* ==========================================================================
   10. MODALS & SCANNER CONTROLLER
   ========================================================================== */
function initModals() {
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.app-modal-overlay')?.classList.remove('active');
    });
  });

  const btnOpenSwitch = document.getElementById('btnOpenSwitchAccountModal');
  const btnProfileSwitch = document.getElementById('btnProfileSwitchAccount');
  const modalSwitch = document.getElementById('modalSwitchAccount');

  [btnOpenSwitch, btnProfileSwitch].forEach(b => {
    if (b) b.addEventListener('click', () => modalSwitch?.classList.add('active'));
  });

  // Copy ABHA ID helpers
  const btnCopyAbha = document.getElementById('btnCopyAbhaId');
  const btnCopyAddress = document.getElementById('btnCopyAbhaAddress');
  if (btnCopyAbha) {
    btnCopyAbha.addEventListener('click', () => showToast('ABHA Number copied: 91-2182-2174-6884'));
  }
  if (btnCopyAddress) {
    btnCopyAddress.addEventListener('click', () => showToast('ABHA Address copied: parthracka16@abdm'));
  }
}

function initScannerSimulation() {
  const flashBtn = document.getElementById('btnScannerFlash');
  const simulateScanBtn = document.getElementById('btnSimulateHospitalScan');
  let flashOn = false;

  if (flashBtn) {
    flashBtn.addEventListener('click', () => {
      flashOn = !flashOn;
      flashBtn.classList.toggle('active', flashOn);
      flashBtn.style.color = flashOn ? '#f59e0b' : '#334155';
      showToast(flashOn ? 'Flashlight Enabled' : 'Flashlight Disabled');
    });
  }

  if (simulateScanBtn) {
    simulateScanBtn.addEventListener('click', () => {
      showToast('Scanning Hospital ABDM Counter QR...');
      setTimeout(() => {
        const tokenModal = document.getElementById('modalScanShareToken');
        if (tokenModal) tokenModal.classList.add('active');
        showToast('Hospital OPD Fast Token Generated: #OPD-DH-042');
      }, 800);
    });
  }
}

/* ==========================================================================
   11. GLOBAL TOAST NOTIFICATION SYSTEM
   ========================================================================== */
function initToastSystem() {
  if (document.getElementById('patientAppToastContainer')) return;
  const container = document.createElement('div');
  container.id = 'patientAppToastContainer';
  container.style.position = 'fixed';
  container.style.bottom = '24px';
  container.style.right = '24px';
  container.style.zIndex = '99999';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '8px';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);
}

function showToast(message) {
  const container = document.getElementById('patientAppToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.style.background = '#0d1b2a';
  toast.style.color = '#ffffff';
  toast.style.padding = '10px 18px';
  toast.style.borderRadius = '9999px';
  toast.style.fontSize = '12px';
  toast.style.fontWeight = '600';
  toast.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.3)';
  toast.style.display = 'inline-flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '8px';
  toast.style.border = '1px solid rgba(255,255,255,0.2)';
  toast.style.animation = 'fadeIn 0.2s ease-out';
  toast.style.pointerEvents = 'auto';

  toast.innerHTML = `<span class="text-emerald-400">✓</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

/* ==========================================================================
   12. DOCTOR APPOINTMENT BOOKING & QUEUE TICKET CONTROLLER
   ========================================================================== */
let currentAppointmentMode = 'inperson';
let selectedAppointmentDate = 'Today, 11 Sep';
let selectedAppointmentSlot = '10:30 AM - 11:00 AM';

function openAppointmentBooking(mode = 'inperson') {
  switchAppointmentMode(mode);
  showScreen('screenBookAppointment');
}

function switchAppointmentMode(mode) {
  currentAppointmentMode = mode;
  const tabInPerson = document.getElementById('btnTabInPerson');
  const tabVirtual = document.getElementById('btnTabVirtual');
  const secInPerson = document.getElementById('bookingSectionInPerson');
  const secVirtual = document.getElementById('bookingSectionVirtual');
  const submitBtnText = document.getElementById('btnSubmitAppointmentText');

  if (!tabInPerson || !tabVirtual) return;

  if (mode === 'inperson') {
    tabInPerson.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm bg-white text-blue-700';
    tabVirtual.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition text-slate-600 hover:text-slate-900';
    if (secInPerson) secInPerson.style.display = 'block';
    if (secVirtual) secVirtual.style.display = 'none';
    if (submitBtnText) submitBtnText.innerText = 'Confirm Booking & Generate Live Queue Token';
  } else {
    tabVirtual.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm bg-white text-emerald-700';
    tabInPerson.className = 'flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition text-slate-600 hover:text-slate-900';
    if (secInPerson) secInPerson.style.display = 'none';
    if (secVirtual) secVirtual.style.display = 'block';
    if (submitBtnText) submitBtnText.innerText = 'Confirm & Join Video Teleconsult Queue';
  }
}

function selectAppointmentDate(btn, dateStr) {
  document.querySelectorAll('.appointment-date-pill').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  selectedAppointmentDate = dateStr;
}

function selectAppointmentSlot(btn, slotStr) {
  document.querySelectorAll('.appointment-slot-pill').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  selectedAppointmentSlot = slotStr;
}

function toggleSymptomTag(btn) {
  if (btn) btn.classList.toggle('active');
}

function submitAppointmentBooking() {
  const activeSymptomTags = Array.from(document.querySelectorAll('#symptomTagsContainer .symptom-tag-pill.active'))
    .map(el => el.innerText)
    .join(', ') || 'General Health Review';

  const modal = document.getElementById('modalAppointmentQueueTicket');
  if (!modal) return;

  // Sound feedback
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio error
  }

  // Populate Ticket Information
  const topAccent = document.getElementById('ticketTopAccent');
  const badge = document.getElementById('ticketTypeBadge');
  const tokenNum = document.getElementById('ticketTokenNumber');
  const facility = document.getElementById('ticketFacilityName');
  const docRoom = document.getElementById('ticketDoctorRoom');
  const queuePos = document.getElementById('ticketQueuePosition');
  const estWait = document.getElementById('ticketEstimatedWait');
  const dateSlot = document.getElementById('ticketDateSlot');
  const scanNote = document.getElementById('ticketScanNote');

  if (currentAppointmentMode === 'inperson') {
    const hospSelect = document.getElementById('selectHospitalFacility');
    const deptSelect = document.getElementById('selectDepartmentSpecialty');
    const hospName = hospSelect ? hospSelect.value.replace('📍 ', '') : 'District Hospital, Nashik (Central OPD)';
    const deptName = deptSelect ? deptSelect.value.replace('🩺 ', '').replace('👶 ', '').replace('🤰 ', '').replace('🦴 ', '').replace('❤️ ', '').replace('👁️ ', '') : 'General Medicine (Room 104) • Dr. Ramesh Patil';

    if (topAccent) topAccent.className = 'h-2 bg-blue-600 w-full';
    if (badge) {
      badge.innerHTML = '<i class="fas fa-hospital text-[10px]"></i> In-Person OPD Confirmed';
      badge.className = 'inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md';
    }
    if (tokenNum) tokenNum.innerText = '#TK-OPD-' + Math.floor(100 + Math.random() * 900);
    if (facility) facility.innerText = hospName;
    if (docRoom) docRoom.innerText = deptName;
    if (queuePos) queuePos.innerText = '#4 in Queue';
    if (estWait) estWait.innerText = '~ 15 Mins wait';
    if (scanNote) scanNote.innerText = 'Scan at hospital counter for instant check-in';

    // Toggle Join Video Call button visibility
    const btnTicketJoin = document.getElementById('btnTicketJoinVideoRoom');
    if (btnTicketJoin) btnTicketJoin.style.display = 'none';
    const btnHomeJoin = document.getElementById('btnHomeJoinCall');
    if (btnHomeJoin) btnHomeJoin.style.display = 'none';
  } else {
    const virtSelect = document.getElementById('selectVirtualSpecialty');
    const specName = virtSelect ? virtSelect.value.replace('🩺 ', '').replace('👶 ', '').replace('🧠 ', '').replace('🤰 ', '') : 'General Physician';

    if (topAccent) topAccent.className = 'h-2 bg-emerald-600 w-full';
    if (badge) {
      badge.innerHTML = '<i class="fas fa-video text-[10px]"></i> Virtual Teleconsult Confirmed';
      badge.className = 'inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md';
    }
    if (tokenNum) tokenNum.innerText = '#TK-VIRT-' + Math.floor(200 + Math.random() * 700);
    if (facility) facility.innerText = 'Arogya Mitra Video Teleconsultation Portal';
    if (docRoom) docRoom.innerText = specName + ' • Dr. Ramesh Patil (MD)';
    if (queuePos) queuePos.innerText = '#2 in Video Room';
    if (estWait) estWait.innerText = '~ 5 Mins wait';
    if (scanNote) scanNote.innerText = 'Encrypted video call activates 5 mins before slot';

    // Toggle Join Video Call button visibility
    const btnTicketJoin = document.getElementById('btnTicketJoinVideoRoom');
    if (btnTicketJoin) btnTicketJoin.style.display = 'flex';
    const btnHomeJoin = document.getElementById('btnHomeJoinCall');
    if (btnHomeJoin) btnHomeJoin.style.display = 'flex';
  }

  if (dateSlot) dateSlot.innerText = `${selectedAppointmentDate}, ${selectedAppointmentSlot.split(' - ')[0]}`;

  // Also save and display the active queue token widget on the main Home Screen
  const homeBanner = document.getElementById('homeActiveTokenBanner');
  if (homeBanner) {
    homeBanner.style.display = 'block';
    const hBadge = document.getElementById('homeTokenBadge');
    const hNum = document.getElementById('homeTokenNumber');
    const hFac = document.getElementById('homeTokenFacility');
    const hDoc = document.getElementById('homeTokenDoctor');
    const hWait = document.getElementById('homeTokenEstWait');
    const hPos = document.getElementById('homeTokenPosition');
    const hSlot = document.getElementById('homeTokenSlot');

    if (hBadge) hBadge.innerText = currentAppointmentMode === 'inperson' ? 'Live OPD Queue Token' : 'Live Virtual Video Token';
    if (hNum) hNum.innerText = tokenNum ? tokenNum.innerText : '#TK-OPD-108';
    if (hFac) hFac.innerText = facility ? facility.innerText : 'District Hospital, Nashik';
    if (hDoc) hDoc.innerText = docRoom ? docRoom.innerText : 'Dr. Ramesh Patil';
    if (hWait) hWait.innerText = estWait ? estWait.innerText : '~ 15 mins wait';
    if (hPos) hPos.innerText = queuePos ? queuePos.innerText : '#4 in Queue';
    if (hSlot) hSlot.innerText = dateSlot ? dateSlot.innerText : 'Today, 10:30 AM';
  }

  // Open Modal
  modal.classList.add('active');
}

function closeQueueTicketModal() {
  const modal = document.getElementById('modalAppointmentQueueTicket');
  if (modal) modal.classList.remove('active');
  showScreen('screenHome');
}

function cancelActiveToken(e) {
  if (e) e.stopPropagation();
  if (confirm('Do you want to cancel this active appointment token?')) {
    const homeBanner = document.getElementById('homeActiveTokenBanner');
    if (homeBanner) homeBanner.style.display = 'none';
    showToast('Appointment Token cancelled successfully.');
  }
}

function downloadAppointmentPass() {
  const token = document.getElementById('ticketTokenNumber')?.innerText || '#TK-OPD-108';
  showToast(`Downloading Official OPD Boarding Pass (${token}.pdf)`);
}

/* ==========================================================================
   14. TELECONSULTATION VIDEO CALL CONTROLLER (Interactive WebRTC Simulator)
   ========================================================================== */
let callTimerInterval = null;
let callDurationSeconds = 0;
let isMicMuted = false;
let isCamOff = false;
let isRearCamera = false;
let callCaptionTimer = null;

const liveDoctorCaptions = [
  "Namaste Parth! I'm Dr. Ramesh Patil. I am reviewing your connected ABHA health records.",
  "I see your recent blood pressure was logged by ASHA worker Sangita during the morning field visit.",
  "Your blood pressure readings are slightly elevated (138/88). Are you taking Telmisartan regularly?",
  "I am adjusting your medication to 40mg morning dosage and adding a lifestyle dietary advisory.",
  "I have digitally signed and issued your e-Prescription with UHID sync. Your local ASHA worker is notified.",
  "Please monitor your morning readings for 7 days. If you experience dizziness, connect immediately."
];
let currentCaptionIdx = 0;

function startVideoCallSession() {
  // Close any open queue ticket modal
  const ticketModal = document.getElementById('modalAppointmentQueueTicket');
  if (ticketModal) ticketModal.classList.remove('active');

  // Switch to Video Call Screen
  showScreen('screenVideoCall');
  showToast('Connecting to Dr. Ramesh Patil (Encrypted WebRTC Session)...');

  // Play connection chime
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch(e) {}

  // Reset & Start Call Timer
  callDurationSeconds = 0;
  updateCallTimerDisplay();
  if (callTimerInterval) clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    callDurationSeconds++;
    updateCallTimerDisplay();
  }, 1000);

  // Start Live Clinical Caption Rotation
  currentCaptionIdx = 0;
  if (callCaptionTimer) clearInterval(callCaptionTimer);
  const captionBox = document.getElementById('liveConsultationCaption');
  const captionEl = document.getElementById('liveCaptionText');
  if (captionBox) captionBox.style.display = 'block';
  if (captionEl) captionEl.innerText = `"${liveDoctorCaptions[0]}"`;

  callCaptionTimer = setInterval(() => {
    currentCaptionIdx = (currentCaptionIdx + 1) % liveDoctorCaptions.length;
    if (captionEl) {
      captionEl.style.opacity = '0';
      setTimeout(() => {
        captionEl.innerText = `"${liveDoctorCaptions[currentCaptionIdx]}"`;
        captionEl.style.opacity = '1';
      }, 300);
    }
  }, 7500);

  // Reset Controls UI
  isMicMuted = false;
  isCamOff = false;
  const btnMic = document.getElementById('btnCallToggleMic');
  if (btnMic) {
    btnMic.className = 'call-control-btn active';
    btnMic.innerHTML = '<i class="fas fa-microphone"></i><span id="lblCallMic">Mic On</span>';
  }
  const btnCam = document.getElementById('btnCallToggleCam');
  if (btnCam) {
    btnCam.className = 'call-control-btn active';
    btnCam.innerHTML = '<i class="fas fa-video"></i><span id="lblCallCam">Camera</span>';
  }
}

function updateCallTimerDisplay() {
  const timerEl = document.getElementById('callDurationTimer');
  if (!timerEl) return;
  const mins = Math.floor(callDurationSeconds / 60).toString().padStart(2, '0');
  const secs = (callDurationSeconds % 60).toString().padStart(2, '0');
  timerEl.innerText = `${mins}:${secs}`;
}

function toggleCallMic() {
  isMicMuted = !isMicMuted;
  const btnMic = document.getElementById('btnCallToggleMic');
  if (!btnMic) return;
  if (isMicMuted) {
    btnMic.className = 'call-control-btn muted';
    btnMic.innerHTML = '<i class="fas fa-microphone-slash"></i><span id="lblCallMic">Muted</span>';
    showToast('Microphone muted');
  } else {
    btnMic.className = 'call-control-btn active';
    btnMic.innerHTML = '<i class="fas fa-microphone"></i><span id="lblCallMic">Mic On</span>';
    showToast('Microphone unmuted');
  }
}

function toggleCallCam() {
  isCamOff = !isCamOff;
  const btnCam = document.getElementById('btnCallToggleCam');
  const pipTile = document.getElementById('patientPipTile');
  if (!btnCam) return;
  if (isCamOff) {
    btnCam.className = 'call-control-btn muted';
    btnCam.innerHTML = '<i class="fas fa-video-slash"></i><span id="lblCallCam">Cam Off</span>';
    if (pipTile) pipTile.style.opacity = '0.3';
    showToast('Camera turned off');
  } else {
    btnCam.className = 'call-control-btn active';
    btnCam.innerHTML = '<i class="fas fa-video"></i><span id="lblCallCam">Camera</span>';
    if (pipTile) pipTile.style.opacity = '1';
    showToast('Camera turned on');
  }
}

function flipCameraPreview() {
  isRearCamera = !isRearCamera;
  const pipName = document.querySelector('.pip-name-tag');
  if (pipName) {
    pipName.innerText = isRearCamera ? 'Rear Camera' : 'You (Parth)';
  }
  showToast(isRearCamera ? 'Switched to Rear Camera' : 'Switched to Front Camera');
}

function toggleInCallNotes() {
  const body = document.getElementById('inCallNotesBody');
  if (body) {
    const isVisible = body.style.display !== 'none';
    body.style.display = isVisible ? 'none' : 'block';
  }
}

function openInCallReportShare() {
  const modal = document.getElementById('modalInCallShareReports');
  if (modal) modal.classList.add('active');
}

function shareReportWithDoctor(reportName) {
  const modal = document.getElementById('modalInCallShareReports');
  if (modal) modal.classList.remove('active');
  showToast(`Streaming ${reportName} to Dr. Ramesh's screen ✓`);
  
  // Update doctor caption to acknowledge the report
  const captionEl = document.getElementById('liveCaptionText');
  if (captionEl) {
    captionEl.style.opacity = '0';
    setTimeout(() => {
      captionEl.innerText = `"Received ${reportName}. Vitals match our clinical database."`;
      captionEl.style.opacity = '1';
    }, 300);
  }
}

function openInCallChat() {
  const modal = document.getElementById('modalInCallChat');
  if (modal) {
    modal.classList.add('active');
    setTimeout(() => {
      const input = document.getElementById('inputInCallChatMessage');
      if (input) input.focus();
    }, 150);
  }
}

function sendInCallMessage() {
  const input = document.getElementById('inputInCallChatMessage');
  const chatContainer = document.getElementById('inCallChatMessages');
  if (!input || !chatContainer || !input.value.trim()) return;

  const userMsg = input.value.trim();
  input.value = '';

  // Append user message bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'flex items-start gap-2 justify-end';
  userBubble.innerHTML = `
    <div class="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-none max-w-[80%]">
      ${userMsg}
    </div>
  `;
  chatContainer.appendChild(userBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Simulate doctor reply after 1.2 seconds
  setTimeout(() => {
    const docBubble = document.createElement('div');
    docBubble.className = 'flex items-start gap-2';
    docBubble.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">DR</div>
      <div class="bg-slate-100 p-2.5 rounded-2xl rounded-tl-none text-slate-800 max-w-[80%]">
        Noted. I have entered this in your digital consultation notes.
      </div>
    `;
    chatContainer.appendChild(docBubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }, 1200);
}

function minimizeOrEndVideoCall() {
  if (confirm('Leave video teleconsultation room?')) {
    endVideoCallConsultation();
  }
}

function endVideoCallConsultation() {
  // Clear timers
  if (callTimerInterval) clearInterval(callTimerInterval);
  if (callCaptionTimer) clearInterval(callCaptionTimer);

  // Play disconnect sound
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.setValueAtTime(220, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch(e) {}

  // Hide in-call modals if any
  const shareModal = document.getElementById('modalInCallShareReports');
  if (shareModal) shareModal.classList.remove('active');
  const chatModal = document.getElementById('modalInCallChat');
  if (chatModal) chatModal.classList.remove('active');

  // Open Post-Call Summary Modal
  const summaryModal = document.getElementById('modalPostCallSummary');
  if (summaryModal) summaryModal.classList.add('active');
}

function closePostCallSummary() {
  const summaryModal = document.getElementById('modalPostCallSummary');
  if (summaryModal) summaryModal.classList.remove('active');

  // Remove active queue token banner from home
  const homeBanner = document.getElementById('homeActiveTokenBanner');
  if (homeBanner) homeBanner.style.display = 'none';

  // Navigate back to home
  showScreen('screenHome');
  showToast('Teleconsultation ended. e-Prescription saved to My Records.');
}

function downloadDigitalPrescription() {
  showToast('Downloading Digitally Signed Prescription (eRx-2026-0891.pdf)...');
}
