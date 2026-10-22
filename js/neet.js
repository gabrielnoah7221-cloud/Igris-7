/**
 * IGRIS V7 — NEET 2027 Syllabus Codex, Chapter Filtering, Revision & Notes Persistence
 */

import { loadState, saveState, escapeHTML } from './storage.js';
import { awardXP, showToast } from './system.js';
import { openModal, closeModal } from './navigation.js';

const SUBJECT_LIST = [
  'Physics',
  'Physical Chemistry',
  'Organic Chemistry',
  'Inorganic Chemistry',
  'Botany',
  'Zoology'
];

let activeSubjectFilter = 'ALL';
let activeStatusFilter = 'ALL';
let searchQuery = '';

export function renderNeetScreen() {
  const state = loadState();
  const chapters = state.chapters || [];

  // Overall progress
  const totalChaps = chapters.length || 1;
  const completedChaps = chapters.filter(c => c.status === 'Completed').length;
  const overallPct = Math.round((completedChaps / totalChaps) * 100);

  const overallPctEl = document.getElementById('neet-overall-pct');
  const overallBarEl = document.getElementById('neet-overall-bar');
  if (overallPctEl) overallPctEl.textContent = `${overallPct}% Completed (${completedChaps}/${chapters.length})`;
  if (overallBarEl) overallBarEl.style.width = `${overallPct}%`;

  // Subject-wise bars
  const subjBarsContainer = document.getElementById('neet-subject-bars');
  if (subjBarsContainer) {
    subjBarsContainer.innerHTML = SUBJECT_LIST.map(subj => {
      const subChaps = chapters.filter(c => c.subject === subj);
      const subDone = subChaps.filter(c => c.status === 'Completed').length;
      const pct = subChaps.length > 0 ? Math.round((subDone / subChaps.length) * 100) : 0;

      return `
        <div class="subject-stat-card">
          <div class="xp-card-meta mb-1">
            <strong>${escapeHTML(subj)}</strong>
            <span class="text-cyan">${pct}% (${subDone}/${subChaps.length})</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter chapters
  const q = searchQuery.trim().toLowerCase();
  const filtered = chapters.filter(ch => {
    const matchesSubj = activeSubjectFilter === 'ALL' || ch.subject === activeSubjectFilter;
    const matchesStatus = activeStatusFilter === 'ALL' || ch.status === activeStatusFilter;
    const matchesSearch = !q ||
      ch.name.toLowerCase().includes(q) ||
      (ch.notes && ch.notes.toLowerCase().includes(q)) ||
      ch.subject.toLowerCase().includes(q);
    return matchesSubj && matchesStatus && matchesSearch;
  });

  const listContainer = document.getElementById('neet-chapters-container');
  if (!listContainer) return;

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="card"><p class="text-sm text-muted">No chapters match the current filter.</p></div>`;
    return;
  }

  listContainer.innerHTML = filtered.map(ch => {
    const statusClass = ch.status === 'Completed'
      ? 'status-completed'
      : ch.status === 'In Progress'
        ? 'status-in-progress'
        : '';

    return `
      <div class="chapter-card ${statusClass}" data-chapter-id="${escapeHTML(ch.id)}">
        <div class="chapter-header">
          <div>
            <span class="system-label">${escapeHTML(ch.subject)}</span>
            <h4 class="quest-title">${escapeHTML(ch.name)}</h4>
          </div>
          <span class="badge ${ch.status === 'Completed' ? 'badge-success' : 'badge-rank'}">
            ${escapeHTML(ch.status)}
          </span>
        </div>

        <div class="chapter-actions">
          <div>
            <label class="text-xs text-muted block" for="status-sel-${escapeHTML(ch.id)}">Status</label>
            <select id="status-sel-${escapeHTML(ch.id)}" class="form-input" data-chap-status="${escapeHTML(ch.id)}">
              <option value="Not Started" ${ch.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${ch.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${ch.status === 'Completed' ? 'selected' : ''}>Completed (+150 XP)</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-muted block" for="target-mcq-${escapeHTML(ch.id)}">Target MCQs</label>
            <input type="number" id="target-mcq-${escapeHTML(ch.id)}" class="form-input" min="10" max="5000"
              value="${Number(ch.targetMcqs) || 150}" data-chap-target="${escapeHTML(ch.id)}">
          </div>

          <div class="toggle-row" style="padding-top: 16px;">
            <label class="text-xs text-secondary" for="rev-chk-${escapeHTML(ch.id)}">Revised</label>
            <input type="checkbox" id="rev-chk-${escapeHTML(ch.id)}" class="toggle-checkbox"
              data-chap-revised="${escapeHTML(ch.id)}" ${ch.revised ? 'checked' : ''}>
          </div>
        </div>

        <div class="mt-2">
          <label class="sr-only" for="note-inp-${escapeHTML(ch.id)}">Chapter Notes</label>
          <input type="text" id="note-inp-${escapeHTML(ch.id)}" class="form-input"
            placeholder="Add weak topics, formula sheet notes, or PYQ status..."
            value="${escapeHTML(ch.notes || '')}" data-chap-note="${escapeHTML(ch.id)}">
        </div>
      </div>
    `;
  }).join('');
}

export function initNeetEvents(onUpdate) {
  // Search input
  const searchInput = document.getElementById('neet-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value || '';
      renderNeetScreen();
    });
  }

  // Subject filter tabs
  const subjTabs = document.getElementById('neet-subject-tabs');
  if (subjTabs) {
    subjTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-subject]');
      if (!btn) return;
      activeSubjectFilter = btn.getAttribute('data-subject');
      subjTabs.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderNeetScreen();
    });
  }

  // Status filter tabs
  const statusTabs = document.getElementById('neet-status-tabs');
  if (statusTabs) {
    statusTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-status]');
      if (!btn) return;
      activeStatusFilter = btn.getAttribute('data-status');
      statusTabs.querySelectorAll('.pill-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderNeetScreen();
    });
  }

  // Delegated chapter state changes
  const container = document.getElementById('neet-chapters-container');
  if (container) {
    container.addEventListener('change', (e) => {
      const state = loadState();

      const statusSelect = e.target.closest('[data-chap-status]');
      if (statusSelect) {
        const chapId = statusSelect.getAttribute('data-chap-status');
        const chap = state.chapters.find(c => c.id === chapId);
        if (chap) {
          chap.status = statusSelect.value;
          saveState(state);
          if (chap.status === 'Completed') {
            awardXP(150, `chapter_done_${chap.id}`, `Mastered Chapter: ${chap.name}`);
          } else {
            showToast(`Updated "${chap.name}" status to ${chap.status}`, 'info');
          }
          onUpdate();
        }
        return;
      }

      const revCheck = e.target.closest('[data-chap-revised]');
      if (revCheck) {
        const chapId = revCheck.getAttribute('data-chap-revised');
        const chap = state.chapters.find(c => c.id === chapId);
        if (chap) {
          chap.revised = revCheck.checked;
          saveState(state);
          if (chap.revised) {
            awardXP(50, `chapter_rev_${chap.id}`, `Revised Chapter: ${chap.name}`);
          }
          onUpdate();
        }
        return;
      }

      const targetInp = e.target.closest('[data-chap-target]');
      if (targetInp) {
        const chapId = targetInp.getAttribute('data-chap-target');
        const chap = state.chapters.find(c => c.id === chapId);
        const val = Math.max(10, Number(targetInp.value) || 150);
        if (chap) {
          chap.targetMcqs = val;
          saveState(state);
          showToast('Chapter MCQ target saved.', 'info');
        }
        return;
      }

      const noteInp = e.target.closest('[data-chap-note]');
      if (noteInp) {
        const chapId = noteInp.getAttribute('data-chap-note');
        const chap = state.chapters.find(c => c.id === chapId);
        if (chap) {
          chap.notes = noteInp.value.trim();
          saveState(state);
          showToast('Chapter note saved.', 'info');
        }
      }
    });
  }

  // Add Custom Chapter Modal
  const btnAddChap = document.getElementById('btn-add-custom-chapter');
  if (btnAddChap) {
    btnAddChap.addEventListener('click', () => {
      openModal('modal-add-chapter');
    });
  }

  const formAddChap = document.getElementById('form-add-chapter');
  if (formAddChap) {
    formAddChap.addEventListener('submit', (e) => {
      e.preventDefault();
      const subj = document.getElementById('new-chap-subject').value;
      const name = document.getElementById('new-chap-name').value.trim();
      const targetMcqs = Math.max(10, Number(document.getElementById('new-chap-target-mcqs').value) || 150);

      if (!name) {
        showToast('Please enter a chapter title.', 'error');
        return;
      }

      const state = loadState();
      state.chapters.push({
        id: `custom-${Date.now()}`,
        subject: subj,
        name,
        status: 'Not Started',
        revised: false,
        targetMcqs,
        notes: ''
      });
      saveState(state);
      formAddChap.reset();
      closeModal('modal-add-chapter');
      showToast(`Added "${name}" to ${subj}!`, 'info');
      onUpdate();
    });
  }
}
