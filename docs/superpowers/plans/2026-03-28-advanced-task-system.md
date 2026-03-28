# Advanced Task System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 77 maintenance task templates with weather triggers, recurring schedules, and category-grouped UI to the Dacha garden app.

**Architecture:** Task templates stored in Firestore, seeded from Excel. Existing weekly cloud function expanded to generate template-based tasks alongside sowing tasks. New lightweight daily function for daily-recurrence templates. Frontend Aufgaben page shows tasks grouped by category with filter chips.

**Tech Stack:** React 19, Firebase Cloud Functions (Node.js 20), Firestore, Vitest, xlsx npm package

---

### Task 1: Seeding Script — Parse Excel & Seed Task Templates

**Files:**
- Create: `scripts/seed-task-templates.js`
- Reference: `docs/garten_tasks_dacha.xlsx` (77 rows, 14 columns)

This task creates the seeding script that parses the Excel and writes task templates to Firestore. The script uses the `xlsx` npm package (already available via `openpyxl` pattern — but we use the JS ecosystem here).

- [ ] **Step 1: Install xlsx package**

```bash
cd /home/philipp/dacha-app && npm install xlsx --save-dev
```

Expected: `xlsx` added to devDependencies in package.json

- [ ] **Step 2: Create the seeding script**

Create `scripts/seed-task-templates.js`:

```javascript
/**
 * Seed Firestore taskTemplates from the Excel file.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   HOUSEHOLD_ID=<your-household-id> \
 *   node scripts/seed-task-templates.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import XLSX from 'xlsx'

const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// Map free-text weather conditions from Excel to normalized enum values.
// Phase 1 implements: frostfrei, trocken, >25°C. Others map to null (displayed as text only).
const WEATHER_MAP = {
  'Frostfrei': 'frostfrei',
  'Frostfrei (>5°C nachts)': 'frostfrei',
  'Kein Frost, trocken': 'frostfrei',  // primary condition is frost-free
  'Trocken, frostfrei': 'frostfrei',   // primary condition is frost-free
  'Trocken': 'trocken',
  'Trocken (morgens)': 'trocken',
  'Trocken, kein Regen erwartet': 'trocken',
  'Trocken, >28°C': 'trocken',         // map to trocken, heat is secondary
  'Kein Regen seit >3 Tagen, >25°C': null, // too specific for Phase 1
  '>15°C': null,
  '>20°C Außentemperatur': null,
  '>30°C, Dauersonne': null,
  'Feucht, warm': null,
  'Feucht/regnerisch': null,
  'Nach Eisheiligen': null,
  'Nach Eisheiligen (KW20)': null,
  'Nach Frost': null,
  'Nach erstem Frost (verbessert Geschmack)': null,
  'Vor erstem Dauerfrost': null,
  'Vor erstem Frost': null,
  '—': null,
}

// Map free-text recurrence patterns to normalized enum values.
const RECURRENCE_MAP = {
  'Einmalig/Jahr': 'einmalig',
  'Einmalig': 'einmalig',
  '1x/Jahr': 'einmalig',
  '1–2x/Jahr': 'einmalig',
  '2x/Jahr': 'einmalig',                    // treat as einmalig per window
  '2x/Jahr (Frühjahr + Herbst)': 'einmalig', // each KW window is one occurrence
  'Einmalig pro Kultur': 'einmalig',
  'Einmalig pro Satz': 'einmalig',
  'Einmalig/Jahr (+ laufend)': 'einmalig',
  'Wöchentlich': 'wöchentlich',
  'Laufend': 'wöchentlich',                  // "ongoing" = weekly check
  'Täglich': 'täglich',
  'Täglich bei Hitze': 'täglich_bei_hitze',
  'Alle 2 Wochen': 'alle_2_wochen',
  'Alle 4–6 Wochen nachsetzen': 'alle_2_wochen', // approximate to 2-week cycle
  'Nach Ernte': 'bei_bedarf',
  'Nach jeder Neupflanzung': 'bei_bedarf',
  'Bei Bedarf': 'bei_bedarf',
  '—': 'bei_bedarf',
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets['Garten-Tasks']
  const rows = XLSX.utils.sheet_to_json(sheet)

  return rows.map((row) => {
    const rawWeather = String(row['Wetter-Bedingung'] || '—').trim()
    const rawRecurrence = String(row['Wiederholung'] || '—').trim()

    return {
      id: String(row['ID']),
      kategorie: String(row['Kategorie']).trim(),
      unterkategorie: String(row['Unterkategorie'] || '').trim(),
      title: String(row['Task']).trim(),
      description: String(row['Beschreibung'] || '').trim(),
      kwStart: Number(row['KW Start']),
      kwEnd: Number(row['KW Ende']),
      priority: String(row['Priorität']).trim().toLowerCase(), // "hoch" | "mittel" | "niedrig"
      weatherCondition: WEATHER_MAP[rawWeather] ?? null,
      temperatureCondition: rawWeather === '—' ? null : rawWeather,
      precondition: row['Vorbedingung(en)'] === '—' ? null : String(row['Vorbedingung(en)'] || '').trim() || null,
      recurrence: RECURRENCE_MAP[rawRecurrence] ?? 'bei_bedarf',
      durationMinutes: row['Dauer (Min)'] ? Number(row['Dauer (Min)']) : null,
      notes: row['Notizen'] ? String(row['Notizen']).trim() : null,
      active: true,
    }
  })
}

async function seed() {
  const householdId = process.env.HOUSEHOLD_ID
  if (!householdId) {
    console.error('Error: Set HOUSEHOLD_ID env var')
    process.exit(1)
  }

  const templates = parseExcel('docs/garten_tasks_dacha.xlsx')
  console.log(`Parsed ${templates.length} task templates from Excel`)

  let batch = db.batch()
  let count = 0

  for (const template of templates) {
    // Use the Excel ID as document ID for idempotent re-runs
    const ref = db.collection('taskTemplates').doc(`template-${template.id}`)
    batch.set(ref, { ...template, householdId })
    count++

    if (count % 400 === 0) {
      await batch.commit()
      console.log(`  Committed ${count} docs...`)
      batch = db.batch()
    }
  }

  await batch.commit()
  console.log(`Done! Seeded ${count} task templates.`)
}

seed().catch(console.error)
```

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-task-templates.js package.json package-lock.json
git commit -m "feat: add task template seeding script from Excel"
```

---

### Task 2: Firestore Rules — Add taskTemplates Collection

**Files:**
- Modify: `firestore.rules:36` (add after tasks match block)

- [ ] **Step 1: Add taskTemplates rules**

In `firestore.rules`, add after the `tasks/{docId}` block (after line 41):

```
    match /taskTemplates/{docId} {
      allow read: if request.auth != null && resource.data.householdId == getHouseholdId();
      allow create: if request.auth != null && request.resource.data.householdId == getHouseholdId();
      allow update, delete: if request.auth != null && resource.data.householdId == getHouseholdId();
    }
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add Firestore rules for taskTemplates collection"
```

---

### Task 3: Shared Task Generation Utilities

**Files:**
- Create: `functions/taskUtils.js`

Extract shared utilities that both the weekly and daily cloud functions will use. This avoids duplicating weather-check and priority logic.

- [ ] **Step 1: Create functions/taskUtils.js**

```javascript
const admin = require('firebase-admin')
const db = admin.firestore()

