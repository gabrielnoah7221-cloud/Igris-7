/**
 * IGRIS V7 — LocalStorage Abstraction, Schema Versioning, Default Syllabus & Backup Engine
 */

export const STORAGE_KEY = 'IGRIS_V7_EVOLUTION_STATE';
export const SCHEMA_VERSION = 7;

export function getLocalDateString(dateObj = new Date()) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getISOWeekKey(dateObj = new Date()) {
  const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const DEFAULT_NEET_CHAPTERS = [
  // Physics (20 Core Units)
  { id: 'phy-1', subject: 'Physics', name: 'Units and Measurements', status: 'Not Started', revised: false, targetMcqs: 120, notes: '' },
  { id: 'phy-2', subject: 'Physics', name: 'Kinematics (1D & 2D)', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'phy-3', subject: 'Physics', name: 'Laws of Motion', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'phy-4', subject: 'Physics', name: 'Work, Energy and Power', status: 'Not Started', revised: false, targetMcqs: 150, notes: '' },
  { id: 'phy-5', subject: 'Physics', name: 'Rotational Motion', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'phy-6', subject: 'Physics', name: 'Gravitation', status: 'Not Started', revised: false, targetMcqs: 130, notes: '' },
  { id: 'phy-7', subject: 'Physics', name: 'Properties of Solids and Liquids', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'phy-8', subject: 'Physics', name: 'Thermodynamics & Kinetic Theory', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'phy-9', subject: 'Physics', name: 'Oscillations and Waves', status: 'Not Started', revised: false, targetMcqs: 170, notes: '' },
  { id: 'phy-10', subject: 'Physics', name: 'Electrostatics & Capacitance', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'phy-11', subject: 'Physics', name: 'Current Electricity', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'phy-12', subject: 'Physics', name: 'Magnetic Effects of Current & Magnetism', status: 'Not Started', revised: false, targetMcqs: 190, notes: '' },
  { id: 'phy-13', subject: 'Physics', name: 'EMI and Alternating Current', status: 'Not Started', revised: false, targetMcqs: 170, notes: '' },
  { id: 'phy-14', subject: 'Physics', name: 'Ray and Wave Optics', status: 'Not Started', revised: false, targetMcqs: 240, notes: '' },
  { id: 'phy-15', subject: 'Physics', name: 'Dual Nature, Atoms and Nuclei', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'phy-16', subject: 'Physics', name: 'Semiconductor Electronics', status: 'Not Started', revised: false, targetMcqs: 150, notes: '' },

  // Physical Chemistry
  { id: 'pc-1', subject: 'Physical Chemistry', name: 'Some Basic Concepts of Chemistry (Mole Concept)', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'pc-2', subject: 'Physical Chemistry', name: 'Structure of Atom', status: 'Not Started', revised: false, targetMcqs: 150, notes: '' },
  { id: 'pc-3', subject: 'Physical Chemistry', name: 'Chemical Thermodynamics', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'pc-4', subject: 'Physical Chemistry', name: 'Equilibrium (Chemical & Ionic)', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'pc-5', subject: 'Physical Chemistry', name: 'Redox Reactions and Electrochemistry', status: 'Not Started', revised: false, targetMcqs: 190, notes: '' },
  { id: 'pc-6', subject: 'Physical Chemistry', name: 'Solutions', status: 'Not Started', revised: false, targetMcqs: 150, notes: '' },
  { id: 'pc-7', subject: 'Physical Chemistry', name: 'Chemical Kinetics', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },

  // Inorganic Chemistry
  { id: 'ic-1', subject: 'Inorganic Chemistry', name: 'Classification of Elements & Periodicity', status: 'Not Started', revised: false, targetMcqs: 130, notes: '' },
  { id: 'ic-2', subject: 'Inorganic Chemistry', name: 'Chemical Bonding and Molecular Structure', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'ic-3', subject: 'Inorganic Chemistry', name: 'p-Block Elements', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'ic-4', subject: 'Inorganic Chemistry', name: 'd- and f-Block Elements', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'ic-5', subject: 'Inorganic Chemistry', name: 'Coordination Compounds', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },

  // Organic Chemistry
  { id: 'oc-1', subject: 'Organic Chemistry', name: 'General Organic Chemistry (GOC) & Isomerism', status: 'Not Started', revised: false, targetMcqs: 250, notes: '' },
  { id: 'oc-2', subject: 'Organic Chemistry', name: 'Hydrocarbons', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'oc-3', subject: 'Organic Chemistry', name: 'Haloalkanes and Haloarenes', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'oc-4', subject: 'Organic Chemistry', name: 'Alcohols, Phenols and Ethers', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'oc-5', subject: 'Organic Chemistry', name: 'Aldehydes, Ketones and Carboxylic Acids', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'oc-6', subject: 'Organic Chemistry', name: 'Organic Compounds Containing Nitrogen (Amines)', status: 'Not Started', revised: false, targetMcqs: 150, notes: '' },
  { id: 'oc-7', subject: 'Organic Chemistry', name: 'Biomolecules & Purification', status: 'Not Started', revised: false, targetMcqs: 140, notes: '' },

  // Botany
  { id: 'bot-1', subject: 'Botany', name: 'Cell: The Unit of Life, Cell Cycle & Division', status: 'Not Started', revised: false, targetMcqs: 240, notes: '' },
  { id: 'bot-2', subject: 'Botany', name: 'Biological Classification & Plant Kingdom', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'bot-3', subject: 'Botany', name: 'Morphology & Anatomy of Flowering Plants', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'bot-4', subject: 'Botany', name: 'Photosynthesis & Respiration in Plants', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'bot-5', subject: 'Botany', name: 'Plant Growth and Development', status: 'Not Started', revised: false, targetMcqs: 140, notes: '' },
  { id: 'bot-6', subject: 'Botany', name: 'Sexual Reproduction in Flowering Plants', status: 'Not Started', revised: false, targetMcqs: 180, notes: '' },
  { id: 'bot-7', subject: 'Botany', name: 'Principles of Inheritance & Molecular Basis', status: 'Not Started', revised: false, targetMcqs: 300, notes: '' },
  { id: 'bot-8', subject: 'Botany', name: 'Organisms, Populations, Ecosystem & Biodiversity', status: 'Not Started', revised: false, targetMcqs: 240, notes: '' },

  // Zoology
  { id: 'zoo-1', subject: 'Zoology', name: 'Animal Kingdom & Structural Organisation', status: 'Not Started', revised: false, targetMcqs: 220, notes: '' },
  { id: 'zoo-2', subject: 'Zoology', name: 'Breathing, Body Fluids & Excretory Products', status: 'Not Started', revised: false, targetMcqs: 240, notes: '' },
  { id: 'zoo-3', subject: 'Zoology', name: 'Locomotion, Neural Control & Chemical Coordination', status: 'Not Started', revised: false, targetMcqs: 250, notes: '' },
  { id: 'zoo-4', subject: 'Zoology', name: 'Human Reproduction & Reproductive Health', status: 'Not Started', revised: false, targetMcqs: 200, notes: '' },
  { id: 'zoo-5', subject: 'Zoology', name: 'Evolution', status: 'Not Started', revised: false, targetMcqs: 160, notes: '' },
  { id: 'zoo-6', subject: 'Zoology', name: 'Human Health and Diseases', status: 'Not Started', revised: false, targetMcqs: 190, notes: '' },
  { id: 'zoo-7', subject: 'Zoology', name: 'Biotechnology: Principles, Processes & Applications', status: 'Not Started', revised: false, targetMcqs: 240, notes: '' }
];

export const DEFAULT_QUEST_CONFIG = [
  { id: 'q_study', title: 'Deep Study Protocol', metric: 'studyHours', unit: 'hours', target: 7, xp: 120 },
  { id: 'q_mcqs', title: 'Combat MCQ Barrage', metric: 'mcqs', unit: 'MCQs', target: 160, xp: 120 },
  { id: 'q_workout', title: 'Physical Vessel Conditioning', metric: 'workoutMins', unit: 'mins', target: 30, xp: 80 },
  { id: 'q_sleep', title: 'Neural Recovery Sleep', metric: 'sleepHours', unit: 'hours', target: 7, xp: 60 },
  { id: 'q_revision', title: 'Mistake Codex Revision', metric: 'revisionMins', unit: 'mins', target: 30, xp: 80 }
];

export function createDefaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      name: 'SHADOW HUNTER',
      neetTargetDate: '2027-05-02',
      theme: 'shadow-blue',
      reducedMotion: false,
      soundEnabled: true,
      isDemoMode: false
    },
    progression: {
      xp: 0,
      rewardLedger: {}
    },
    questConfig: JSON.parse(JSON.stringify(DEFAULT_QUEST_CONFIG)),
    questHistory: {},
    studyLogs: [],
    mcqLogs: [],
    mockTests: [],
    fitnessLogs: [],
    chapters: JSON.parse(JSON.stringify(DEFAULT_NEET_CHAPTERS)),
    weeklyBoss: {
      targets: {
        studyHours: 35,
        mcqs: 700,
        workouts: 3
      },
      claimedWeeks: {}
    },
    unlockedAchievements: {}
  };
}

