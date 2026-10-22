/**
 * IGRIS V7 — Main Application Bootstrapper, Screen Orchestrator, Boss, Achievements, Settings & PWA Installer
 */

import {
  loadState,
  saveState,
  resetAllData,
  loadSampleDemoData,
  exportBackupJSON,
  exportRecordsCSV,
  importBackupJSONFile,
  getLocalDateString,
  escapeHTML
} from './storage.js';

import {
  deriveLevelInfo,
  deriveCoreAttributes,
  calculateStreak,
  getDailyMetrics,
  getLast7DaysTelemetry,
  getWeeklyBossStatus,
  evaluateAchievements,
  ACHIEVEMENTS_CATALOG,
  MOTIVATIONAL_QUOTES,
  awardXP,
  showToast
} from './system.js';

import { renderAttributeRadarSVG, renderWeeklyBarChartSVG } from './charts.js';
import { initNavigation, openModal, closeModal, askConfirmation } from './navigation.js';
import { renderQuestsScreen, initQuestsEvents } from './quests.js';
import { renderNeetScreen, initNeetEvents } from './neet.js';
import { renderMcqScreen, initMcqEvents } from './mcq.js';
import { renderMocksScreen, initMocksEvents } from './mocks.js';
import { renderFitnessScreen, initFitnessEvents } from './fitness.js';

let deferredInstallPrompt = null;

function applyThemeAndMotionPreferences(state) {
  const root = document.documentElement;
  root.setAttribute('data-theme', state.profile.theme || 'shadow-blue');
  root.setAttribute('data-motion', state.profile.reducedMotion ? 'reduced' : 'full');
}

function renderGlobalHeaderAndHome(state) {
  const lvlInfo = deriveLevelInfo(state.progression.xp);
  const attrs = deriveCoreAttributes(state);
  const streak = calculateStreak(state);
  const todayStr = getLocalDateString();
  const todayMetrics = getDailyMetrics(todayStr, state);
  const boss = getWeeklyBossStatus(state);

  // Header
  const elPlayerName = document.getElementById('header-player-name');
  const elRankBadge = document.getElementById('header-rank-badge');
  const elHeaderLvl = document.getElementById('header-level-num');
  if (elPlayerName) elPlayerName.textContent = state.profile.name;
  if (elRankBadge) elRankBadge.textContent = lvlInfo.rank;
  if (elHeaderLvl) elHeaderLvl.textContent = String(lvlInfo.level);

  // Motivational quote rotated by day of year
  const dayIndex = Math.floor(Date.now() / 86400000) % MOTIVATIONAL_QUOTES.length;
  const quoteEl = document.getElementById('home-quote');
  if (quoteEl) quoteEl.textContent = MOTIVATIONAL_QUOTES[dayIndex];

  // Home Level & XP
  const homeLvl = document.getElementById('home-level-display');
  const homeTitle = document.getElementById('home-title-display');
  const homeStreak = document.getElementById('home-streak-count');
  const homeXpFill = document.getElementById('home-xp-fill');
  const homeXpCur = document.getElementById('home-xp-current');
  const homeXpNext = document.getElementById('home-xp-next');

  if (homeLvl) homeLvl.textContent = `Level ${lvlInfo.level}`;
  if (homeTitle) homeTitle.textContent = `${lvlInfo.title} (${lvlInfo.rank})`;
  if (homeStreak) homeStreak.textContent = String(streak);
  if (homeXpFill) homeXpFill.style.width = `${lvlInfo.progressPct}%`;
  if (homeXpCur) homeXpCur.textContent = `${lvlInfo.currentLevelXp.toLocaleString()} / ${lvlInfo.requiredForNext.toLocaleString()} XP`;
  if (homeXpNext) homeXpNext.textContent = `${lvlInfo.xpToNext.toLocaleString()} XP TO LEVEL ${lvlInfo.level + 1}`;

  // NEET Countdown
  const targetDateStr = state.profile.neetTargetDate || '2027-05-02';
  const targetTime = new Date(`${targetDateStr}T00:00:00`).getTime();
  const nowTime = new Date(`${todayStr}T00:00:00`).getTime();
  const diffDays = Math.max(0, Math.ceil((targetTime - nowTime) / 86400000));

  const elNeetDays = document.getElementById('home-neet-days');
  const elNeetLabel = document.getElementById('home-neet-date-label');
  if (elNeetDays) elNeetDays.textContent = String(diffDays);
  if (elNeetLabel) elNeetLabel.textContent = `Target: ${targetDateStr}`;

  // Home Mini Attributes
  document.getElementById('home-stat-str').textContent = String(attrs.STR);
  document.getElementById('home-stat-vit').textContent = String(attrs.VIT);
  document.getElementById('home-stat-int').textContent = String(attrs.INT);
  document.getElementById('home-stat-disc').textContent = String(attrs.DISC);

  // Today's Telemetry
  document.getElementById('home-today-study').textContent = `${todayMetrics.studyHours}h`;
  document.getElementById('home-today-mcqs').textContent = String(todayMetrics.mcqs);
  document.getElementById('home-today-workout').textContent = `${todayMetrics.workoutMins}m`;
  document.getElementById('home-today-sleep').textContent = `${todayMetrics.sleepHours}h`;

  // Home Weekly Boss Preview
  const homeBossFill = document.getElementById('home-boss-progress-fill');
  const homeBossText = document.getElementById('home-boss-status-text');
  if (homeBossFill) homeBossFill.style.width = `${boss.overallDamagePct}%`;
  if (homeBossText) {
    homeBossText.textContent = boss.alreadyClaimed
      ? 'Raid Boss Defeated & Claimed This Week!'
      : `Raid Damage Dealt: ${boss.overallDamagePct}%`;
  }
}

