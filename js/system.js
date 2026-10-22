/**
 * IGRIS V7 — XP, Levels, Ranks, Core Attributes, Streaks, Achievements & Synthesized Sound Engine
 */

import { loadState, saveState, getLocalDateString, getISOWeekKey } from './storage.js';

export const RANK_TIERS = [
  { minLevel: 30, rank: 'S-RANK', letter: 'S', title: 'Shadow Monarch' },
  { minLevel: 20, rank: 'A-RANK', letter: 'A', title: 'Shadow Marshal' },
  { minLevel: 12, rank: 'B-RANK', letter: 'B', title: 'Shadow Knight Commander' },
  { minLevel: 7,  rank: 'C-RANK', letter: 'C', title: 'Elite Shadow Blade' },
  { minLevel: 3,  rank: 'D-RANK', letter: 'D', title: 'Awakened Combatant' },
  { minLevel: 1,  rank: 'E-RANK', letter: 'E', title: 'Shadow Initiate' }
];

export const ACHIEVEMENTS_CATALOG = [
  {
    id: 'ach_first_study',
    title: 'First Study Session',
    desc: 'Log your first dedicated study session.',
    check: (state) => state.studyLogs.length >= 1
  },
  {
    id: 'ach_first_100_mcq',
    title: 'First 100 MCQs',
    desc: 'Attempt at least 100 cumulative MCQs.',
    check: (state) => state.mcqLogs.reduce((s, m) => s + (Number(m.attempted) || 0), 0) >= 100
  },
  {
    id: 'ach_1000_mcq',
    title: 'Sniper Precision (1,000 MCQs)',
    desc: 'Complete 1,000 cumulative practice MCQs.',
    check: (state) => state.mcqLogs.reduce((s, m) => s + (Number(m.attempted) || 0), 0) >= 1000
  },
  {
    id: 'ach_first_chapter',
    title: 'First Completed Chapter',
    desc: 'Master and mark 1 NEET syllabus chapter as Completed.',
    check: (state) => state.chapters.some(c => c.status === 'Completed')
  },
  {
    id: 'ach_ten_chapters',
    title: 'Codex Vanguard',
    desc: 'Complete 10 chapters across the NEET syllabus.',
    check: (state) => state.chapters.filter(c => c.status === 'Completed').length >= 10
  },
  {
    id: 'ach_first_mock',
    title: 'First Mock Test',
    desc: 'Record your first 720-mark Mock Exam score.',
    check: (state) => state.mockTests.length >= 1
  },
  {
    id: 'ach_mock_650',
    title: 'AIR Contender (650+ Mock)',
    desc: 'Score 650 or higher out of 720 in a Mock Exam.',
    check: (state) => state.mockTests.some(m => Number(m.total) >= 650)
  },
  {
    id: 'ach_streak_7',
    title: 'Seven-Day Streak',
    desc: 'Maintain a 7-day active discipline streak.',
    check: (state) => calculateStreak(state) >= 7
  },
  {
    id: 'ach_study_beast',
    title: 'Study Beast (50 Hours)',
    desc: 'Accumulate 50+ total logged study hours.',
    check: (state) => state.studyLogs.reduce((s, l) => s + (Number(l.hours) || 0), 0) >= 50
  },
  {
    id: 'ach_fitness_consistency',
    title: 'Fitness Consistency',
    desc: 'Log at least 5 physical conditioning workouts.',
    check: (state) => state.fitnessLogs.filter(f => (Number(f.duration) || 0) >= 15).length >= 5
  },
  {
    id: 'ach_weekly_boss',
    title: 'Weekly Boss Vanquished',
    desc: 'Defeat the Weekly Raid Boss and claim its reward.',
    check: (state) => Object.keys(state.weeklyBoss?.claimedWeeks || {}).length >= 1
  }
];

export const MOTIVATIONAL_QUOTES = [
  '"Discipline is choosing between what you want now and what you want most."',
  '"Every solved MCQ and revised mistake is a blade forged in the dark."',
  '"Do not pray for an easy exam; pray to become an unstoppable combatant."',
  '"Consistency in the shadows creates dominance in the arena."',
  '"When fatigue whispers to stop, your rank demands one more chapter."'
];

/**
 * Derive level & current level progress from total XP.
 * Required XP for level L -> L+1 is L * 1000.
 */
export function deriveLevelInfo(totalXp = 0) {
  let xpRemaining = Math.max(0, Math.floor(Number(totalXp) || 0));
  let level = 1;
  let requiredForNext = level * 1000;

  while (xpRemaining >= requiredForNext) {
    xpRemaining -= requiredForNext;
    level += 1;
    requiredForNext = level * 1000;
  }

  const tier = RANK_TIERS.find(t => level >= t.minLevel) || RANK_TIERS[RANK_TIERS.length - 1];
  const progressPct = Math.min(100, Math.round((xpRemaining / requiredForNext) * 100));

  return {
    level,
    totalXp: Math.max(0, Math.floor(Number(totalXp) || 0)),
    currentLevelXp: xpRemaining,
    requiredForNext,
    xpToNext: requiredForNext - xpRemaining,
    progressPct,
    rank: tier.rank,
    rankLetter: tier.letter,
    title: tier.title
  };
}

