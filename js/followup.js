/**
 * MCCPHP - Follow-Up Care Pathway & Timeline Controller
 * Replicates interactive behaviors shown in 'follow up process.jpeg'
 */

document.addEventListener('DOMContentLoaded', () => {
  initDeviceModeSwitcher();
  initLoginScreenToggle();

  // Tab Switching
  const tabs = document.querySelectorAll('.timeline-tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Milestone Click Interaction
  const milestoneNodes = document.querySelectorAll('.milestone-node-col');
  const progressLine = document.querySelector('.timeline-progress-fill');

  milestoneNodes.forEach((node, index) => {
    node.addEventListener('click', () => {
      const percentage = Math.min(100, Math.max(10, (index + 1) * 18));
      if (progressLine) {
        progressLine.style.width = `${percentage}%`;
      }
      
      milestoneNodes.forEach((n, idx) => {
        const badge = n.querySelector('.milestone-badge-circle');
        if (badge) {
          if (idx <= index) {
            badge.classList.add('completed');
            badge.innerHTML = '✓';
          } else {
            badge.classList.remove('completed');
            badge.innerHTML = '✓';
          }
        }
      });
    });
  });

  // Red Plus Button Action
  const redAddBtn = document.querySelector('.red-circle-add-btn');
  if (redAddBtn) {
    redAddBtn.addEventListener('click', () => {
      showToast('Adding new Follow-up Treatment Milestone for Ramesh Pawar (MH-2026-004291)...');
    });
  }
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
        showToast('Viewing Patient Treatment Pathway Dashboard');
      } else {
        showScreen('screenLogin');
        if (lblToggle) lblToggle.textContent = 'Back to App';
        showToast('Viewing Care Coordinator Login Screen');
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
function loginAsCoordinator() {
  showScreen('screenMainApp');
  const lblToggle = document.getElementById('lblLoginToggle');
  if (lblToggle) lblToggle.textContent = 'View Login Screen';
  showToast('Logged in as Dr. Ramesh Patil / Care Pathway Coordinator');
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
