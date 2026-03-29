/**
 * Add new varieties to Firestore (without re-seeding everything).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   HOUSEHOLD_ID=<your-household-id> \
 *   node scripts/add-varieties.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const NEW_VARIETIES = [
  // ── KNOBLAUCH (5) ──
  {
    name: 'Elefantenknoblauch',
    category: 'garlic',
    type: 'Allium ampeloprasum',
    sowIndoorsKW: null,
    sowDirectKW: [38, 44],
    transplantKW: null,
    harvestKW: [25, 31],
    sunRequirement: 'full',
    frostSensitive: false,
    companions: ['strawberry', 'carrot', 'tomato', 'beetroot', 'cucumber'],
    incompatible: ['bean', 'pea', 'kale', 'onion'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Kein echter Knoblauch (Allium ampeloprasum). Milde, große Knollen. Zehen 10 cm tief, 20 cm Abstand. Blütenstiel entfernen. Auch Frühjahrspflanzung möglich (KW 10-16). Dreschflegel.',
  },
  {
    name: 'Knoblauch Metechi',
    category: 'garlic',
    type: 'Hardneck (Porcelain)',
    sowIndoorsKW: null,
    sowDirectKW: [38, 43],
    transplantKW: null,
    harvestKW: [26, 30],
    sunRequirement: 'full',
    frostSensitive: false,
    companions: ['strawberry', 'carrot', 'tomato', 'beetroot', 'lettuce'],
    incompatible: ['bean', 'pea', 'kale', 'onion'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Hardneck aus Georgien. Sehr kräftig-scharf. 4-8 große Zehen, leicht zu schälen. Scape im Frühjahr abschneiden. Lagerung 4-5 Monate. Dreschflegel.',
  },
  {
    name: 'Knoblauch Trollinger',
    category: 'garlic',
    type: 'Hardneck',
    sowIndoorsKW: null,
    sowDirectKW: [38, 44],
    transplantKW: null,
    harvestKW: [26, 30],
    sunRequirement: 'full',
    frostSensitive: false,
    companions: ['strawberry', 'carrot', 'tomato', 'beetroot', 'lettuce'],
    incompatible: ['bean', 'pea', 'kale', 'onion'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Deutsche Hardneck-Sorte. Winterhart, für mitteleuropäisches Klima. Scape entfernen. Lagerung 4-6 Monate. Dreschflegel.',
  },
  {
    name: 'Knoblauch Firnberger',
    category: 'garlic',
    type: 'Hardneck',
    sowIndoorsKW: null,
    sowDirectKW: [38, 44],
    transplantKW: null,
    harvestKW: [26, 30],
    sunRequirement: 'full',
    frostSensitive: false,
    companions: ['strawberry', 'carrot', 'tomato', 'beetroot', 'lettuce'],
    incompatible: ['bean', 'pea', 'kale', 'onion'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Deutsch-österreichische Hardneck-Sorte. Winterhart, kältetolerant. Scape entfernen. Dreschflegel.',
  },
  {
    name: 'Knoblauch German White Porcelain',
    category: 'garlic',
    type: 'Hardneck (Porcelain)',
    sowIndoorsKW: null,
    sowDirectKW: [38, 44],
    transplantKW: null,
    harvestKW: [26, 30],
    sunRequirement: 'full',
    frostSensitive: false,
    companions: ['strawberry', 'carrot', 'tomato', 'beetroot', 'lettuce'],
    incompatible: ['bean', 'pea', 'kale', 'onion'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Porcelain-Typ mit reinweißer Hülle. 4-6 sehr große Zehen. Extrem winterhart. Kräftiger Geschmack. Gute Lagerung (6-8 Monate). Dreschflegel.',
  },
  // ── KARTOFFELN (4) ──
  {
    name: 'Kartoffel Annabelle',
    category: 'potato',
    type: 'Frühkartoffel, festkochend',
    sowIndoorsKW: null,
    sowDirectKW: [14, 17],
    transplantKW: null,
    harvestKW: [24, 28],
    sunRequirement: 'full',
    frostSensitive: true,
    companions: ['bean', 'spinach', 'kohlrabi', 'lettuce', 'herb'],
    incompatible: ['tomato', 'cucumber', 'squash', 'sunflower'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Sehr früh, festkochend. Gelbe Schale, gelbes Fleisch. Ideal für Salat und Pellkartoffeln. 30 cm Abstand, 60 cm Reihe. Vorkeimen ab KW 10. 10 Stück (Quedlinburger/Caipi).',
  },
  {
    name: 'Kartoffel Sieglinde',
    category: 'potato',
    type: 'Frühkartoffel, festkochend',
    sowIndoorsKW: null,
    sowDirectKW: [14, 17],
    transplantKW: null,
    harvestKW: [26, 30],
    sunRequirement: 'full',
    frostSensitive: true,
    companions: ['bean', 'spinach', 'kohlrabi', 'lettuce', 'herb'],
    incompatible: ['tomato', 'cucumber', 'squash', 'sunflower'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Klassiker seit 1935. Festkochend, buttrig-nussig. Gelbe Schale, tiefgelbes Fleisch. Beste Salatkartoffel. 30 cm Abstand, 65 cm Reihe. 10 Stück (Kiepenkerl/Caipi).',
  },
  {
    name: 'Kartoffel Heiderot',
    category: 'potato',
    type: 'Mittelfrüh, vorwiegend festkochend',
    sowIndoorsKW: null,
    sowDirectKW: [15, 18],
    transplantKW: null,
    harvestKW: [28, 34],
    sunRequirement: 'full',
    frostSensitive: true,
    companions: ['bean', 'spinach', 'kohlrabi', 'lettuce', 'herb'],
    incompatible: ['tomato', 'cucumber', 'squash', 'sunflower'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Rote Schale, gelbes Fleisch. Vorwiegend festkochend. Dekorative Sorte, guter Geschmack. 35 cm Abstand, 65 cm Reihe. 5 Stück (Kiepenkerl/Caipi).',
  },
  {
    name: 'Kartoffel Quartett Spezialitäten',
    category: 'potato',
    type: 'Sortenmischung',
    sowIndoorsKW: null,
    sowDirectKW: [15, 18],
    transplantKW: null,
    harvestKW: [27, 34],
    sunRequirement: 'full',
    frostSensitive: true,
    companions: ['bean', 'spinach', 'kohlrabi', 'lettuce', 'herb'],
    incompatible: ['tomato', 'cucumber', 'squash', 'sunflower'],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Kiepenkerl Mischung aus 4 Spezialitäten-Sorten (je 3 Stück, 12 total). Verschiedene Farben und Kochtypen. 35 cm Abstand, 65 cm Reihe. Caipi.',
  },
]

async function addNewVarieties() {
  const householdId = process.env.HOUSEHOLD_ID
  if (!householdId) {
    console.error('Error: Set HOUSEHOLD_ID env var')
    process.exit(1)
  }

  // Check for duplicates first
  const existing = await db.collection('varieties')
    .where('householdId', '==', householdId)
    .get()

  const existingNames = new Set(existing.docs.map(d => d.data().name))
  const toAdd = NEW_VARIETIES.filter(v => !existingNames.has(v.name))

  if (toAdd.length === 0) {
    console.log('All varieties already exist in Firestore. Nothing to add.')
    return
  }

  console.log(`Adding ${toAdd.length} new varieties (skipping ${NEW_VARIETIES.length - toAdd.length} duplicates)...`)

  const batch = db.batch()
  for (const v of toAdd) {
    const ref = db.collection('varieties').doc()
    batch.set(ref, { ...v, householdId })
    console.log(`  + ${v.name} (${v.category})`)
  }

  await batch.commit()
  console.log(`Done! Added ${toAdd.length} varieties.`)
}

addNewVarieties().catch(console.error)