/**
 * Award XP once per unique action key to strictly prevent duplicate rewards.
 */
export function awardXP(amount, uniqueKey, reasonLabel = 'System Action') {
  const state = loadState();
  const cleanAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (cleanAmount <= 0) return { awarded: false, leveledUp: false };

  if (uniqueKey && state.progression.rewardLedger[uniqueKey]) {
    return { awarded: false, leveledUp: false, duplicate: true };
  }

  const beforeLvl = deriveLevelInfo(state.progression.xp).level;
  state.progression.xp += cleanAmount;
  if (uniqueKey) {
    state.progression.rewardLedger[uniqueKey] = {
      xp: cleanAmount,
      reason: reasonLabel,
      timestamp: Date.now()
    };
  }

  const afterLvl = deriveLevelInfo(state.progression.xp).level;
  const leveledUp = afterLvl > beforeLvl;

  const newUnlocks = evaluateAchievements(state);
  saveState(state);

  if (leveledUp) {
    playSystemSound('levelup');
    showToast(`LEVEL UP! You reached Level ${afterLvl}!`, 'success');
  } else {
    playSystemSound('xp');
    showToast(`+${cleanAmount} XP — ${reasonLabel}`, 'info');
  }

  newUnlocks.forEach(ach => {
    showToast(`RELIC UNLOCKED: ${ach.title}!`, 'success');
  });

  return { awarded: true, leveledUp, newLevel: afterLvl };
}

/**
 * Calculate consecutive day streak ending today or yesterday based on actual logged activity.
 */