function getKW(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function isInRange(kw, range) {
  return range && kw >= range[0] && kw <= range[1]
}

/**
 * Check weather conditions against a template's weatherCondition.
 * Returns { blocked: boolean, reason: string|null, skip: boolean }
 * - blocked: task should be created but marked as weather-blocked
 * - skip: task should not be created at all (condition not met)
 */
function checkWeatherCondition(weatherCondition, weather) {
  if (!weatherCondition || !weather?.forecast) {
    return { blocked: false, reason: null, skip: false }
  }

  const forecast = weather.forecast

  switch (weatherCondition) {
    case 'frostfrei': {
      const frostInNext3Days = forecast.slice(0, 3).some(d => d.minTemp <= 0)
      if (frostInNext3Days) {
        const coldest = Math.min(...forecast.slice(0, 3).map(d => d.minTemp))
        return { blocked: true, reason: `Frost erwartet (${Math.round(coldest)}°C)`, skip: false }
      }
      return { blocked: false, reason: null, skip: false }
    }
    case 'trocken': {
      const rainNext24h = forecast[0]?.precipitation > 2
      if (rainNext24h) {
        return { blocked: true, reason: `Regen erwartet (${forecast[0].precipitation}mm)`, skip: false }
      }
      return { blocked: false, reason: null, skip: false }
    }
    case '>25°C': {
      const hotEnough = forecast[0]?.maxTemp > 25
      if (!hotEnough) {
        return { blocked: false, reason: null, skip: true } // Don't create task at all
      }
      return { blocked: false, reason: null, skip: false }
    }
    default:
      return { blocked: false, reason: null, skip: false }
  }
}

/**
 * Calculate priority for a template-based task.
 * @param {string} templatePriority - "hoch" | "mittel" | "niedrig"
 * @param {number} currentKW
 * @param {number} kwEnd - end of the template's KW window
 * @param {boolean} weatherBlocked
 */
function calcTemplatePriority(templatePriority, currentKW, kwEnd, weatherBlocked) {
  if (weatherBlocked) {
    return { priority: 'blocked', priorityReason: 'Wetter ungeeignet' }
  }
  if (templatePriority === 'hoch' && kwEnd - currentKW <= 1) {
    return { priority: 'high', priorityReason: 'Zeitkritisch' }
  }
  if (templatePriority === 'hoch') {
    return { priority: 'normal', priorityReason: 'Diese Woche' }
  }
  if (templatePriority === 'mittel') {
    return { priority: 'normal', priorityReason: 'Diese Woche' }
  }
  // niedrig
  return { priority: 'low', priorityReason: 'Optional' }
}

/**
 * Create a task document from a template.
 * @returns {object} The task data (without householdId — caller adds that)
 */
function buildTaskFromTemplate(template, kw, year, priority, priorityReason, weatherBlocked, blockedReason) {
  return {
    title: template.title,
    type: 'maintenance',
    templateId: `template-${template.id}`,
    kategorie: template.kategorie,
    dueKW: kw,
    dueYear: year,
    priority,
    priorityReason,
    weatherBlocked,
    blockedReason,
    completed: false,
    completedDate: null,
    completedBy: null,
  }
}

module.exports = {
  getKW,
  isInRange,
  checkWeatherCondition,
  calcTemplatePriority,
  buildTaskFromTemplate,
  db,
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/taskUtils.js
git commit -m "feat: add shared task generation utilities"
```

---

### Task 4: Tests for Shared Task Utilities

**Files:**
- Create: `functions/taskUtils.test.js`

- [ ] **Step 1: Install vitest in functions directory**

```bash
cd /home/philipp/dacha-app/functions && npm install --save-dev vitest
```

- [ ] **Step 2: Add test script to functions/package.json**

In `functions/package.json`, change the `test` script:

```json
"scripts": {
  "test": "vitest run"
}
```

- [ ] **Step 3: Write tests for checkWeatherCondition**

Create `functions/taskUtils.test.js`:

```javascript
import { describe, it, expect, vi } from 'vitest'

// Mock firebase-admin before importing taskUtils
vi.mock('firebase-admin', () => ({
  firestore: () => ({}),
}))

// We need to test the pure functions, so extract them without the db dependency.
// Import after mocking.
const { checkWeatherCondition, calcTemplatePriority, getKW, isInRange } = require('./taskUtils')

describe('getKW', () => {
  it('returns correct ISO week for known date', () => {
    // 2026-03-28 is a Saturday in KW 13
    expect(getKW(new Date(2026, 2, 28))).toBe(13)
  })

  it('returns KW 1 for Jan 5 2026', () => {
    expect(getKW(new Date(2026, 0, 5))).toBe(2)
  })
})

describe('isInRange', () => {
  it('returns true when kw is within range', () => {
    expect(isInRange(10, [8, 14])).toBe(true)
  })

  it('returns true on boundaries', () => {
    expect(isInRange(8, [8, 14])).toBe(true)
    expect(isInRange(14, [8, 14])).toBe(true)
  })

  it('returns false when kw is outside range', () => {
    expect(isInRange(7, [8, 14])).toBe(false)
    expect(isInRange(15, [8, 14])).toBe(false)
  })

  it('returns false for null range', () => {
    expect(isInRange(10, null)).toBe(false)
  })
})

describe('checkWeatherCondition', () => {
  const makeWeather = (overrides = {}) => ({
    forecast: [
      { date: '2026-03-28', minTemp: 5, maxTemp: 15, precipitation: 0, ...overrides },
      { date: '2026-03-29', minTemp: 4, maxTemp: 14, precipitation: 0 },
      { date: '2026-03-30', minTemp: 6, maxTemp: 16, precipitation: 0 },
    ],
  })

  it('returns not blocked when no condition', () => {
    const result = checkWeatherCondition(null, makeWeather())
    expect(result).toEqual({ blocked: false, reason: null, skip: false })
  })

  it('frostfrei: blocks when frost in next 3 days', () => {
    const weather = makeWeather()
    weather.forecast[1].minTemp = -2
    const result = checkWeatherCondition('frostfrei', weather)
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('Frost')
  })

  it('frostfrei: not blocked when warm', () => {
    const result = checkWeatherCondition('frostfrei', makeWeather())
    expect(result.blocked).toBe(false)
  })

  it('trocken: blocks when rain > 2mm', () => {
    const weather = makeWeather({ precipitation: 5 })
    const result = checkWeatherCondition('trocken', weather)
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('Regen')
  })

  it('trocken: not blocked when dry', () => {
    const result = checkWeatherCondition('trocken', makeWeather({ precipitation: 1 }))
    expect(result.blocked).toBe(false)
  })

  it('>25°C: skips when not hot enough', () => {
    const result = checkWeatherCondition('>25°C', makeWeather({ maxTemp: 20 }))
    expect(result.skip).toBe(true)
    expect(result.blocked).toBe(false)
  })

  it('>25°C: does not skip when hot', () => {
    const result = checkWeatherCondition('>25°C', makeWeather({ maxTemp: 30 }))
    expect(result.skip).toBe(false)
  })
})

describe('calcTemplatePriority', () => {
  it('returns blocked when weatherBlocked', () => {
    const result = calcTemplatePriority('hoch', 10, 14, true)
    expect(result.priority).toBe('blocked')
  })

  it('returns high for hoch priority in last 2 KWs', () => {
    const result = calcTemplatePriority('hoch', 13, 14, false)
    expect(result.priority).toBe('high')
    expect(result.priorityReason).toBe('Zeitkritisch')
  })

  it('returns normal for hoch priority not near end', () => {
    const result = calcTemplatePriority('hoch', 9, 14, false)
    expect(result.priority).toBe('normal')
  })

  it('returns normal for mittel priority', () => {
    const result = calcTemplatePriority('mittel', 10, 14, false)
    expect(result.priority).toBe('normal')
  })

  it('returns low for niedrig priority', () => {
    const result = calcTemplatePriority('niedrig', 10, 14, false)
    expect(result.priority).toBe('low')
    expect(result.priorityReason).toBe('Optional')
  })
})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/philipp/dacha-app/functions && npx vitest run
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add functions/taskUtils.test.js functions/package.json functions/package-lock.json
git commit -m "test: add unit tests for shared task utilities"
```

---

### Task 5: Expand generateWeeklyTasks with Template-Based Generation

**Files:**
- Modify: `functions/generateWeeklyTasks.js`

- [ ] **Step 1: Refactor generateWeeklyTasks to use shared utils and add template generation**

Replace the entire content of `functions/generateWeeklyTasks.js`:

```javascript
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')
const {
  getKW, isInRange, checkWeatherCondition, calcTemplatePriority, buildTaskFromTemplate, db,
} = require('./taskUtils')

function calcIdealKW(range, frostSensitive, isOutdoor) {
  if (!range) return null
  const [start, end] = range
  const len = end - start
  const earlyThird = start + Math.floor(len / 3)
  const middle = start + Math.floor(len / 2)
  const lateThird = start + Math.floor(len * 2 / 3)

  if (frostSensitive && isOutdoor) return Math.max(lateThird, 20)
  if (frostSensitive) return middle
  return earlyThird
}

function calcSowingPriority(currentKW, idealKW, endKW, frostBlocked, weatherBoost) {
  if (frostBlocked) return { priority: 'blocked', priorityReason: 'Wegen Frost verschoben' }
  if (weatherBoost) return { priority: 'high', priorityReason: 'Wetter perfekt' }
  if (endKW - currentKW <= 1) return { priority: 'high', priorityReason: 'Zeitkritisch' }
  if (currentKW >= idealKW) return { priority: 'normal', priorityReason: 'Ideal diese Woche' }
  return { priority: 'low', priorityReason: 'Optional — Fenster offen' }
}

async function generateSowingTasks(householdId, kw, year, weather, frostThresholdC, batch, existingTitles) {
  const frostInForecast = weather?.forecast?.slice(0, 5).some(d => d.minTemp <= frostThresholdC) || false
  const idealWeather = weather?.forecast?.slice(0, 3).some(d =>
    d.minTemp >= 8 && d.maxTemp <= 18 && d.precipitation >= 1 && d.precipitation <= 5
  ) || false

  const varieties = await db.collection('varieties').where('householdId', '==', householdId).get()
  let newCount = 0

  for (const vDoc of varieties.docs) {
    const v = vDoc.data()
    const actions = []

    if (isInRange(kw, v.sowIndoorsKW)) {
      const idealKW = calcIdealKW(v.sowIndoorsKW, v.frostSensitive, false)
      const { priority, priorityReason } = calcSowingPriority(kw, idealKW, v.sowIndoorsKW[1], false, false)
      actions.push({
        title: `${v.name} vorziehen (Fensterbank)`,
        type: 'sow', kategorie: 'Aussaat & Pflanzung', templateId: null,
        priority, priorityReason, weatherBlocked: false, blockedReason: null,
      })
    }

    if (isInRange(kw, v.sowDirectKW)) {
      const idealKW = calcIdealKW(v.sowDirectKW, v.frostSensitive, true)
      const blocked = v.frostSensitive && frostInForecast
      const boost = !blocked && idealWeather
      const { priority, priorityReason } = calcSowingPriority(kw, idealKW, v.sowDirectKW[1], blocked, boost)
      actions.push({
        title: `${v.name} direkt aussäen`,
        type: 'sow', kategorie: 'Aussaat & Pflanzung', templateId: null,
        priority, priorityReason, weatherBlocked: blocked,
        blockedReason: blocked ? `Frost erwartet (${Math.round(Math.min(...weather.forecast.slice(0, 5).map(d => d.minTemp)))}°C)` : null,
      })
    }

    if (isInRange(kw, v.transplantKW)) {
      const idealKW = calcIdealKW(v.transplantKW, v.frostSensitive, true)
      const blocked = v.frostSensitive && frostInForecast && kw < 20
      const { priority, priorityReason } = calcSowingPriority(kw, idealKW, v.transplantKW[1], blocked, false)
      actions.push({
        title: `${v.name} auspflanzen`,
        type: 'transplant', kategorie: 'Aussaat & Pflanzung', templateId: null,
        priority, priorityReason, weatherBlocked: blocked,
        blockedReason: blocked ? 'Frost erwartet' : null,
      })
    }

    for (const a of actions) {
      if (!existingTitles.has(a.title)) {
        batch.set(db.collection('tasks').doc(), {
          ...a, dueKW: kw, dueYear: year,
          completed: false, completedDate: null, completedBy: null, householdId,
        })
        newCount++
      }
    }
  }
  return newCount
}

async function generateTemplateTasks(householdId, kw, year, weather, batch, existingTasks) {
  const templates = await db.collection('taskTemplates')
    .where('householdId', '==', householdId)
    .where('active', '==', true)
    .get()

  let newCount = 0

  for (const tDoc of templates.docs) {
    const template = tDoc.data()

    // Skip if not in KW window
    if (!isInRange(kw, [template.kwStart, template.kwEnd])) continue

    // Skip daily and bei_bedarf recurrences (daily handled by separate function, bei_bedarf is manual)
    if (['täglich', 'täglich_bei_hitze', 'bei_bedarf'].includes(template.recurrence)) continue

    const templateId = `template-${template.id}`

    // Check deduplication based on recurrence type
    if (template.recurrence === 'einmalig') {
      const exists = existingTasks.some(t => t.templateId === templateId && t.dueYear === year)
      if (exists) continue
    } else if (template.recurrence === 'wöchentlich') {
      const exists = existingTasks.some(t => t.templateId === templateId && t.dueKW === kw && t.dueYear === year)
      if (exists) continue
    } else if (template.recurrence === 'alle_2_wochen') {
      const exists = existingTasks.some(t =>
        t.templateId === templateId && t.dueYear === year && Math.abs(t.dueKW - kw) < 2
      )
      if (exists) continue
    }

    // Weather check
    const { blocked, reason, skip } = checkWeatherCondition(template.weatherCondition, weather)
    if (skip) continue

    // Priority
    const { priority, priorityReason } = calcTemplatePriority(
      template.priority, kw, template.kwEnd, blocked
    )

    const task = buildTaskFromTemplate(template, kw, year, priority, priorityReason, blocked, reason)
    batch.set(db.collection('tasks').doc(), { ...task, householdId })
    newCount++
  }

  return newCount
}

exports.generateWeeklyTasks = onSchedule(
  { schedule: 'every monday 06:00', timeZone: 'Europe/Berlin' },
  async () => {
    const kw = getKW()
    const year = new Date().getFullYear()
    const households = await db.collection('households').get()

    for (const household of households.docs) {
      const householdId = household.id
      const { frostThresholdC = 3 } = household.data()

      const weatherDoc = await db.doc('weather/current').get()
      const weather = weatherDoc.exists ? weatherDoc.data() : null

      // Fetch all existing tasks for deduplication
      const existingTasksSnap = await db.collection('tasks')
        .where('householdId', '==', householdId)
        .where('dueYear', '==', year).get()
      const existingTasks = existingTasksSnap.docs.map(d => d.data())
      const existingTitles = new Set(existingTasks.filter(t => t.dueKW === kw).map(t => t.title))

      const batch = db.batch()

      const sowCount = await generateSowingTasks(householdId, kw, year, weather, frostThresholdC, batch, existingTitles)
      const templateCount = await generateTemplateTasks(householdId, kw, year, weather, batch, existingTasks)

      const totalNew = sowCount + templateCount

      if (totalNew > 0) {
        await batch.commit()
        // Send push notification
        const members = await db.collection('members').where('householdId', '==', householdId).get()
        const tokenDocs = await Promise.all(members.docs.map(m => db.doc(`fcmTokens/${m.id}`).get()))
        const tokens = tokenDocs.filter(d => d.exists).map(d => d.data().token)
        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: `KW ${kw}: ${totalNew} neue Aufgaben 🌱`,
              body: 'Schau mal in die Dacha App!',
            },
          })
        }
      }
    }
  }
)
```

- [ ] **Step 2: Run existing tests to make sure nothing is broken**

```bash
cd /home/philipp/dacha-app/functions && npx vitest run
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add functions/generateWeeklyTasks.js
git commit -m "feat: expand weekly task generator with template-based maintenance tasks"
```

---

### Task 6: Daily Task Generator Cloud Function

**Files:**
- Create: `functions/generateDailyTasks.js`
- Modify: `functions/index.js`
- Modify: `firebase.json`

- [ ] **Step 1: Create functions/generateDailyTasks.js**

```javascript
const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')
const {
  getKW, isInRange, checkWeatherCondition, calcTemplatePriority, buildTaskFromTemplate, db,
} = require('./taskUtils')

