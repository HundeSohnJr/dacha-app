/**
 * Seed Firestore taskTemplates collection from Excel.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   HOUSEHOLD_ID=<your-household-id> \
 *   node scripts/seed-task-templates.js
 *
 * Optional env vars:
 *   EXCEL_PATH  — override path to .xlsx file (default: docs/garten_tasks_dacha.xlsx)
 *   DRY_RUN=1   — print parsed templates without writing to Firestore
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Mappings
// ---------------------------------------------------------------------------

const WEATHER_MAP = {
  'Frostfrei': 'frostfrei',
  'Frostfrei (>5°C nachts)': 'frostfrei',
  'Kein Frost, trocken': 'frostfrei',
  'Trocken, frostfrei': 'frostfrei',
  'Trocken': 'trocken',
  'Trocken (morgens)': 'trocken',
  'Trocken, kein Regen erwartet': 'trocken',
  'Trocken, >28°C': 'trocken',
  'Kein Regen seit >3 Tagen, >25°C': null,
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

const RECURRENCE_MAP = {
  'Einmalig/Jahr': 'einmalig',
  'Einmalig': 'einmalig',
  '1x/Jahr': 'einmalig',
  '1–2x/Jahr': 'einmalig',
  '2x/Jahr': 'einmalig',
  '2x/Jahr (Frühjahr + Herbst)': 'einmalig',
  'Einmalig pro Kultur': 'einmalig',
  'Einmalig pro Satz': 'einmalig',
  'Einmalig/Jahr (+ laufend)': 'einmalig',
  'Wöchentlich': 'wöchentlich',
  'Laufend': 'wöchentlich',
  'Täglich': 'täglich',
  'Täglich bei Hitze': 'täglich_bei_hitze',
  'Alle 2 Wochen': 'alle_2_wochen',
  'Alle 4–6 Wochen nachsetzen': 'alle_2_wochen',
  'Nach Ernte': 'bei_bedarf',
  'Nach jeder Neupflanzung': 'bei_bedarf',
  'Bei Bedarf': 'bei_bedarf',
  '—': 'bei_bedarf',
}

const PRIORITY_MAP = {
  'Hoch': 'hoch',
  'hoch': 'hoch',
  'Mittel': 'mittel',
  'mittel': 'mittel',
  'Niedrig': 'niedrig',
  'niedrig': 'niedrig',
}

// ---------------------------------------------------------------------------
// Excel parsing
// ---------------------------------------------------------------------------

const SHEET_NAME = 'Garten-Tasks'

// Column indices (0-based) matching the header row:
// ID | Kategorie | Unterkategorie | Task | Beschreibung |
// KW Start | KW Ende | Priorität | Wetter-Bedingung | Temperatur-Bedingung |
// Vorbedingung(en) | Wiederholung | Dauer (Min) | Notizen
const COL = {
  ID: 0,
  KATEGORIE: 1,
  UNTERKATEGORIE: 2,
  TASK: 3,
  BESCHREIBUNG: 4,
  KW_START: 5,
  KW_ENDE: 6,
  PRIORITAET: 7,
  WETTER: 8,
  TEMPERATUR: 9,
  VORBEDINGUNG: 10,
  WIEDERHOLUNG: 11,
  DAUER_MIN: 12,
  NOTIZEN: 13,
}

function parseExcel(filePath) {
  const wb = XLSX.readFile(filePath)

  if (!wb.SheetNames.includes(SHEET_NAME)) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Available: ${wb.SheetNames.join(', ')}`)
  }

  const ws = wb.Sheets[SHEET_NAME]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  // Skip header row (index 0), skip empty rows
  const dataRows = rows.slice(1).filter(row => row[COL.ID] != null && row[COL.TASK])

  const templates = dataRows.map(row => {
    const rawWeather = String(row[COL.WETTER] ?? '—').trim()
    const rawRecurrence = String(row[COL.WIEDERHOLUNG] ?? '—').trim()

    if (!(rawWeather in WEATHER_MAP)) {
      console.warn(`  [WARN] Unknown Wetter-Bedingung: "${rawWeather}" (ID ${row[COL.ID]}) — defaulting to null`)
    }
    if (!(rawRecurrence in RECURRENCE_MAP)) {
      console.warn(`  [WARN] Unknown Wiederholung: "${rawRecurrence}" (ID ${row[COL.ID]}) — defaulting to "bei_bedarf"`)
    }

    const weatherCondition = rawWeather in WEATHER_MAP ? WEATHER_MAP[rawWeather] : null
    const recurrence = rawRecurrence in RECURRENCE_MAP ? RECURRENCE_MAP[rawRecurrence] : 'bei_bedarf'

    const rawPriority = String(row[COL.PRIORITAET] ?? '').trim()
    const priority = PRIORITY_MAP[rawPriority] ?? rawPriority.toLowerCase() ?? null

    return {
      id: String(row[COL.ID]),
      kategorie: String(row[COL.KATEGORIE] ?? '').trim(),
      unterkategorie: String(row[COL.UNTERKATEGORIE] ?? '').trim(),
      title: String(row[COL.TASK] ?? '').trim(),
      description: String(row[COL.BESCHREIBUNG] ?? '').trim(),
      kwStart: row[COL.KW_START] != null ? Number(row[COL.KW_START]) : null,
      kwEnd: row[COL.KW_ENDE] != null ? Number(row[COL.KW_ENDE]) : null,
      priority: priority || null,
      weatherCondition,
      temperatureCondition: row[COL.TEMPERATUR] != null ? String(row[COL.TEMPERATUR]).trim() : null,
      precondition: row[COL.VORBEDINGUNG] != null && String(row[COL.VORBEDINGUNG]).trim() !== '—'
        ? String(row[COL.VORBEDINGUNG]).trim()
        : null,
      recurrence,
      durationMinutes: row[COL.DAUER_MIN] != null ? Number(row[COL.DAUER_MIN]) : null,
      notes: row[COL.NOTIZEN] != null && String(row[COL.NOTIZEN]).trim() !== '—'
        ? String(row[COL.NOTIZEN]).trim()
        : null,
    }
  })

  return templates
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function seed(templates, householdId) {
  const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
  initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore()

  console.log(`Writing ${templates.length} task templates to Firestore (taskTemplates/)...`)

  let batch = db.batch()
  let count = 0

  for (const tmpl of templates) {
    const docId = `template-${tmpl.id}`
    const ref = db.collection('taskTemplates').doc(docId)
    // Idempotent: set() overwrites existing document
    batch.set(ref, {
      ...tmpl,
      householdId,
      active: true,
    })
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (!process.env.HOUSEHOLD_ID) {
  console.error('Error: Set HOUSEHOLD_ID env var')
  process.exit(1)
}

const householdId = process.env.HOUSEHOLD_ID

const excelPath = process.env.EXCEL_PATH
  ?? resolve(__dirname, '../docs/garten_tasks_dacha.xlsx')

console.log(`Parsing Excel: ${excelPath}`)
const templates = parseExcel(excelPath)
console.log(`Parsed ${templates.length} templates.`)

if (process.env.DRY_RUN === '1') {
  console.log('\nDry run — first 3 templates:')
  templates.slice(0, 3).forEach(t => console.log(JSON.stringify(t, null, 2)))
  console.log('\nDry run complete. Set DRY_RUN= and add GOOGLE_APPLICATION_CREDENTIALS to seed.')
  process.exit(0)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Error: Set GOOGLE_APPLICATION_CREDENTIALS env var (path to Firebase service account JSON)')
  process.exit(1)
}

seed(templates, householdId).catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
