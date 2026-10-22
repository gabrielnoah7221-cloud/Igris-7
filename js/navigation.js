/**
 * IGRIS V7 — Mobile-First Screen, Subscreen & Modal Navigation Controller
 */

const PRIMARY_SCREENS = ['home', 'status', 'quests', 'chapters', 'more'];
const SUBSCREENS = ['mcq', 'mocks', 'fitness', 'boss', 'achievements', 'settings'];

let currentScreen = 'home';
let currentSubscreen = null;
let confirmCallback = null;

export function initNavigation(onNavigateCallback) {
  // Bottom Nav Primary Buttons
  const navButtons = document.querySelectorAll('.bottom-nav .nav-item[data-nav]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-nav');
      navigateToScreen(target, null, onNavigateCallback);
    });
  });

  // Delegated clicks for data-nav-target, data-nav-sub, data-open-sub, data-back-hub, data-close-modal
  document.addEventListener('click', (e) => {
    const navTargetBtn = e.target.closest('[data-nav-target]');
    if (navTargetBtn) {
      const target = navTargetBtn.getAttribute('data-nav-target');
      navigateToScreen(target, null, onNavigateCallback);
      return;
    }

    const navSubBtn = e.target.closest('[data-nav-sub]');
    if (navSubBtn) {
      const sub = navSubBtn.getAttribute('data-nav-sub');
      navigateToScreen('more', sub, onNavigateCallback);
      return;
    }

    const openSubBtn = e.target.closest('[data-open-sub]');
    if (openSubBtn) {
      const sub = openSubBtn.getAttribute('data-open-sub');
      navigateToScreen('more', sub, onNavigateCallback);
      return;
    }

    const backHubBtn = e.target.closest('[data-back-hub]');
    if (backHubBtn) {
      navigateToScreen('more', null, onNavigateCallback);
      return;
    }

    const closeModalBtn = e.target.closest('[data-close-modal]');
    if (closeModalBtn) {
      const modalId = closeModalBtn.getAttribute('data-close-modal');
      closeModal(modalId);
    }
  });

  // Keyboard support for role="button" cards
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const focusCard = e.target.closest('[data-nav-target][role="button"]');
      if (focusCard) {
        e.preventDefault();
        navigateToScreen(focusCard.getAttribute('data-nav-target'), null, onNavigateCallback);
      }
    } else if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(m => {
        m.hidden = true;
      });
    }
  });

  // Confirmation modal wiring
  const btnYes = document.getElementById('btn-confirm-yes');
  const btnNo = document.getElementById('btn-confirm-no');

  if (btnYes) {
    btnYes.addEventListener('click', () => {
      closeModal('modal-confirm');
      if (typeof confirmCallback === 'function') {
        const fn = confirmCallback;
        confirmCallback = null;
        fn();
      }
    });
  }

  if (btnNo) {
    btnNo.addEventListener('click', () => {
      confirmCallback = null;
      closeModal('modal-confirm');
    });
  }
}

export function navigateToScreen(screenName, subscreenName = null, onNavigateCallback = null) {
  if (!PRIMARY_SCREENS.includes(screenName)) return;

  currentScreen = screenName;
  currentSubscreen = subscreenName;

  // Toggle primary screen sections
  PRIMARY_SCREENS.forEach(name => {
    const sec = document.getElementById(`screen-${name}`);
    if (!sec) return;
    if (name === screenName) {
      sec.hidden = false;
      sec.classList.add('active');
    } else {
      sec.hidden = true;
      sec.classList.remove('active');
    }
  });

  // Update Bottom Nav active indicator
  document.querySelectorAll('.bottom-nav .nav-item[data-nav]').forEach(btn => {
    const isMatch = btn.getAttribute('data-nav') === screenName;
    btn.classList.toggle('active', isMatch);
    if (isMatch) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Handle "More" subscreens vs Hub view
  if (screenName === 'more') {
    const hubView = document.getElementById('more-hub-view');
    const validSub = SUBSCREENS.includes(subscreenName) ? subscreenName : null;

    if (hubView) hubView.hidden = Boolean(validSub);

    SUBSCREENS.forEach(sub => {
      const subEl = document.getElementById(`subscreen-${sub}`);
      if (subEl) {
        subEl.hidden = sub !== validSub;
      }
    });
  }

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  if (typeof onNavigateCallback === 'function') {
    onNavigateCallback(currentScreen, currentSubscreen);
  }
}

export function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.hidden = false;
  }
}

export function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) {
    el.hidden = true;
  }
}

export function askConfirmation(message, onConfirm) {
  const msgEl = document.getElementById('confirm-message');
  if (msgEl) msgEl.textContent = message;
  confirmCallback = onConfirm;
  openModal('modal-confirm');
}