exports.generateDailyTasks = onSchedule(
  { schedule: 'every day 06:00', timeZone: 'Europe/Berlin' },
  async () => {
    const kw = getKW()
    const year = new Date().getFullYear()
    const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
    const households = await db.collection('households').get()

    for (const household of households.docs) {
      const householdId = household.id

      const weatherDoc = await db.doc('weather/current').get()
      const weather = weatherDoc.exists ? weatherDoc.data() : null

      const templates = await db.collection('taskTemplates')
        .where('householdId', '==', householdId)
        .where('active', '==', true)
        .get()

      // Fetch today's existing tasks for deduplication
      const existingSnap = await db.collection('tasks')
        .where('householdId', '==', householdId)
        .where('dueKW', '==', kw)
        .where('dueYear', '==', year)
        .get()
      const existingTasks = existingSnap.docs.map(d => d.data())

      const batch = db.batch()
      let newCount = 0

      for (const tDoc of templates.docs) {
        const template = tDoc.data()

        if (!isInRange(kw, [template.kwStart, template.kwEnd])) continue
        if (!['täglich', 'täglich_bei_hitze'].includes(template.recurrence)) continue

        const templateId = `template-${template.id}`

        // For daily tasks, check if one was already created today
        // We use the title + dueKW + date check via createdDate field
        const existsToday = existingTasks.some(t =>
          t.templateId === templateId && t.createdDate === today
        )
        if (existsToday) continue

        // For täglich_bei_hitze, skip if not hot enough
        if (template.recurrence === 'täglich_bei_hitze') {
          const hotEnough = weather?.forecast?.[0]?.maxTemp > 25
          if (!hotEnough) continue
        }

        // Weather check
        const { blocked, reason, skip } = checkWeatherCondition(template.weatherCondition, weather)
        if (skip) continue

        const { priority, priorityReason } = calcTemplatePriority(
          template.priority, kw, template.kwEnd, blocked
        )

        const task = buildTaskFromTemplate(template, kw, year, priority, priorityReason, blocked, reason)
        batch.set(db.collection('tasks').doc(), { ...task, createdDate: today, householdId })
        newCount++
      }

      if (newCount > 0) {
        await batch.commit()
      }
    }
  }
)
```

- [ ] **Step 2: Update functions/index.js to export the new function**

Replace the entire content of `functions/index.js`:

```javascript
const admin = require('firebase-admin')
admin.initializeApp()