let cachedState = null;
const stateListeners = new Set();

export function loadState() {
  if (cachedState) return cachedState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedState = createDefaultState();
      saveState(cachedState);
      return cachedState;
    }

    const parsed = JSON.parse(raw);
    cachedState = migrateAndValidateState(parsed);
    return cachedState;
  } catch (err) {
    console.error('[IGRIS Storage] Failed to parse saved state, falling back to safe default:', err);
    cachedState = createDefaultState();
    return cachedState;
  }
}

export function migrateAndValidateState(loaded) {
  const defaults = createDefaultState();
  if (!loaded || typeof loaded !== 'object') return defaults;

  const merged = {
    ...defaults,
    ...loaded,
    schemaVersion: SCHEMA_VERSION,
    profile: { ...defaults.profile, ...(loaded.profile || {}) },
    progression: {
      xp: Math.max(0, Number(loaded.progression?.xp) || 0),
      rewardLedger: loaded.progression?.rewardLedger && typeof loaded.progression.rewardLedger === 'object'
        ? loaded.progression.rewardLedger
        : {}
    },
    questConfig: Array.isArray(loaded.questConfig) && loaded.questConfig.length > 0
      ? loaded.questConfig
      : defaults.questConfig,
    questHistory: loaded.questHistory && typeof loaded.questHistory === 'object'
      ? loaded.questHistory
      : {},
    studyLogs: Array.isArray(loaded.studyLogs) ? loaded.studyLogs : [],
    mcqLogs: Array.isArray(loaded.mcqLogs) ? loaded.mcqLogs : [],
    mockTests: Array.isArray(loaded.mockTests) ? loaded.mockTests : [],
    fitnessLogs: Array.isArray(loaded.fitnessLogs) ? loaded.fitnessLogs : [],
    chapters: Array.isArray(loaded.chapters) && loaded.chapters.length > 0
      ? loaded.chapters
      : defaults.chapters,
    weeklyBoss: {
      targets: {
        ...defaults.weeklyBoss.targets,
        ...(loaded.weeklyBoss?.targets || {})
      },
      claimedWeeks: loaded.weeklyBoss?.claimedWeeks && typeof loaded.weeklyBoss.claimedWeeks === 'object'
        ? loaded.weeklyBoss.claimedWeeks
        : {}
    },
    unlockedAchievements: loaded.unlockedAchievements && typeof loaded.unlockedAchievements === 'object'
      ? loaded.unlockedAchievements
      : {}
  };

  return merged;
}