export function calculateStreak(state = loadState()) {
  const activeDates = new Set();

  state.studyLogs.forEach(s => { if ((Number(s.hours) || 0) > 0) activeDates.add(s.date); });
  state.mcqLogs.forEach(m => { if ((Number(m.attempted) || 0) > 0) activeDates.add(m.date); });
  state.fitnessLogs.forEach(f => {
    if ((Number(f.duration) || 0) > 0 || (Number(f.sleep) || 0) > 0) activeDates.add(f.date);
  });
  Object.entries(state.questHistory || {}).forEach(([date, qMap]) => {
    if (qMap && Object.values(qMap).some(Boolean)) activeDates.add(date);
  });

  if (activeDates.size === 0) return 0;

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let cursor = activeDates.has(todayStr)
    ? today
    : activeDates.has(yesterdayStr)
      ? yesterday
      : null;

  if (!cursor) return 0;

  let streak = 0;
  while (true) {
    const dStr = getLocalDateString(cursor);
    if (activeDates.has(dStr)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Derive STR, VIT, INT, DISC from genuine tracked activity.
 */
export function deriveCoreAttributes(state = loadState()) {
  const workoutSessions = state.fitnessLogs.filter(f => (Number(f.duration) || 0) >= 15).length;
  const totalWorkoutMins = state.fitnessLogs.reduce((acc, f) => acc + (Number(f.duration) || 0), 0);
  const highStepDays = state.fitnessLogs.filter(f => (Number(f.steps) || 0) >= 6000).length;
  const str = 10 + (workoutSessions * 2) + Math.floor(totalWorkoutMins / 60) + highStepDays;

  const goodSleepDays = state.fitnessLogs.filter(f => (Number(f.sleep) || 0) >= 7).length;
  const weightLogsCount = state.fitnessLogs.filter(f => (Number(f.weight) || 0) > 0).length;
  const vit = 10 + (goodSleepDays * 2) + Math.floor(weightLogsCount / 2);

  const totalStudyHours = state.studyLogs.reduce((acc, s) => acc + (Number(s.hours) || 0), 0);
  const completedChapters = state.chapters.filter(c => c.status === 'Completed').length;
  const totalCorrectMcqs = state.mcqLogs.reduce((acc, m) => acc + (Number(m.correct) || 0), 0);
  const mocksCount = state.mockTests.length;
  const int = 10 + Math.floor(totalStudyHours / 3) + (completedChapters * 3) + Math.floor(totalCorrectMcqs / 150) + (mocksCount * 2);

  let totalQuestsClaimed = 0;
  Object.values(state.questHistory || {}).forEach(dayObj => {
    totalQuestsClaimed += Object.values(dayObj || {}).filter(Boolean).length;
  });
  const totalRevMins = state.studyLogs.reduce((a, s) => a + (Number(s.revisionMins) || 0), 0) +
                       state.mcqLogs.reduce((a, m) => a + (Number(m.revisionMins) || 0), 0);
  const streak = calculateStreak(state);
  const disc = 10 + totalQuestsClaimed + (streak * 2) + Math.floor(totalRevMins / 45);

  return { STR: str, VIT: vit, INT: int, DISC: disc };
}

/**
 * Aggregate metrics for any local date string (YYYY-MM-DD).
 */
export function getDailyMetrics(dateStr = getLocalDateString(), state = loadState()) {
  const studyHours = state.studyLogs
    .filter(s => s.date === dateStr)
    .reduce((sum, s) => sum + (Number(s.hours) || 0), 0);

  const revisionMinsFromStudy = state.studyLogs
    .filter(s => s.date === dateStr)
    .reduce((sum, s) => sum + (Number(s.revisionMins) || 0), 0);

  const mcqs = state.mcqLogs
    .filter(m => m.date === dateStr)
    .reduce((sum, m) => sum + (Number(m.attempted) || 0), 0);

  const revisionMinsFromMcq = state.mcqLogs
    .filter(m => m.date === dateStr)
    .reduce((sum, m) => sum + (Number(m.revisionMins) || 0), 0);

  const workoutMins = state.fitnessLogs
    .filter(f => f.date === dateStr)
    .reduce((sum, f) => sum + (Number(f.duration) || 0), 0);

  const sleepHours = state.fitnessLogs
    .filter(f => f.date === dateStr)
    .reduce((max, f) => Math.max(max, Number(f.sleep) || 0), 0);

  const steps = state.fitnessLogs
    .filter(f => f.date === dateStr)
    .reduce((max, f) => Math.max(max, Number(f.steps) || 0), 0);

  return {
    studyHours: Number(studyHours.toFixed(2)),
    mcqs,
    workoutMins,
    sleepHours: Number(sleepHours.toFixed(1)),
    revisionMins: revisionMinsFromStudy + revisionMinsFromMcq,
    steps
  };
}

/**
 * Aggregate metrics for the last 7 calendar days (including today).
 */
export function getLast7DaysTelemetry(state = loadState()) {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    const shortLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const metrics = getDailyMetrics(dateStr, state);
    days.push({
      date: dateStr,
      label: shortLabel,
      ...metrics
    });
  }

  const totals = days.reduce((acc, day) => {
    acc.studyHours += day.studyHours;
    acc.mcqs += day.mcqs;
    acc.workoutMins += day.workoutMins;
    acc.workoutsCount += day.workoutMins >= 15 ? 1 : 0;
    acc.sleepDaysCount += day.sleepHours > 0 ? 1 : 0;
    acc.sleepSum += day.sleepHours;
    return acc;
  }, { studyHours: 0, mcqs: 0, workoutMins: 0, workoutsCount: 0, sleepDaysCount: 0, sleepSum: 0 });

  totals.studyHours = Number(totals.studyHours.toFixed(1));
  totals.avgSleep = totals.sleepDaysCount > 0
    ? Number((totals.sleepSum / totals.sleepDaysCount).toFixed(1))
    : 0;

  return { days, totals };
}

/**
 * Weekly Boss status & reward claim logic.
 */
export function getWeeklyBossStatus(state = loadState()) {
  const weekKey = getISOWeekKey();
  const { totals } = getLast7DaysTelemetry(state);
  const targets = state.weeklyBoss.targets;

  const studyPct = Math.min(100, Math.round((totals.studyHours / Math.max(1, targets.studyHours)) * 100));
  const mcqPct = Math.min(100, Math.round((totals.mcqs / Math.max(1, targets.mcqs)) * 100));
  const workoutPct = Math.min(100, Math.round((totals.workoutsCount / Math.max(1, targets.workouts)) * 100));

  const overallDamagePct = Math.round((studyPct + mcqPct + workoutPct) / 3);
  const hpRemainingPct = Math.max(0, 100 - overallDamagePct);
  const allMet = studyPct >= 100 && mcqPct >= 100 && workoutPct >= 100;
  const alreadyClaimed = Boolean(state.weeklyBoss.claimedWeeks[weekKey]);

  return {
    weekKey,
    targets,
    current: {
      studyHours: totals.studyHours,
      mcqs: totals.mcqs,
      workouts: totals.workoutsCount
    },
    percentages: { studyPct, mcqPct, workoutPct },
    overallDamagePct,
    hpRemainingPct,
    allMet,
    alreadyClaimed
  };
}

/**
 * Evaluate and unlock achievements based on real tracked state.
 */
export function evaluateAchievements(state = loadState()) {
  const newlyUnlocked = [];
  for (const item of ACHIEVEMENTS_CATALOG) {
    if (!state.unlockedAchievements[item.id] && item.check(state)) {
      state.unlockedAchievements[item.id] = {
        unlockedAt: getLocalDateString()
      };
      newlyUnlocked.push(item);
    }
  }
  return newlyUnlocked;
}

/**
 * Synthesized Web-Audio API sound feedback (Zero external binary MP3 required).
 */
let audioCtx = null;
export function playSystemSound(type = 'xp') {
  const state = loadState();
  if (!state.profile.soundEnabled) return;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'levelup') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.17);
    }
  } catch {
    // Ignore audio context restrictions if user hasn't interacted yet
  }
}

/**
 * UI Toast Helper
 */
export function showToast(message, variant = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${variant === 'error' ? 'toast-error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}