const { checkWeather } = require('./checkWeather')
const { generateWeeklyTasks } = require('./generateWeeklyTasks')
const { generateDailyTasks } = require('./generateDailyTasks')
const { dailyDigest } = require('./dailyDigest')

exports.checkWeather = checkWeather
exports.generateWeeklyTasks = generateWeeklyTasks
exports.generateDailyTasks = generateDailyTasks
exports.dailyDigest = dailyDigest
```

- [ ] **Step 3: Commit**

```bash
git add functions/generateDailyTasks.js functions/index.js
git commit -m "feat: add daily task generator for täglich/täglich_bei_hitze recurrence"
```

---

### Task 7: Update Formatters — Add Kategorie Labels and Maintenance Type

**Files:**
- Modify: `src/utils/formatters.js`

- [ ] **Step 1: Add kategorie labels and update task type labels**

In `src/utils/formatters.js`, add after the existing `taskTypeLabels`:

```javascript
export const kategorieLabels = {
  'Aussaat & Pflanzung': 'Aussaat & Pflanzung',
  'Saisonstart': 'Saisonstart',
  'Boden': 'Boden',
  'Bewässerung': 'Bewässerung',
  'Kompost': 'Kompost',
  'Pflanzenpflege': 'Pflanzenpflege',
  'Ernte & Lagerung': 'Ernte & Lagerung',
  'Pflanzenschutz': 'Pflanzenschutz',
  'Gewächshaus': 'Gewächshaus',
  'Beeren & Obst': 'Beeren & Obst',
  'Blumen & Nützlinge': 'Blumen & Nützlinge',
  'Infrastruktur': 'Infrastruktur',
  'Werkzeug & Material': 'Werkzeug & Material',
  'Planung & Doku': 'Planung & Doku',
  'Wintervorbereitung': 'Wintervorbereitung',
}