function renderStatusScreen(state) {
  const lvlInfo = deriveLevelInfo(state.progression.xp);
  const attrs = deriveCoreAttributes(state);
  const streak = calculateStreak(state);
  const { days, totals } = getLast7DaysTelemetry(state);

  document.getElementById('status-player-name').textContent = state.profile.name;
  document.getElementById('status-player-title').textContent = lvlInfo.title;
  document.getElementById('status-rank-letter').textContent = lvlInfo.rankLetter;
  document.getElementById('status-level-val').textContent = String(lvlInfo.level);
  document.getElementById('status-total-xp').textContent = lvlInfo.totalXp.toLocaleString();
  document.getElementById('status-streak-val').textContent = `${streak}d`;
  document.getElementById('status-xp-bar').style.width = `${lvlInfo.progressPct}%`;
  document.getElementById('status-xp-detail').textContent =
    `${lvlInfo.currentLevelXp.toLocaleString()} / ${lvlInfo.requiredForNext.toLocaleString()} XP required for Level ${lvlInfo.level + 1}`;

  document.getElementById('status-attr-str-val').textContent = String(attrs.STR);
  document.getElementById('status-attr-vit-val').textContent = String(attrs.VIT);
  document.getElementById('status-attr-int-val').textContent = String(attrs.INT);
  document.getElementById('status-attr-disc-val').textContent = String(attrs.DISC);

  renderAttributeRadarSVG(document.getElementById('status-radar-container'), attrs);
  renderWeeklyBarChartSVG(document.getElementById('status-weekly-chart'), days);

  const weeklySumEl = document.getElementById('status-weekly-summary');
  if (weeklySumEl) {
    weeklySumEl.innerHTML = `
      <div class="telemetry-box">
        <span class="telemetry-label">7D STUDY</span>
        <strong class="telemetry-val">${totals.studyHours}h</strong>
      </div>
      <div class="telemetry-box">
        <span class="telemetry-label">7D MCQs</span>
        <strong class="telemetry-val">${totals.mcqs}</strong>
      </div>
      <div class="telemetry-box">
        <span class="telemetry-label">7D WORKOUTS</span>
        <strong class="telemetry-val">${totals.workoutsCount}</strong>
      </div>
      <div class="telemetry-box">
        <span class="telemetry-label">AVG SLEEP</span>
        <strong class="telemetry-val">${totals.avgSleep}h</strong>
      </div>
    `;
  }
}

