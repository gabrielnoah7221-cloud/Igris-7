/**
 * IGRIS V7 — Body Weight, Beginner Hypertrophy Workouts, Steps, Sleep & Trend Module
 */

import { loadState, saveState, getLocalDateString, escapeHTML } from './storage.js';
import { getLast7DaysTelemetry, getDailyMetrics, awardXP, showToast } from './system.js';
import { renderLineTrendSVG } from './charts.js';
import { askConfirmation } from './navigation.js';

export function renderFitnessScreen() {
  const state = loadState();
  const logs = [...(state.fitnessLogs || [])].sort((a, b) => a.date.localeCompare(b.date));
  const { totals } = getLast7DaysTelemetry(state);
  const todayMetrics = getDailyMetrics(getLocalDateString(), state);

  const weightLogs = logs.filter(l => (Number(l.weight) || 0) > 0);
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : null;

  const elWeight = document.getElementById('fit-latest-weight');
  const elWorkouts = document.getElementById('fit-week-workouts');
  const elSleep = document.getElementById('fit-avg-sleep');
  const elSteps = document.getElementById('fit-today-steps');
  const portalStat = document.getElementById('portal-fit-stat');

  if (elWeight) elWeight.textContent = latestWeight ? `${latestWeight} kg` : '-- kg';
  if (elWorkouts) elWorkouts.textContent = String(totals.workoutsCount);
  if (elSleep) elSleep.textContent = totals.avgSleep > 0 ? `${totals.avgSleep} h` : '-- h';
  if (elSteps) elSteps.textContent = todayMetrics.steps.toLocaleString();

  if (portalStat) {
    portalStat.textContent = `${totals.workoutsCount} Workouts (7d) • Avg Sleep ${totals.avgSleep || 0}h`;
  }

  // Weight Trend SVG Chart
  const weightChartEl = document.getElementById('fit-weight-chart');
  const weightPoints = weightLogs.map(w => ({
    label: w.date.slice(5),
    value: Number(w.weight)
  }));
  renderLineTrendSVG(weightChartEl, weightPoints, {
    emptyText: 'Log your body weight (kg) to visualize your physical vessel trend.',
    unit: 'kg'
  });

  // History List
  const histEl = document.getElementById('fit-history-list');
  if (histEl) {
    if (logs.length === 0) {
      histEl.innerHTML = `<p class="text-xs text-muted">No physical conditioning or recovery logs recorded yet.</p>`;
    } else {
      const reversed = [...logs].reverse();
      histEl.innerHTML = reversed.slice(0, 25).map(item => `
        <div class="history-row">
          <div>
            <strong>
              ${escapeHTML(item.workoutType || 'Body Telemetry')}
              ${item.duration ? ` (${item.duration}m)` : ''}
            </strong>
            <span class="block text-xs text-muted">
              ${escapeHTML(item.date)}
              ${item.weight ? ` • Weight: ${item.weight}kg` : ''}
              ${item.sleep ? ` • Sleep: ${item.sleep}h` : ''}
              ${item.steps ? ` • Steps: ${item.steps}` : ''}
              ${item.notes ? ` • ${escapeHTML(item.notes)}` : ''}
            </span>
          </div>
          <button type="button" class="btn btn-danger btn-sm" data-del-fit="${escapeHTML(item.id)}">DEL</button>
        </div>
      `).join('');
    }
  }
}

export function initFitnessEvents(onUpdate) {
  const dateInp = document.getElementById('fit-date');
  if (dateInp && !dateInp.value) {
    dateInp.value = getLocalDateString();
  }

  // Beginner Workout Preset Buttons
  document.addEventListener('click', (e) => {
    const presetBtn = e.target.closest('[data-workout-preset]');
    if (!presetBtn) return;
    const raw = presetBtn.getAttribute('data-workout-preset');
    const [type, duration, notes] = raw.split('|');
    const typeInp = document.getElementById('fit-workout-type');
    const durInp = document.getElementById('fit-duration');
    const notesInp = document.getElementById('fit-notes');

    if (typeInp) typeInp.value = type || '';
    if (durInp) durInp.value = duration || '';
    if (notesInp) notesInp.value = notes || '';
    showToast(`Loaded template: ${type}`, 'info');
  });

  const form = document.getElementById('form-fitness-log');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const date = document.getElementById('fit-date').value || getLocalDateString();
      const weightRaw = document.getElementById('fit-weight').value.trim();
      const workoutType = document.getElementById('fit-workout-type').value.trim();
      const duration = Math.max(0, Math.floor(Number(document.getElementById('fit-duration').value) || 0));
      const sleep = Math.max(0, Number(document.getElementById('fit-sleep').value) || 0);
      const steps = Math.max(0, Math.floor(Number(document.getElementById('fit-steps').value) || 0));
      const notes = document.getElementById('fit-notes').value.trim();

      const weight = weightRaw !== '' ? Number(weightRaw) : 0;

      if (weight === 0 && duration === 0 && sleep === 0 && steps === 0) {
        showToast('Enter at least one metric (Weight, Workout Duration, Sleep, or Steps).', 'error');
        return;
      }

      if (weight > 0 && (weight < 25 || weight > 250)) {
        showToast('Please enter a realistic body weight between 25 kg and 250 kg.', 'error');
        return;
      }

      const state = loadState();
      const entryId = `fit-${Date.now()}`;
      state.fitnessLogs.push({
        id: entryId,
        date,
        weight,
        workoutType: workoutType || (duration > 0 ? 'Strength / Conditioning' : 'Daily Recovery'),
        duration,
        sleep,
        steps,
        notes
      });
      saveState(state);

      let xp = 25;
      if (duration >= 20) xp += 55;
      if (sleep >= 7) xp += 30;
      awardXP(xp, `fit_log_${entryId}`, 'Logged Physical Conditioning Telemetry');

      document.getElementById('fit-workout-type').value = '';
      document.getElementById('fit-duration').value = '';
      document.getElementById('fit-notes').value = '';
      onUpdate();
    });
  }

  const histEl = document.getElementById('fit-history-list');
  if (histEl) {
    histEl.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-del-fit]');
      if (!delBtn) return;
      const id = delBtn.getAttribute('data-del-fit');
      askConfirmation('Delete this fitness telemetry log?', () => {
        const state = loadState();
        state.fitnessLogs = state.fitnessLogs.filter(f => f.id !== id);
        saveState(state);
        showToast('Fitness log deleted.', 'info');
        onUpdate();
      });
    });
  }
}