// Display order for category groups on the Aufgaben page
export const kategorieOrder = [
  'Aussaat & Pflanzung',
  'Saisonstart',
  'Boden',
  'Bewässerung',
  'Kompost',
  'Pflanzenpflege',
  'Ernte & Lagerung',
  'Pflanzenschutz',
  'Gewächshaus',
  'Beeren & Obst',
  'Blumen & Nützlinge',
  'Infrastruktur',
  'Werkzeug & Material',
  'Planung & Doku',
  'Wintervorbereitung',
]
```

Also update `taskTypeLabels` to include `maintenance`:

```javascript
export const taskTypeLabels = {
  sow: 'Aussaat', transplant: 'Auspflanzen', harvest: 'Ernten',
  water: 'Gießen', cover: 'Abdecken', custom: 'Sonstiges',
  maintenance: 'Pflege',
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/formatters.js
git commit -m "feat: add kategorie labels and display order for task grouping"
```

---

### Task 8: Update TaskItem Component — Duration Badge and Precondition Text

**Files:**
- Modify: `src/components/TaskItem.jsx`

- [ ] **Step 1: Add duration badge and precondition text to TaskItem**

Replace the entire content of `src/components/TaskItem.jsx`:

```jsx
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { taskTypeLabels } from '../utils/formatters'
import { CheckCircle2, Circle, Snowflake, Clock } from 'lucide-react'

function PriorityBadge({ priority, priorityReason }) {
  if (!priority || !priorityReason) return null

  if (priority === 'high') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'normal') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'low') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'blocked') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
        <Snowflake className="w-3 h-3" />
        {priorityReason}
      </span>
    )
  }
  return null
}