function renderBossSubscreen(state) {
  const boss = getWeeklyBossStatus(state);

  const weekLabel = document.getElementById('boss-week-label');
  const hpText = document.getElementById('boss-hp-text');
  const hpBar = document.getElementById('boss-hp-bar');
  const claimBtn = document.getElementById('btn-claim-boss-reward');
  const reqList = document.getElementById('boss-requirements-list');

  if (weekLabel) weekLabel.textContent = `Active Raid Cycle: ${boss.weekKey}`;
  if (hpText) {
    hpText.textContent = boss.hpRemainingPct === 0
      ? '0% HP (BOSS DEFEATED!)'
      : `${boss.hpRemainingPct}% HP REMAINING`;
  }
  if (hpBar) hpBar.style.width = `${boss.hpRemainingPct}%`;

  if (claimBtn) {
    if (boss.alreadyClaimed) {
      claimBtn.disabled = true;
      claimBtn.textContent = 'REWARD CLAIMED';
    } else if (boss.allMet) {
      claimBtn.disabled = false;
      claimBtn.textContent = 'CLAIM +500 XP';
    } else {
      claimBtn.disabled = true;
      claimBtn.textContent = 'DEFEAT BOSS TO CLAIM';
    }
  }

  if (reqList) {
    const items = [
      { label: 'Weekly Deep Study Hours', cur: boss.current.studyHours, tar: boss.targets.studyHours, pct: boss.percentages.studyPct, unit: 'hours' },
      { label: 'Weekly Combat MCQs Solved', cur: boss.current.mcqs, tar: boss.targets.mcqs, pct: boss.percentages.mcqPct, unit: 'MCQs' },
      { label: 'Weekly Conditioning Workouts', cur: boss.current.workouts, tar: boss.targets.workouts, pct: boss.percentages.workoutPct, unit: 'workouts' }
    ];

    reqList.innerHTML = items.map(i => `
      <div class="quest-item">
        <div class="quest-top-row">
          <strong class="quest-title">${escapeHTML(i.label)}</strong>
          <span class="text-xs text-cyan">${i.cur} / ${i.tar} ${escapeHTML(i.unit)} (${i.pct}%)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${i.pct}%"></div>
        </div>
      </div>
    `).join('');
  }

  const studyInp = document.getElementById('boss-target-study');
  const mcqInp = document.getElementById('boss-target-mcqs');
  const workInp = document.getElementById('boss-target-workouts');
  if (studyInp && document.activeElement !== studyInp) studyInp.value = boss.targets.studyHours;
  if (mcqInp && document.activeElement !== mcqInp) mcqInp.value = boss.targets.mcqs;
  if (workInp && document.activeElement !== workInp) workInp.value = boss.targets.workouts;
}

