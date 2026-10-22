/**
 * IGRIS V7 — NEET 720-Mark Mock Test Analytics, PCB Validation, Edit/Delete & Trend Chart
 */

import { loadState, saveState, getLocalDateString, escapeHTML } from './storage.js';
import { awardXP, showToast } from './system.js';
import { renderLineTrendSVG } from './charts.js';
import { askConfirmation } from './navigation.js';

export function renderMocksScreen() {
  const state = loadState();
  const mocks = [...(state.mockTests || [])].sort((a, b) => a.date.localeCompare(b.date));

  const latestEl = document.getElementById('mock-latest-score');
  const highestEl = document.getElementById('mock-highest-score');
  const avgEl = document.getElementById('mock-avg-score');
  const trendEl = document.getElementById('mock-trend-indicator');
  const portalStat = document.getElementById('portal-mock-stat');

  if (mocks.length === 0) {
    if (latestEl) latestEl.textContent = '-- / 720';
    if (highestEl) highestEl.textContent = '-- / 720';
    if (avgEl) avgEl.textContent = '--';
    if (trendEl) trendEl.textContent = 'No Data';
    if (portalStat) portalStat.textContent = 'Score out of 720';
  } else {
    const latest = mocks[mocks.length - 1];
    const highest = Math.max(...mocks.map(m => Number(m.total) || 0));
    const avg = Math.round(mocks.reduce((s, m) => s + (Number(m.total) || 0), 0) / mocks.length);

    if (latestEl) latestEl.textContent = `${latest.total} / 720`;
    if (highestEl) highestEl.textContent = `${highest} / 720`;
    if (avgEl) avgEl.textContent = `${avg} (${((avg / 720) * 100).toFixed(1)}%)`;

    if (mocks.length >= 2) {
      const prev = mocks[mocks.length - 2];
      const diff = latest.total - prev.total;
      const sign = diff >= 0 ? '+' : '';
      if (trendEl) {
        trendEl.textContent = `${sign}${diff} pts`;
        trendEl.className = `telemetry-val ${diff >= 0 ? 'text-success' : 'text-danger'}`;
      }
    } else if (trendEl) {
      trendEl.textContent = 'Baseline';
      trendEl.className = 'telemetry-val text-cyan';
    }

    if (portalStat) {
      portalStat.textContent = `Best: ${highest}/720 • Latest: ${latest.total}`;
    }
  }

  // Render SVG Progression Chart
  const chartContainer = document.getElementById('mock-chart-container');
  const points = mocks.map(m => ({
    label: m.date.slice(5),
    value: Number(m.total) || 0
  }));
  renderLineTrendSVG(chartContainer, points, {
    emptyText: 'Record your first 720 Mock Exam to unlock the score progression chart.',
    unit: '',
    minY: 0,
    maxY: 720
  });

  // Render Archive List (Newest first)
  const histEl = document.getElementById('mock-history-list');
  if (histEl) {
    if (mocks.length === 0) {
      histEl.innerHTML = `<p class="text-xs text-muted">No mock tests recorded yet.</p>`;
    } else {
      const reversed = [...mocks].reverse();
      histEl.innerHTML = reversed.map(m => {
        const pct = ((Number(m.total) / 720) * 100).toFixed(1);
        const hasSubs = m.physics !== null && m.physics !== undefined && m.physics !== '';
        return `
          <div class="history-row">
            <div>
              <strong>${escapeHTML(m.name)} — <span class="text-cyan">${m.total} / 720</span> (${pct}%)</strong>
              <span class="block text-xs text-muted">
                ${escapeHTML(m.date)}
                ${hasSubs ? ` • P: ${m.physics ?? '-'} | C: ${m.chemistry ?? '-'} | B: ${m.biology ?? '-'}` : ''}
                ${m.notes ? ` • ${escapeHTML(m.notes)}` : ''}
              </span>
            </div>
            <div class="form-actions-row">
              <button type="button" class="btn btn-outline btn-sm" data-edit-mock="${escapeHTML(m.id)}">EDIT</button>
              <button type="button" class="btn btn-danger btn-sm" data-del-mock="${escapeHTML(m.id)}">DEL</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

export function initMocksEvents(onUpdate) {
  const dateInp = document.getElementById('mock-date');
  if (dateInp && !dateInp.value) {
    dateInp.value = getLocalDateString();
  }

  const pInp = document.getElementById('mock-physics');
  const cInp = document.getElementById('mock-chemistry');
  const bInp = document.getElementById('mock-biology');
  const totalInp = document.getElementById('mock-total');

  // Auto-calculate total when Physics, Chemistry, Biology are typed
  const autoSumPCB = () => {
    const pRaw = pInp.value.trim();
    const cRaw = cInp.value.trim();
    const bRaw = bInp.value.trim();
    if (pRaw !== '' || cRaw !== '' || bRaw !== '') {
      const sum = (Number(pRaw) || 0) + (Number(cRaw) || 0) + (Number(bRaw) || 0);
      totalInp.value = sum;
    }
  };

  if (pInp && cInp && bInp) {
    pInp.addEventListener('input', autoSumPCB);
    cInp.addEventListener('input', autoSumPCB);
    bInp.addEventListener('input', autoSumPCB);
  }

  const cancelBtn = document.getElementById('mock-cancel-edit-btn');
  const resetMockForm = () => {
    const form = document.getElementById('form-mock-test');
    if (form) form.reset();
    document.getElementById('mock-edit-id').value = '';
    document.getElementById('mock-date').value = getLocalDateString();
    document.getElementById('mock-form-heading').textContent = 'LOG MOCK TEST RESULT';
    document.getElementById('mock-submit-btn').textContent = 'SAVE MOCK RESULT (+150 XP)';
    if (cancelBtn) cancelBtn.hidden = true;
  };

  if (cancelBtn) {
    cancelBtn.addEventListener('click', resetMockForm);
  }

  const form = document.getElementById('form-mock-test');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('mock-edit-id').value.trim();
      const name = document.getElementById('mock-name').value.trim();
      const date = document.getElementById('mock-date').value || getLocalDateString();
      const pRaw = pInp.value.trim();
      const cRaw = cInp.value.trim();
      const bRaw = bInp.value.trim();
      const totalRaw = totalInp.value.trim();
      const notes = document.getElementById('mock-notes').value.trim();

      if (!name) {
        showToast('Please provide a Mock Test Name.', 'error');
        return;
      }

      const hasAnySub = pRaw !== '' || cRaw !== '' || bRaw !== '';
      let pVal = null;
      let cVal = null;
      let bVal = null;

      if (hasAnySub) {
        pVal = Number(pRaw || 0);
        cVal = Number(cRaw || 0);
        bVal = Number(bRaw || 0);

        if (pVal < -45 || pVal > 180) {
          showToast('Physics score must be between -45 and 180.', 'error');
          return;
        }
        if (cVal < -45 || cVal > 180) {
          showToast('Chemistry score must be between -45 and 180.', 'error');
          return;
        }
        if (bVal < -90 || bVal > 360) {
          showToast('Biology score must be between -90 and 360.', 'error');
          return;
        }
      }

      const totalVal = Number(totalRaw);
      if (totalRaw === '' || !Number.isFinite(totalVal) || totalVal < -180 || totalVal > 720) {
        showToast('Total score must be a valid number between -180 and 720.', 'error');
        return;
      }

      if (hasAnySub && (pVal + cVal + bVal) !== totalVal) {
        showToast(`Subject sum (${pVal + cVal + bVal}) does not match Total Score (${totalVal}). Adjusted total to match.`, 'error');
        totalInp.value = pVal + cVal + bVal;
        return;
      }

      const state = loadState();
      if (editId) {
        const existing = state.mockTests.find(m => m.id === editId);
        if (existing) {
          existing.name = name;
          existing.date = date;
          existing.physics = pVal;
          existing.chemistry = cVal;
          existing.biology = bVal;
          existing.total = totalVal;
          existing.notes = notes;
          saveState(state);
          showToast('Mock exam record updated!', 'info');
        }
      } else {
        const newId = `mock-${Date.now()}`;
        state.mockTests.push({
          id: newId,
          name,
          date,
          physics: pVal,
          chemistry: cVal,
          biology: bVal,
          total: totalVal,
          notes
        });
        saveState(state);
        awardXP(150, `mock_completed_${newId}`, `Mock Test Logged: ${name} (${totalVal}/720)`);
      }

      resetMockForm();
      onUpdate();
    });
  }

  // Edit / Delete listeners
  const histEl = document.getElementById('mock-history-list');
  if (histEl) {
    histEl.addEventListener('click', (e) => {
      const editBtn = e.target.closest('[data-edit-mock]');
      if (editBtn) {
        const id = editBtn.getAttribute('data-edit-mock');
        const state = loadState();
        const item = state.mockTests.find(m => m.id === id);
        if (!item) return;

        document.getElementById('mock-edit-id').value = item.id;
        document.getElementById('mock-name').value = item.name;
        document.getElementById('mock-date').value = item.date;
        pInp.value = item.physics ?? '';
        cInp.value = item.chemistry ?? '';
        bInp.value = item.biology ?? '';
        totalInp.value = item.total;
        document.getElementById('mock-notes').value = item.notes || '';

        document.getElementById('mock-form-heading').textContent = 'EDIT MOCK TEST RECORD';
        document.getElementById('mock-submit-btn').textContent = 'UPDATE MOCK RECORD';
        if (cancelBtn) cancelBtn.hidden = false;
        form.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      const delBtn = e.target.closest('[data-del-mock]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-del-mock');
        askConfirmation('Delete this Mock Exam score permanently?', () => {
          const state = loadState();
          state.mockTests = state.mockTests.filter(m => m.id !== id);
          saveState(state);
          showToast('Mock exam record deleted.', 'info');
          onUpdate();
        });
      }
    });
  }
}