export function saveState(nextState = cachedState) {
  if (!nextState) return false;
  cachedState = nextState;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState));
    notifyStateChange();
    return true;
  } catch (err) {
    console.error('[IGRIS Storage] Unable to write to LocalStorage:', err);
    return false;
  }
}

export function updateState(mutatorFn) {
  const current = loadState();
  mutatorFn(current);
  saveState(current);
  return current;
}

export function subscribeState(listenerFn) {
  stateListeners.add(listenerFn);
  return () => stateListeners.delete(listenerFn);
}

function notifyStateChange() {
  for (const listener of stateListeners) {
    try {
      listener(cachedState);
    } catch (e) {
      console.error('[IGRIS Storage] Listener error:', e);
    }
  }
}

export function resetAllData() {
  cachedState = createDefaultState();
  saveState(cachedState);
  return cachedState;
}

export function loadSampleDemoData() {
  const demo = createDefaultState();
  demo.profile.name = 'IGRIS [DEMO MODE]';
  demo.profile.isDemoMode = true;

  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);

    demo.studyLogs.push({
      id: `demo-study-${i}`,
      date: dateStr,
      subject: i % 2 === 0 ? 'Physics' : 'Botany',
      hours: 6.5 + (i % 3) * 0.5,
      revisionMins: 35,
      notes: 'Demo NCERT + PYQ session'
    });

    demo.mcqLogs.push({
      id: `demo-mcq-${i}`,
      date: dateStr,
      subject: i % 3 === 0 ? 'Physical Chemistry' : 'Physics',
      attempted: 170,
      correct: 148,
      revisionMins: 25,
      topic: 'Demo Timed Practice'
    });

    demo.fitnessLogs.push({
      id: `demo-fit-${i}`,
      date: dateStr,
      weight: Number((64.0 + (6 - i) * 0.15).toFixed(1)),
      workoutType: i % 2 === 0 ? 'Upper Body Foundation' : 'Active Mobility & Walk',
      duration: i % 2 === 0 ? 40 : 30,
      sleep: 7.5,
      steps: 8400,
      notes: 'Demo conditioning log'
    });
  }

  demo.mockTests = [
    { id: 'demo-m1', name: 'Major Test #1 (Demo)', date: getLocalDateString(new Date(today.getTime() - 18 * 86400000)), physics: 145, chemistry: 152, biology: 325, total: 622, notes: 'Good accuracy in Bio' },
    { id: 'demo-m2', name: 'Major Test #2 (Demo)', date: getLocalDateString(new Date(today.getTime() - 10 * 86400000)), physics: 158, chemistry: 160, biology: 335, total: 653, notes: 'Improved Physics speed' },
    { id: 'demo-m3', name: 'Major Test #3 (Demo)', date: getLocalDateString(new Date(today.getTime() - 2 * 86400000)), physics: 165, chemistry: 166, biology: 345, total: 676, notes: 'Strong revision payoff' }
  ];

  demo.chapters[0].status = 'Completed';
  demo.chapters[0].revised = true;
  demo.chapters[1].status = 'Completed';
  demo.chapters[2].status = 'In Progress';
  demo.progression.xp = 3450;

  cachedState = demo;
  saveState(cachedState);
  return cachedState;
}

