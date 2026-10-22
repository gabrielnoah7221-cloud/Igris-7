/**
 * IGRIS V7 — Lightweight Dependency-Free SVG Charting Engine (Theme-Aware)
 */

import { escapeHTML } from './storage.js';

export function renderAttributeRadarSVG(container, attributes) {
  if (!container) return;
  const { STR = 10, VIT = 10, INT = 10, DISC = 10 } = attributes;
  const maxVal = Math.max(30, STR, VIT, INT, DISC);

  const cx = 130;
  const cy = 105;
  const radius = 72;

  const calcPoint = (val, angleDeg) => {
    const ratio = Math.min(1, Math.max(0.15, val / maxVal));
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + radius * ratio * Math.cos(rad);
    const y = cy + radius * ratio * Math.sin(rad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  // Top: INT (-90), Right: STR (0), Bottom: VIT (90), Left: DISC (180)
  const polyPoints = [
    calcPoint(INT, -90),
    calcPoint(STR, 0),
    calcPoint(VIT, 90),
    calcPoint(DISC, 180)
  ].join(' ');

  container.innerHTML = `
    <svg viewBox="0 0 260 210" width="100%" height="200" role="img" aria-label="Attribute Balance Radar Chart">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="rgba(5,12,28,0.7)" stroke="var(--border-subtle)" stroke-width="1"/>
      <circle cx="${cx}" cy="${cy}" r="${radius * 0.66}" fill="none" stroke="var(--border-subtle)" stroke-dasharray="3 3"/>
      <circle cx="${cx}" cy="${cy}" r="${radius * 0.33}" fill="none" stroke="var(--border-subtle)" stroke-dasharray="2 2"/>
      <line x1="${cx}" y1="${cy - radius}" x2="${cx}" y2="${cy + radius}" stroke="var(--border-subtle)"/>
      <line x1="${cx - radius}" y1="${cy}" x2="${cx + radius}" y2="${cy}" stroke="var(--border-subtle)"/>
      <polygon points="${polyPoints}" fill="var(--accent-soft)" stroke="var(--accent-primary)" stroke-width="2"/>
      <text x="${cx}" y="18" text-anchor="middle" fill="#f0f6ff" font-size="11" font-weight="700">INT (${INT})</text>
      <text x="${cx + radius + 34}" y="${cy + 4}" text-anchor="middle" fill="#f0f6ff" font-size="11" font-weight="700">STR (${STR})</text>
      <text x="${cx}" y="${cy + radius + 20}" text-anchor="middle" fill="#f0f6ff" font-size="11" font-weight="700">VIT (${VIT})</text>
      <text x="${cx - radius - 34}" y="${cy + 4}" text-anchor="middle" fill="#f0f6ff" font-size="11" font-weight="700">DISC (${DISC})</text>
    </svg>
  `;
}

export function renderWeeklyBarChartSVG(container, daysData) {
  if (!container) return;
  if (!Array.isArray(daysData) || daysData.length === 0) {
    container.innerHTML = `<p class="text-xs text-muted">No study activity logged yet.</p>`;
    return;
  }

  const maxHours = Math.max(8, ...daysData.map(d => d.studyHours || 0));
  const width = 320;
  const height = 165;
  const chartBottom = 135;
  const chartTop = 22;
  const usableHeight = chartBottom - chartTop;
  const colWidth = width / daysData.length;

  const barsSvg = daysData.map((d, idx) => {
    const val = Number(d.studyHours) || 0;
    const barH = Math.max(3, Math.round((val / maxHours) * usableHeight));
    const x = Math.round(idx * colWidth + colWidth * 0.22);
    const barW = Math.round(colWidth * 0.56);
    const y = chartBottom - barH;

    return `
      <g>
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4"
          fill="${val > 0 ? 'var(--accent-primary)' : 'rgba(58,123,213,0.18)'}" />
        <text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" fill="var(--accent-primary)" font-size="9.5" font-weight="700">
          ${val > 0 ? `${val}h` : ''}
        </text>
        <text x="${x + barW / 2}" y="${height - 10}" text-anchor="middle" fill="#a5b8d8" font-size="10">
          ${escapeHTML(d.label)}
        </text>
      </g>
    `;
  }).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="165" role="img" aria-label="7-Day Study Hours Bar Chart">
      <line x1="10" y1="${chartBottom}" x2="${width - 10}" y2="${chartBottom}" stroke="var(--border-subtle)" stroke-width="1"/>
      ${barsSvg}
    </svg>
  `;
}

export function renderLineTrendSVG(container, points, options = {}) {
  if (!container) return;
  const {
    emptyText = 'Add at least 1 record to generate trend chart.',
    unit = '',
    minY = null,
    maxY = null,
    strokeColor = 'var(--accent-primary)'
  } = options;

  if (!Array.isArray(points) || points.length === 0) {
    container.innerHTML = `<p class="text-xs text-muted">${escapeHTML(emptyText)}</p>`;
    return;
  }

  const recent = points.slice(-10);
  const values = recent.map(p => Number(p.value) || 0);
  const low = minY !== null ? minY : Math.min(...values) * 0.95;
  const high = maxY !== null ? maxY : Math.max(...values, low + 10) * 1.03;
  const range = Math.max(1, high - low);

  const width = 320;
  const height = 165;
  const padX = 28;
  const topY = 26;
  const bottomY = 134;
  const plotW = width - padX * 2;
  const plotH = bottomY - topY;

  const coords = recent.map((pt, i) => {
    const x = recent.length === 1
      ? width / 2
      : padX + (i / (recent.length - 1)) * plotW;
    const norm = Math.min(1, Math.max(0, (pt.value - low) / range));
    const y = bottomY - norm * plotH;
    return { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), label: pt.label, value: pt.value };
  });

  const polylinePts = coords.map(c => `${c.x},${c.y}`).join(' ');

  const circlesSvg = coords.map(c => `
    <g>
      <circle cx="${c.x}" cy="${c.y}" r="4" fill="${strokeColor}" stroke="#04070f" stroke-width="1.5"/>
      <text x="${c.x}" y="${c.y - 8}" text-anchor="middle" fill="#f0f6ff" font-size="9.5" font-weight="700">
        ${c.value}${escapeHTML(unit)}
      </text>
      <text x="${c.x}" y="${height - 10}" text-anchor="middle" fill="#6e84a8" font-size="9">
        ${escapeHTML(c.label)}
      </text>
    </g>
  `).join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="165" role="img" aria-label="Trend Line Chart">
      <line x1="${padX}" y1="${bottomY}" x2="${width - padX}" y2="${bottomY}" stroke="var(--border-subtle)" stroke-width="1"/>
      ${coords.length > 1 ? `<polyline fill="none" stroke="${strokeColor}" stroke-width="2.5" points="${polylinePts}"/>` : ''}
      ${circlesSvg}
    </svg>
  `;
}

