# IGRIS V7 — PERSONAL EVOLUTION SYSTEM

A complete, offline-ready, dark-fantasy RPG Progressive Web Application (PWA) built for Android phones using pure HTML5, modular CSS, and Vanilla JavaScript ES Modules.

## Key Capabilities

1. **Hunter Progression & Status Engine**:
   - Formula: `Required XP for Next Level = Current Level × 1,000 XP`.
   - Automatic Rank promotion (`E-Rank` &rarr; `D-Rank` &rarr; `C-Rank` &rarr; `B-Rank` &rarr; `A-Rank` &rarr; `S-Rank`).
   - Four core attributes (`STR`, `VIT`, `INT`, `DISC`) dynamically derived from real logged study hours, NEET syllabus mastery, MCQs, mock tests, workouts, and sleep.
   - Anti-duplicate reward ledger (`rewardLedger`) prevents farming XP by refreshing or re-clicking buttons.

2. **Configurable Daily Quests**:
   - Syncs automatically with your daily Study, MCQ, Workout, Sleep, and Mistake Revision logs.
   - Editable targets and XP rewards, with automatic daily reset based on your local calendar date.

3. **NEET 2027 Syllabus Codex**:
   - Covers Physics, Physical Chemistry, Organic Chemistry, Inorganic Chemistry, Botany, and Zoology.
   - Track chapter status (`Not Started`, `In Progress`, `Completed`), revision toggle, custom MCQ targets, and chapter notes.

4. **MCQ Arena & 720-Mark Mock Test Analytics**:
   - Strict input validation (`Correct Answers <= Attempted Questions` and `PCB Subject Sum == Total Score out of 720`).
   - Dependency-free SVG line and bar charts for score trends and 7-day study hours.

5. **Body & Physical Conditioning**:
   - Beginner-friendly hypertrophy and mobility templates, body weight (`kg`) trend chart, sleep duration, and steps tracking.

6. **Weekly Raid Boss & Shadow Relics (Achievements)**:
   - Weekly challenge (`35h Study`, `700 MCQs`, `3 Workouts` by default, customizable) with a once-per-ISO-week `+500 XP` reward claim.

## Deploying to GitHub Pages (Direct Phone Workflow)

1. Create a new public GitHub repository named `IGRIS-V7`.
2. Upload all files maintaining the exact folder structure (`index.html`, `manifest.webmanifest`, `sw.js`, `css/`, `js/`, `assets/`).
3. Go to **Settings &rarr; Pages** in your repository, select the `main` branch and `/ (root)` folder, and tap **Save**.
4. Open `https://YOUR_USERNAME.github.io/IGRIS-V7/` in Chrome on your Android phone.
5. Tap the Chrome menu (`⋮`) &rarr; **Install app** (or **Add to Home screen**). After the first load, the app works 100% offline.

## Artwork & Audio Note

All artwork and icons in `assets/icons/` and `assets/images/` are 100% original vector SVG files (`.svg`) so you can copy-paste every file directly as text without needing binary image generators. Sound effects are synthesized using the browser's native Web Audio API.
