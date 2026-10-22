/**
 * IGRIS V7 — Configurable Daily Quests, Automatic Telemetry Sync & Anti-Duplicate Reward Logic
 */

import { loadState, saveState, getLocalDateString, escapeHTML } from './storage.js';
import { getDailyMetrics, awardXP, showToast } from './system.js';
import { openModal, closeModal } from './navigation.js';

export function getTodayQuestStates(state = loadState()) {
  const todayStr = getLocalDateString();
  const metrics = getDailyMetrics(todayStr, state);
  const claimedMap = state.questHistory[todayStr] || {};

  return state.questConfig.map(q => {
    const currentVal = Number(metrics[q.metric]) || 0;
    const targetVal = Math.max(1, Number(q.target) || 1);
    const pct = Math.min(100, Math.round((currentVal / targetVal) * 100));
    const isCompleted = currentVal >= targetVal;
    const isClaimed = Boolean(claimedMap[q.id]);

    return {
      ...q,
      currentVal,
      targetVal,
      pct,
      isCompleted,
      isClaimed
    };
  });
}

export function claimQuestReward(questId) {
  const state = loadState();
  const todayStr = getLocalDateString();
  const questStates = getTodayQuestStates(state);
  const quest = questStates.find(q => q.id === questId);

  if (!quest) return;
  if (quest.isClaimed) {
    showToast('Quest reward already claimed today.', 'error');
    return;
  }
  if (!quest.isCompleted) {
    showToast(`Complete the target (${quest.targetVal} ${quest.unit}) before claiming XP!`, 'error');
    return;
  }

  if (!state.questHistory[todayStr]) {
    state.questHistory[todayStr] = {};
  }
  state.questHistory[todayStr][quest.id] = true;
  saveState(state);

  const uniqueRewardKey = `quest_${todayStr}_${quest.id}`;
  awardXP(quest.xp, uniqueRewardKey, `Daily Quest: ${quest.title}`);
}

export function quickCompleteQuestRequirement(questId) {
  const state = loadState();
  const todayStr = getLocalDateString();
  const questStates = getTodayQuestStates(state);
  const quest = questStates.find(q => q.id === questId);
  if (!quest || quest.isCompleted) return;

  const remaining = Math.max(0, Number((quest.targetVal - quest.currentVal).toFixed(2)));
  if (remaining <= 0) return;

  if (quest.metric === 'studyHours') {
    state.studyLogs.push({
      id: `st-${Date.now()}`,
      date: todayStr,
      subject: 'Physics',
      hours: remaining,
      revisionMins: 0,
      notes: 'Logged via Daily Quest Directive'
    });
  } else if (quest.metric === 'revisionMins') {
    state.studyLogs.push({
      id: `st-${Date.now()}`,
      date: todayStr,
      subject: 'Botany',
      hours: 0.5,
      revisionMins: Math.ceil(remaining),
      notes: 'Mistake Revision Directive'
    });
  } else if (quest.metric === 'mcqs') {
    const needed = Math.ceil(remaining);
    state.mcqLogs.push({
      id: `mcq-${Date.now()}`,
      date: todayStr,
      subject: 'Physics',
      attempted: needed,
      correct: Math.round(needed * 0.85),
      revisionMins: 15,
      topic: 'Daily Quest MCQ Barrage'
    });
  } else if (quest.metric === 'workoutMins') {
    state.fitnessLogs.push({
      id: `fit-${Date.now()}`,
      date: todayStr,
      weight: 0,
      workoutType: 'Daily Conditioning Directive',
      duration: Math.ceil(remaining),
      sleep: 0,
      steps: 0,
      notes: 'Completed via Daily Quest'
    });
  } else if (quest.metric === 'sleepHours') {
    state.fitnessLogs.push({
      id: `fit-${Date.now()}`,
      date: todayStr,
      weight: 0,
      workoutType: 'Recovery',
      duration: 0,
      sleep: quest.targetVal,
      steps: 0,
      notes: 'Full Night Recovery Logged'
    });
  }

  saveState(state);
  claimQuestReward(questId);
}