function renderAchievementsSubscreen(state) {
  evaluateAchievements(state);
  const unlockedMap = state.unlockedAchievements || {};
  const unlockedCount = Object.keys(unlockedMap).length;
  const totalCount = ACHIEVEMENTS_CATALOG.length;

  const countLabel = document.getElementById('achievements-count-label');
  if (countLabel) countLabel.textContent = `${unlockedCount} / ${totalCount} Relics Unlocked`;

  const portalAch = document.getElementById('portal-ach-stat');
  if (portalAch) portalAch.textContent = `${unlockedCount} / ${totalCount} Unlocked`;

  const grid = document.getElementById('achievements-grid');
  if (grid) {
    grid.innerHTML = ACHIEVEMENTS_CATALOG.map(ach => {
      const unlockData = unlockedMap[ach.id];
      const isUnlocked = Boolean(unlockData);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
          <div class="xp-card-top">
            <div class="ach-icon-badge">
              <svg class="icon-svg" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
            <span class="badge ${isUnlocked ? 'badge-success' : 'badge-rank'}">
              ${isUnlocked ? 'UNLOCKED' : 'LOCKED'}
            </span>
          </div>
          <strong class="quest-title">${escapeHTML(ach.title)}</strong>
          <p class="text-xs text-muted">${escapeHTML(ach.desc)}</p>
          ${isUnlocked ? `<small class="text-xs text-cyan mt-1">Earned: ${escapeHTML(unlockData.unlockedAt)}</small>` : ''}
        </div>
      `;
    }).join('');
  }
}

function syncSettingsInputs(state) {
  const nameInp = document.getElementById('set-player-name');
  const dateInp = document.getElementById('set-neet-date');
  const motionChk = document.getElementById('toggle-reduced-motion');
  const soundChk = document.getElementById('toggle-sound-fx');
  const themeSel = document.getElementById('select-theme-accent');

  if (nameInp && document.activeElement !== nameInp) nameInp.value = state.profile.name;
  if (dateInp && document.activeElement !== dateInp) dateInp.value = state.profile.neetTargetDate;
  if (motionChk) motionChk.checked = Boolean(state.profile.reducedMotion);
  if (soundChk) soundChk.checked = Boolean(state.profile.soundEnabled);
  if (themeSel) themeSel.value = state.profile.theme || 'shadow-blue';
}

export function refreshAllUI() {
  const state = loadState();
  applyThemeAndMotionPreferences(state);
  renderGlobalHeaderAndHome(state);
  renderStatusScreen(state);
  renderQuestsScreen();
  renderNeetScreen();
  renderMcqScreen();
  renderMocksScreen();
  renderFitnessScreen();
  renderBossSubscreen(state);
  renderAchievementsSubscreen(state);
  syncSettingsInputs(state);
}

function initStudyModalAndBossEvents() {
  const openStudyBtns = [
    document.getElementById('btn-open-study-modal'),
    document.getElementById('btn-status-log-study'),
    document.getElementById('quests-quick-study')
  ];
  openStudyBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', () => openModal('modal-study-log'));
  });

  const formStudy = document.getElementById('form-study-log');
  if (formStudy) {
    formStudy.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = document.getElementById('study-log-subject').value;
      const hours = Number(document.getElementById('study-log-hours').value);
      const revisionMins = Math.max(0, Math.floor(Number(document.getElementById('study-log-revision').value) || 0));
      const notes = document.getElementById('study-log-notes').value.trim();

      if (!Number.isFinite(hours) || hours <= 0 || hours > 18) {
        showToast('Enter a valid study duration between 0.25 and 18 hours.', 'error');
        return;
      }

      const state = loadState();
      const id = `study-${Date.now()}`;
      state.studyLogs.push({
        id,
        date: getLocalDateString(),
        subject,
        hours,
        revisionMins,
        notes
      });
      saveState(state);

      const xp = Math.round(hours * 25) + Math.round(revisionMins * 0.5);
      awardXP(xp, `study_session_${id}`, `Logged ${hours}h ${subject} Study`);

      document.getElementById('study-log-notes').value = '';
      closeModal('modal-study-log');
      refreshAllUI();
    });
  }

  // Weekly Boss Claim & Target Edit
  const claimBossBtn = document.getElementById('btn-claim-boss-reward');
  if (claimBossBtn) {
    claimBossBtn.addEventListener('click', () => {
      const state = loadState();
      const boss = getWeeklyBossStatus(state);
      if (boss.alreadyClaimed) {
        showToast('Weekly Boss reward already claimed for this week.', 'error');
        return;
      }
      if (!boss.allMet) {
        showToast('Complete all 3 weekly raid targets first!', 'error');
        return;
      }
      state.weeklyBoss.claimedWeeks[boss.weekKey] = true;
      saveState(state);
      awardXP(500, `weekly_boss_${boss.weekKey}`, `Vanquished Weekly Boss (${boss.weekKey})`);
      refreshAllUI();
    });
  }

  const formBossTargets = document.getElementById('form-boss-targets');
  if (formBossTargets) {
    formBossTargets.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = Math.max(5, Number(document.getElementById('boss-target-study').value) || 35);
      const m = Math.max(50, Number(document.getElementById('boss-target-mcqs').value) || 700);
      const w = Math.max(1, Number(document.getElementById('boss-target-workouts').value) || 3);

      const state = loadState();
      state.weeklyBoss.targets = { studyHours: s, mcqs: m, workouts: w };
      saveState(state);
      showToast('Weekly Raid Boss parameters updated!', 'info');
      refreshAllUI();
    });
  }
}

function initSettingsAndVaultEvents() {
  const formProfile = document.getElementById('form-settings-profile');
  if (formProfile) {
    formProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('set-player-name').value.trim() || 'HUNTER';
      const neetDate = document.getElementById('set-neet-date').value || '2027-05-02';
      const state = loadState();
      state.profile.name = name;
      state.profile.neetTargetDate = neetDate;
      saveState(state);
      showToast('Hunter profile & NEET target date saved!', 'info');
      refreshAllUI();
    });
  }

  const motionChk = document.getElementById('toggle-reduced-motion');
  if (motionChk) {
    motionChk.addEventListener('change', () => {
      const state = loadState();
      state.profile.reducedMotion = motionChk.checked;
      saveState(state);
      applyThemeAndMotionPreferences(state);
      showToast(`Reduced motion ${motionChk.checked ? 'enabled' : 'disabled'}.`, 'info');
    });
  }

  const soundChk = document.getElementById('toggle-sound-fx');
  if (soundChk) {
    soundChk.addEventListener('change', () => {
      const state = loadState();
      state.profile.soundEnabled = soundChk.checked;
      saveState(state);
      showToast(`System audio ${soundChk.checked ? 'enabled' : 'muted'}.`, 'info');
    });
  }

  const themeSel = document.getElementById('select-theme-accent');
  if (themeSel) {
    themeSel.addEventListener('change', () => {
      const state = loadState();
      state.profile.theme = themeSel.value;
      saveState(state);
      applyThemeAndMotionPreferences(state);
      showToast('System energy aura updated!', 'info');
    });
  }

  const btnExportJson = document.getElementById('btn-export-json');
  if (btnExportJson) {
    btnExportJson.addEventListener('click', () => {
      exportBackupJSON();
      showToast('JSON backup exported.', 'info');
    });
  }

  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      exportRecordsCSV();
      showToast('CSV study & mock records exported.', 'info');
    });
  }

  const inputImportJson = document.getElementById('input-import-json');
  if (inputImportJson) {
    inputImportJson.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await importBackupJSONFile(file);
        showToast('Backup restored successfully!', 'info');
        refreshAllUI();
      } catch (err) {
        showToast(err.message || 'Invalid backup file.', 'error');
      } finally {
        inputImportJson.value = '';
      }
    });
  }

  const btnDemo = document.getElementById('btn-load-demo-data');
  if (btnDemo) {
    btnDemo.addEventListener('click', () => {
      askConfirmation('Load sample Demo Data? This will overwrite current records unless you exported a backup first.', () => {
        loadSampleDemoData();
        showToast('Sample Demo Data loaded!', 'info');
        refreshAllUI();
      });
    });
  }

  const btnReset = document.getElementById('btn-reset-all-data');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      askConfirmation('FACTORY RESET: Permanently erase all XP, quests, logs, and syllabus records back to zero?', () => {
        resetAllData();
        showToast('All data reset to clean Day 1 state.', 'info');
        refreshAllUI();
      });
    });
  }
}

function initNetworkAndPWA() {
  const pill = document.getElementById('network-status-pill');
  const label = document.getElementById('network-status-label');
  const updateNetStatus = () => {
    const online = navigator.onLine;
    if (pill) pill.classList.toggle('offline', !online);
    if (label) label.textContent = online ? 'ONLINE' : 'OFFLINE READY';
  };

  window.addEventListener('online', updateNetStatus);
  window.addEventListener('offline', updateNetStatus);
  updateNetStatus();

  // Register Service Worker using relative path for GitHub Pages subpath compatibility
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('[IGRIS PWA] Service worker registration skipped/failed:', err);
      });
    });
  }

  // Install prompt handling
  const installBtn = document.getElementById('btn-pwa-install');
  
