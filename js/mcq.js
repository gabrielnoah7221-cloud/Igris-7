/**
 * IGRIS V7 — MCQ Combat Tracker, Accuracy Formula & Subject Breakdown
 */

import { loadState, saveState, getLocalDateString, escapeHTML } from './storage.js';
import { awardXP, showToast } from './system.js';
import { askConfirmation } from './navigation.js';

const SUBJECTS = [
  'Physics',
  'Physical Chemistry',
  'Organic Chemistry',
  'Inorganic Chemistry',
  'Botany',
  'Zoology'
];

export function calculateAccuracy(correct, attempted) {
  const att = Number(attempted) || 0;
  const cor = Number(correct) || 0;
  if (att <= 0) return 0;
  return Number(((cor / att) * 100).toFixed(1));
}

export function renderMcqScreen() {
  const state = loadState();
  const logs = state.mcqLogs || [];
  const todayStr = getLocalDateString();

  const totalAttempted = logs.reduce((s, l) => s + (Number(l.attempted) || 0), 0);
  const totalCorrect = logs.reduce((s, l) => s + (Number(l.correct) || 0), 0);
  const totalIncorrect = Math.max(0, totalAttempted - totalCorrect);
  const accuracy = calculateAccuracy(totalCorrect, totalAttempted);

  const elAtt = document.getElementById('mcq-total-attempted');
  const elCor = document.getElementById('mcq-total-correct');
  const elInc = document.getElementById('mcq-total-incorrect');
  const elAcc = document.getElementById('mcq-total-accuracy');

  if (elAtt) elAtt.textContent = totalAttempted.toLocaleString();
  if (elCor) elCor.textContent = totalCorrect.toLocaleString();
  if (elInc) elInc.textContent = totalIncorrect.toLocaleString();
  if (elAcc) elAcc.textContent = `${accuracy.toFixed(1)}%`;

  // Portal preview on Home
  const portalStat = document.getElementById('portal-mcq-stat');
  if (portalStat) {
    portalStat.textContent = totalAttempted > 0
      ? `${totalAttempted} Solved • ${accuracy.toFixed(1)}% Acc`
      : 'Log & Analyze Accuracy';
  }

  // Daily and 7-day totals
  const todayMcqs = logs
    .filter(l => l.date === todayStr)
    .reduce((s, l) => s + (Number(l.attempted) || 0), 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const minDateStr = getLocalDateString(sevenDaysAgo);

  const weekMcqs = logs
    .filter(l => l.date >= minDateStr)
    .reduce((s, l) => s + (Number(l.attempted) || 0), 0);

  const elTodaySum = document.getElementById('mcq-today-summary');
  const elWeekSum = document.getElementById('mcq-week-summary');
  if (elTodaySum) elTodaySum.textContent = `Today: ${todayMcqs} MCQs`;
  if (elWeekSum) elWeekSum.textContent = `Last 7 Days: ${weekMcqs} MCQs`;

  // Subject breakdown
  const subjBreakEl = document.getElementById('mcq-subject-breakdown');
  if (subjBreakEl) {
    subjBreakEl.innerHTML = SUBJECTS.map(subj => {
      const sLogs = logs.filter(l => l.subject === subj);
      const sAtt = sLogs.reduce((a, b) => a + (Number(b.attempted) || 0), 0);
      const sCor = sLogs.reduce((a, b) => a + (Number(b.correct) || 0), 0);
      const sAcc = calculateAccuracy(sCor, sAtt);

      return `
        <div class="subject-stat-card">
          <div class="xp-card-meta mb-1">
            <strong>${escapeHTML(subj)}</strong>
            <span class="text-cyan">${sAcc.toFixed(1)}%</span>
          </div>
          <div class="progress-track mb-1">
            <div class="progress-fill" style="width: ${Math.min(100, sAcc)}%"></div>
          </div>
          <span class="text-xs text-muted">${sCor} / ${sAtt} Correct</span>
        </div>
      `;
    }).join('');
  }

  // History list
  const histEl = document.getElementById('mcq-history-list');
  if (histEl) {
    if (logs.length === 0) {
      histEl.innerHTML = `<p class="text-xs text-muted">No MCQ practice sessions logged yet.</p>`;
    } else {
      const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
      histEl.innerHTML = sorted.slice(0, 25).map(item => {
        const acc = calculateAccuracy(item.correct, item.attempted);
        return `
          <div class="history-row">
            <div>
              <strong>${escapeHTML(item.subject)} — ${item.correct}/${item.attempted} (${acc}%)</strong>
              <span class="block text-xs text-muted">
                ${escapeHTML(item.date)} • Rev: ${Number(item.revisionMins) || 0}m
                ${item.topic ? ` • ${escapeHTML(item.topic)}` : ''}
              </span>
            </div>
            <button type="button" class="btn btn-danger btn-sm" data-del-mcq="${escapeHTML(item.id)}" aria-label="Delete MCQ Log">DEL</button>
          </div>
        `;
      }).join('');
    }
  }
}

export function initMcqEvents(onUpdate) {
  const dateInp = document.getElementById('mcq-date');
  if (dateInp && !dateInp.value) {
    dateInp.value = getLocalDateString();
  }

  const form = document.getElementById('form-mcq-log');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const subject = document.getElementById('mcq-subject').value;
      const date = document.getElementById('mcq-date').value || getLocalDateString();
      const attempted = Math.floor(Number(document.getElementById('mcq-attempted').value));
      const correct = Math.floor(Number(document.getElementById('mcq-correct').value));
      const revisionMins = Math.max(0, Math.floor(Number(document.getElementById('mcq-revision-mins').value) || 0));
      const topic = document.getElementById('mcq-topic').value.trim();

      if (!Number.isFinite(attempted) || attempted <= 0) {
        showToast('Total attempted MCQs must be at least 1.', 'error');
        return;
      }
      if (!Number.isFinite(correct) || correct < 0) {
        showToast('Correct answers cannot be negative.', 'error');
        return;
      }
      if (correct > attempted) {
        showToast('Validation Error: Correct answers cannot exceed attempted questions!', 'error');
        return;
      }

      const state = loadState();
      const entryId = `mcq-${Date.now()}`;
      state.mcqLogs.push({
        id: entryId,
        date,
        subject,
        attempted,
        correct,
        revisionMins,
        topic
      });
      saveState(state);

      // XP reward proportional to questions solved (capped reasonably)
      const xpEarned = Math.min(250, Math.max(15, Math.round(attempted * 0.75)));
      awardXP(xpEarned, `mcq_log_${entryId}`, `Solved ${attempted} ${subject} MCQs`);

      document.getElementById('mcq-attempted').value = '';
      document.getElementById('mcq-correct').value = '';
      document.getElementById('mcq-topic').value = '';
      onUpdate();
    });
  }

  const histEl = document.getElementById('mcq-history-list');
  if (histEl) {
    histEl.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-del-mcq]');
      if (!delBtn) return;
      const id = delBtn.getAttribute('data-del-mcq');
      askConfirmation('Delete this MCQ practice record?', () => {
        const state = loadState();
        state.mcqLogs = state.mcqLogs.filter(m => m.id !== id);
        saveState(state);
        showToast('MCQ record deleted.', 'info');
        onUpdate();
      });
    });
  }
}