export function exportBackupJSON() {
  const state = loadState();
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IGRIS-V7-Backup-${getLocalDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportRecordsCSV() {
  const state = loadState();
  const rows = [
    ['RecordType', 'Date', 'Subject_Or_Title', 'PrimaryValue', 'SecondaryValue', 'Notes']
  ];

  state.studyLogs.forEach(s => {
    rows.push(['StudySession', s.date, s.subject, `${s.hours}h`, `${s.revisionMins || 0}m rev`, s.notes || '']);
  });

  state.mcqLogs.forEach(m => {
    rows.push(['MCQSession', m.date, m.subject, `${m.correct}/${m.attempted}`, `${((m.correct / m.attempted) * 100).toFixed(1)}%`, m.topic || '']);
  });

  state.mockTests.forEach(t => {
    rows.push(['MockTest720', t.date, t.name, `${t.total}/720`, `P:${t.physics ?? '-'} C:${t.chemistry ?? '-'} B:${t.biology ?? '-'}`, t.notes || '']);
  });

  const csvContent = rows
    .map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IGRIS-V7-Records-${getLocalDateString()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importBackupJSONFile(file) {
  if (!file) throw new Error('No file selected.');
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Selected file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || (!parsed.profile && !parsed.chapters)) {
    throw new Error('JSON file does not match the IGRIS backup structure.');
  }

  cachedState = migrateAndValidateState(parsed);
  saveState(cachedState);
  return cachedState;
}