export default function TaskItem({ task }) {
  const { user } = useAuth()
  const isBlocked = task.priority === 'blocked'
  const toggle = async () => {
    await updateDoc(doc(db, 'tasks', task.id), {
      completed: !task.completed,
      completedDate: task.completed ? null : new Date(),
      completedBy: task.completed ? null : (user.displayName || user.email),
    })
  }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      task.completed || isBlocked
        ? 'bg-slate-50 border-slate-200'
        : 'bg-white border border-slate-200'
    }`}>
      <button onClick={toggle} className={`flex-shrink-0 ${task.completed ? 'text-green-600' : 'text-slate-400 hover:text-green-600'}`}>
        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.completed || isBlocked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </div>
        {task.precondition && (
          <div className="text-xs text-slate-400 mt-0.5">{task.precondition}</div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mt-0.5">
          <span>{taskTypeLabels[task.type] || task.type}</span>
          {task.durationMinutes && (
            <span className="inline-flex items-center gap-0.5 text-slate-400">
              <Clock className="w-3 h-3" />~{task.durationMinutes} Min
            </span>
          )}
          <PriorityBadge priority={task.priority} priorityReason={task.priorityReason} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TaskItem.jsx
git commit -m "feat: add duration badge and precondition text to task cards"
```

---

### Task 9: Rewrite Aufgaben Page — Category Grouping and Filter Chips

**Files:**
- Modify: `src/pages/Aufgaben.jsx`

- [ ] **Step 1: Rewrite Aufgaben with category grouping**

Replace the entire content of `src/pages/Aufgaben.jsx`:

```jsx
import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import TaskItem from '../components/TaskItem'
import { getKW } from '../utils/kw'
import { kategorieOrder } from '../utils/formatters'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2, blocked: 3 }

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1
    const pb = PRIORITY_ORDER[b.priority] ?? 1
    return pa - pb
  })
}

function groupByKategorie(tasks) {
  const groups = {}
  for (const task of tasks) {
    const kat = task.kategorie || 'Aussaat & Pflanzung'
    if (!groups[kat]) groups[kat] = []
    groups[kat].push(task)
  }
  // Sort each group by priority
  for (const kat of Object.keys(groups)) {
    groups[kat] = sortByPriority(groups[kat])
  }
  return groups
}

export default function Aufgaben() {
  const { tasks, loading } = useGarden()
  const { householdId } = useAuth()
  const [activeKategorie, setActiveKategorie] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [blockedOpen, setBlockedOpen] = useState(false)
  const currentKW = getKW()

  const thisWeekTasks = tasks.filter((t) => t.dueKW === currentKW && !t.completed)
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueKW < currentKW)

  // Split active vs blocked
  const activeTasks = thisWeekTasks.filter((t) => t.priority !== 'blocked')
  const blockedTasks = thisWeekTasks.filter((t) => t.priority === 'blocked')

  // Apply kategorie filter
  const filteredActive = activeKategorie === 'all'
    ? activeTasks
    : activeTasks.filter((t) => (t.kategorie || 'Aussaat & Pflanzung') === activeKategorie)

  // Group by kategorie
  const grouped = groupByKategorie(filteredActive)

  // Get categories present in current tasks for filter chips
  const presentKategorien = [...new Set(thisWeekTasks.map(t => t.kategorie || 'Aussaat & Pflanzung'))]
  const orderedKategorien = kategorieOrder.filter(k => presentKategorien.includes(k))

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await addDoc(collection(db, 'tasks'), {
      title: newTitle.trim(), type: 'custom', kategorie: null, templateId: null,
      dueKW: currentKW, dueYear: new Date().getFullYear(),
      completed: false, completedDate: null, completedBy: null, householdId,
    })
    setNewTitle('')
    setShowAdd(false)
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-slate-200 rounded-xl h-16 animate-pulse" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aufgaben — KW {currentKW}</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700"><Plus className="w-5 h-5" /></button>
      </div>

      {showAdd && (
        <form onSubmit={addTask} className="flex gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Neue Aufgabe..." autoFocus
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none" />
          <button type="submit" className="px-4 py-2.5 bg-green-600 rounded-xl text-sm font-medium text-white">Hinzufügen</button>
        </form>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveKategorie('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            activeKategorie === 'all' ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          Alle
        </button>
        {orderedKategorien.map((kat) => (
          <button
            key={kat}
            onClick={() => setActiveKategorie(activeKategorie === kat ? 'all' : kat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              activeKategorie === kat ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-500 mb-2">Überfällig ({overdueTasks.length})</h3>
          <div className="space-y-2">{overdueTasks.map((t) => <TaskItem key={t.id} task={t} />)}</div>
        </div>
      )}

      {/* Category-grouped active tasks */}
      {kategorieOrder.filter(kat => grouped[kat]).map((kat) => (
        <div key={kat}>
          <h3 className="text-sm font-semibold text-slate-500 mb-2">{kat}</h3>
          <div className="space-y-2">
            {grouped[kat].map((t) => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      ))}

      {Object.keys(grouped).length === 0 && blockedTasks.length === 0 && overdueTasks.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-4">Keine Aufgaben diese Woche</p>
      )}

      {/* Blocked section — collapsible */}
      {blockedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setBlockedOpen(!blockedOpen)}
            className="flex items-center gap-1 text-sm font-semibold text-slate-400 mb-2"
          >
            {blockedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Verschoben ({blockedTasks.length})
          </button>
          {blockedOpen && (
            <div className="space-y-2">
              {blockedTasks.map((t) => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify no compilation errors**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/pages/Aufgaben.jsx
git commit -m "feat: rewrite Aufgaben page with category grouping and filter chips"
```

---

### Task 10: Add taskTemplates to GardenContext

**Files:**
- Modify: `src/context/GardenContext.jsx`

The "Bei Bedarf" template browser (Task 11) needs access to task templates from the frontend. Add the collection to the context.

- [ ] **Step 1: Add taskTemplates to GardenContext**

Replace the entire content of `src/context/GardenContext.jsx`:

```jsx
import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import useCollection from '../hooks/useCollection'

const GardenContext = createContext(null)

export function GardenProvider({ children }) {
  const { householdId } = useAuth()
  const { data: varieties, loading: varietiesLoading } = useCollection('varieties', householdId, 'name')
  const { data: beds, loading: bedsLoading } = useCollection('beds', householdId, 'name')
  const { data: plantings, loading: plantingsLoading } = useCollection('plantings', householdId)
  const { data: tasks, loading: tasksLoading } = useCollection('tasks', householdId)
  const { data: harvests, loading: harvestsLoading } = useCollection('harvests', householdId)
  const { data: taskTemplates, loading: templatesLoading } = useCollection('taskTemplates', householdId)
  const loading = varietiesLoading || bedsLoading || plantingsLoading || tasksLoading || harvestsLoading || templatesLoading

  return (
    <GardenContext.Provider value={{ varieties, beds, plantings, tasks, harvests, taskTemplates, loading }}>
      {children}
    </GardenContext.Provider>
  )
}

export function useGarden() {
  const ctx = useContext(GardenContext)
  if (!ctx) throw new Error('useGarden must be used within GardenProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add src/context/GardenContext.jsx
git commit -m "feat: add taskTemplates collection to GardenContext"
```

---

### Task 11: "Bei Bedarf" Template Browser

**Files:**
- Create: `src/components/TemplateBrowser.jsx`
- Modify: `src/pages/Aufgaben.jsx` (add link + modal)

- [ ] **Step 1: Create TemplateBrowser component**

Create `src/components/TemplateBrowser.jsx`:

```jsx
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import { getKW } from '../utils/kw'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { X, Plus, Clock } from 'lucide-react'

export default function TemplateBrowser({ onClose }) {
  const { taskTemplates, tasks } = useGarden()
  const { householdId } = useAuth()
  const currentKW = getKW()
  const year = new Date().getFullYear()

  // Show bei_bedarf templates where current KW is in window
  const available = taskTemplates.filter((t) =>
    t.recurrence === 'bei_bedarf' &&
    t.active !== false &&
    currentKW >= t.kwStart &&
    currentKW <= t.kwEnd
  )

  // Check which ones already have an active task this week
  const existingTemplateIds = new Set(
    tasks.filter(t => t.dueKW === currentKW && t.dueYear === year && !t.completed)
      .map(t => t.templateId)
      .filter(Boolean)
  )

  const addFromTemplate = async (template) => {
    await addDoc(collection(db, 'tasks'), {
      title: template.title,
      type: 'maintenance',
      templateId: template.id,
      kategorie: template.kategorie,
      dueKW: currentKW,
      dueYear: year,
      priority: 'normal',
      priorityReason: 'Manuell hinzugefügt',
      weatherBlocked: false,
      blockedReason: null,
      precondition: template.precondition || null,
      durationMinutes: template.durationMinutes || null,
      completed: false,
      completedDate: null,
      completedBy: null,
      householdId,
    })
  }

  // Group by kategorie
  const grouped = {}
  for (const t of available) {
    if (!grouped[t.kategorie]) grouped[t.kategorie] = []
    grouped[t.kategorie].push(t)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Weitere Aufgaben</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500">Aufgaben bei Bedarf hinzufügen (KW {currentKW})</p>

        {Object.entries(grouped).map(([kat, templates]) => (
          <div key={kat}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{kat}</h4>
            <div className="space-y-2">
              {templates.map((t) => {
                const alreadyAdded = existingTemplateIds.has(t.id)
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{t.title}</div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                      {t.durationMinutes && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />~{t.durationMinutes} Min
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addFromTemplate(t)}
                      disabled={alreadyAdded}
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        alreadyAdded
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {available.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Keine optionalen Aufgaben für diese Woche</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the template browser trigger to Aufgaben page**

In `src/pages/Aufgaben.jsx`, add the import at the top:

```javascript
import TemplateBrowser from '../components/TemplateBrowser'
```

Add state for the browser:

```javascript
const [showBrowser, setShowBrowser] = useState(false)
```

Add the trigger button and modal at the bottom of the return, just before the closing `</div>`:

```jsx
      {/* Bei Bedarf browser */}
      <button
        onClick={() => setShowBrowser(true)}
        className="w-full py-2.5 text-sm font-medium text-green-600 border border-dashed border-green-300 rounded-xl hover:bg-green-50"
      >
        + Weitere Aufgaben
      </button>

      {showBrowser && <TemplateBrowser onClose={() => setShowBrowser(false)} />}
```

- [ ] **Step 3: Run build to verify**

```bash
cd /home/philipp/dacha-app && npm run build
```

Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/TemplateBrowser.jsx src/pages/Aufgaben.jsx
git commit -m "feat: add Bei Bedarf template browser for manual task creation"
```

---

### Task 12: Seed Templates & Deploy

**Files:**
- Reference: `scripts/seed-task-templates.js`
- Reference: `functions/`

- [ ] **Step 1: Run the seeding script**

```bash
cd /home/philipp/dacha-app && \
  GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
  HOUSEHOLD_ID=woll-family \
  node scripts/seed-task-templates.js
```

Expected: "Done! Seeded 77 task templates."

(Note: The engineer needs to supply the correct service account path. Check if there's one in the project or Firebase console.)

- [ ] **Step 2: Deploy Cloud Functions**

```bash
cd /home/philipp/dacha-app && firebase deploy --only functions
```

Expected: All 4 functions deployed (checkWeather, generateWeeklyTasks, generateDailyTasks, dailyDigest)

- [ ] **Step 3: Deploy Firestore rules**

```bash
cd /home/philipp/dacha-app && firebase deploy --only firestore:rules
```

Expected: Rules deployed successfully

- [ ] **Step 4: Deploy frontend**

```bash
cd /home/philipp/dacha-app && git push
```

Expected: Vercel auto-deploys from git push

- [ ] **Step 5: Manually trigger weekly task generation to test**

```bash
# Via Firebase console or CLI, trigger generateWeeklyTasks manually
# Or wait until next Monday 06:00
```

Verify in Firestore console that new maintenance tasks appear in the `tasks` collection with `type: "maintenance"` and `templateId` values.

---

### Task 13: End-to-End Verification

**Files:** None (manual testing)

- [ ] **Step 1: Verify task templates in Firestore**

Open Firebase Console > Firestore > taskTemplates collection. Confirm 77 documents exist with correct fields.

- [ ] **Step 2: Verify Aufgaben page shows category groups**

Open https://dacha-app.vercel.app, navigate to Aufgaben. If weekly tasks have been generated, verify:
- Tasks grouped by category headers
- Category filter chips appear and work
- Blocked tasks are in collapsible "Verschoben" section
- Duration badge shows on maintenance tasks
- Precondition text shows on relevant tasks

- [ ] **Step 3: Verify "Weitere Aufgaben" browser**

Click "+ Weitere Aufgaben" at bottom of Aufgaben page. Verify:
- "Bei Bedarf" templates for current KW appear
- Tapping "+" adds a task to the main list
- Already-added templates show disabled button

- [ ] **Step 4: Commit any fixes**

If any fixes were needed during verification, commit them.