export function renderQuestsScreen() {
  const state = loadState();
  const todayStr = getLocalDateString();
  const quests = getTodayQuestStates(state);

  // Date label
  const dateDisplay = document.getElementById('quests-date-display');
  if (dateDisplay) dateDisplay.textContent = `DIRECTIVES FOR ${todayStr}`;

  // Home compact list
  const homeList = document.getElementById('home-quest-list');
  const homeSub = document.getElementById('home-quests-subtitle');
  const completedCount = quests.filter(q => q.isCompleted || q.isClaimed).length;
  if (homeSub) {
    homeSub.textContent = `${completedCount} / ${quests.length} Completed Today`;
  }

  if (homeList) {
    homeList.innerHTML = quests.map(q => `
      <div class="quest-item ${q.isClaimed ? 'quest-claimed' : ''}">
        <div class="quest-top-row">
          <div>
            <strong class="quest-title">${escapeHTML(q.title)}</strong>
            <span class="block text-xs text-muted">${q.currentVal} / ${q.targetVal} ${escapeHTML(q.unit)}</span>
          </div>
          ${
            q.isClaimed
              ? `<span class="badge badge-success">CLAIMED +${q.xp} XP</span>`
              : q.isCompleted
                ? `<button type="button" class="btn btn-primary btn-sm" data-claim-quest="${escapeHTML(q.id)}">CLAIM +${q.xp} XP</button>`
                : `<button type="button" class="btn btn-outline btn-sm" data-complete-quest="${escapeHTML(q.id)}">MARK &amp; CLAIM</button>`
          }
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${q.pct}%"></div>
        </div>
      </div>
    `).join('');
  }

  // Full Quests list
  const fullList = document.getElementById('quests-full-list');
  if (fullList) {
    fullList.innerHTML = quests.map(q => `
      <div class="quest-item ${q.isClaimed ? 'quest-claimed' : ''}">
        <div class="quest-top-row">
          <div>
            <span class="system-label">+${q.xp} XP REWARD</span>
            <h4 class="quest-title">${escapeHTML(q.title)}</h4>
          </div>
          <span class="badge ${q.isClaimed ? 'badge-success' : 'badge-rank'}">
            ${q.isClaimed ? 'COMPLETED & CLAIMED' : `${q.pct}%`}
          </span>
        </div>
        <div class="progress-track my-1">
          <div class="progress-fill" style="width: ${q.pct}%"></div>
        </div>
        <div class="quest-controls-row">
          <span class="text-xs text-muted">Progress: <strong>${q.currentVal} / ${q.targetVal} ${escapeHTML(q.unit)}</strong></span>
          <div>
            ${
              q.isClaimed
                ? `<button type="button" class="btn btn-ghost btn-sm" disabled>REWARD CLAIMED</button>`
                : q.isCompleted
                  ? `<button type="button" class="btn btn-primary btn-sm" data-claim-quest="${escapeHTML(q.id)}">CLAIM +${q.xp} XP</button>`
                  : `<button type="button" class="btn btn-outline btn-sm" data-complete-quest="${escapeHTML(q.id)}">COMPLETE &amp; CLAIM</button>`
            }
          </div>
        </div>
      </div>
    `).join('');
  }

  // Recent 7-day quest archive
  const historyList = document.getElementById('quests-history-list');
  if (historyList) {
    const entries = Object.entries(state.questHistory || {})
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7);

    if (entries.length === 0) {
      historyList.innerHTML = `<p class="text-xs text-muted">No claimed daily quests in archive yet. Complete today's directives above!</p>`;
    } else {
      historyList.innerHTML = entries.map(([dateStr, claimedObj]) => {
        const count = Object.values(claimedObj || {}).filter(Boolean).length;
        return `
          <div class="history-row">
            <div>
              <strong>${escapeHTML(dateStr)}</strong>
              <span class="block text-xs text-muted">Daily Directives Claimed</span>
            </div>
            <span class="badge ${count >= quests.length ? 'badge-success' : 'badge-rank'}">
              ${count} / ${quests.length} QUESTS
            </span>
          </div>
        `;
      }).join('');
    }
  }
}

export function initQuestsEvents(onUpdate) {
  // Delegated claim / quick-complete clicks
  document.addEventListener('click', (e) => {
    const claimBtn = e.target.closest('[data-claim-quest]');
    if (claimBtn) {
      const qId = claimBtn.getAttribute('data-claim-quest');
      claimQuestReward(qId);
      onUpdate();
      return;
    }

    const completeBtn = e.target.closest('[data-complete-quest]');
    if (completeBtn) {
      const qId = completeBtn.getAttribute('data-complete-quest');
      quickCompleteQuestRequirement(qId);
      onUpdate();
    }
  });

  // Open Quest Targets Editor Modal
  const editBtn = document.getElementById('btn-edit-quest-targets');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const state = loadState();
      const inputsContainer = document.getElementById('quest-targets-inputs');
      if (inputsContainer) {
        inputsContainer.innerHTML = state.questConfig.map(q => `
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label" for="qtarget-${escapeHTML(q.id)}">${escapeHTML(q.title)} (${escapeHTML(q.unit)})</label>
              <input type="number" id="qtarget-${escapeHTML(q.id)}" data-qid="${escapeHTML(q.id)}" data-field="target"
                class="form-input" min="1" max="5000" step="0.5" value="${q.target}" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="qxp-${escapeHTML(q.id)}">XP Reward</label>
              <input type="number" id="qxp-${escapeHTML(q.id)}" data-qid="${escapeHTML(q.id)}" data-field="xp"
                class="form-input" min="10" max="1000" step="10" value="${q.xp}" required>
            </div>
          </div>
        `).join('');
      }
      openModal('modal-quest-targets');
    });
  }

  const formTargets = document.getElementById('form-quest-targets');
  if (formTargets) {
    formTargets.addEventListener('submit', (e) => {
      e.preventDefault();
      const state = loadState();
      state.questConfig.forEach(q => {
        const targetInput = document.getElementById(`qtarget-${q.id}`);
        const xpInput = document.getElementById(`qxp-${q.id}`);
        if (targetInput) {
          const val = Number(targetInput.value);
          if (val > 0) q.target = val;
        }
        if (xpInput) {
          const xVal = Number(xpInput.value);
          if (xVal >= 10) q.xp = Math.round(xVal);
        }
      });
      saveState(state);
      closeModal('modal-quest-targets');
      showToast('Daily Quest targets updated!', 'info');
      onUpdate();
    });
  }
}
