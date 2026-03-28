/**
 * March 2026 garden update script.
 *
 * - Fixes HB3 and HB4 sun exposure to "full" and updates notes
 * - Adds 6 new varieties
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/home/philipp/Downloads/dacha-app-e0342-firebase-adminsdk-fbsvc-cf5803895e.json \
 *   node scripts/update-march-2026.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const HOUSEHOLD_ID = 'woll-family'

// --- 1. Bed fixes ---

async function fixBeds() {
  const bedsRef = db.collection('beds')

  for (const bedName of ['HB3', 'HB4']) {
    const snap = await bedsRef
      .where('householdId', '==', HOUSEHOLD_ID)
      .where('name', '==', bedName)
      .get()

    if (snap.empty) {
      console.log(`  WARNING: No bed found with name "${bedName}" for household ${HOUSEHOLD_ID}`)
      continue
    }

    for (const doc of snap.docs) {
      const updates = { sunExposure: 'full' }
      if (bedName === 'HB3') updates.notes = 'Bohnen (Brunhilde, Feuerbohnen) 2026'
      if (bedName === 'HB4') updates.notes = 'Bohnen (Maxi, Käferbohne) + Salat, hat Dach'

      await doc.ref.update(updates)
      console.log(`  Updated bed ${bedName} (${doc.id}): sunExposure=full, notes="${updates.notes}"`)
    }
  }
}

// --- 2. New varieties ---

const newVarieties = [
  {
    name: 'Bio-Zuckermais',
    category: 'corn',
    type: null,
    sowIndoorsKW: null,
    sowDirectKW: [18, 20],
    transplantKW: null,
    harvestKW: [30, 40],
    sunRequirement: 'full',
    frostSensitive: true,
    companions: ['squash', 'bean'],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Nach Eisheiligen säen. Bei Kürbis pflanzen.',
  },
  {
    name: 'Kornblume Blauer Junge',
    category: 'flower',
    type: null,
    sowIndoorsKW: null,
    sowDirectKW: [12, 16],
    transplantKW: null,
    harvestKW: null,
    sunRequirement: 'full',
    frostSensitive: false,
    companions: [],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: true,
    notes: 'Bienenweide.',
  },
  {
    name: 'Bio Akelei',
    category: 'flower',
    type: 'perennial',
    sowIndoorsKW: null,
    sowDirectKW: [10, 14],
    transplantKW: null,
    harvestKW: null,
    sunRequirement: 'partial',
    frostSensitive: false,
    companions: [],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: true,
    notes: 'Staude.',
  },
  {
    name: 'Türkischer Mohn',
    category: 'flower',
    type: 'perennial',
    sowIndoorsKW: null,
    sowDirectKW: [12, 16],
    transplantKW: null,
    harvestKW: null,
    sunRequirement: 'full',
    frostSensitive: false,
    companions: [],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Staude. Lichtkeimer.',
  },
  {
    name: 'Bio Stockrose',
    category: 'flower',
    type: null,
    sowIndoorsKW: null,
    sowDirectKW: [14, 20],
    transplantKW: null,
    harvestKW: null,
    sunRequirement: 'full',
    frostSensitive: false,
    companions: [],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: true,
    notes: 'Zweijährig.',
  },
  {
    name: '100 Tage Sommer',
    category: 'flower',
    type: 'Blumenmischung',
    sowIndoorsKW: null,
    sowDirectKW: [14, 18],
    transplantKW: null,
    harvestKW: null,
    sunRequirement: 'full',
    frostSensitive: true,
    companions: [],
    incompatible: [],
    succession: false,
    successionIntervalWeeks: null,
    selfSeeding: false,
    notes: 'Direktsaat.',
  },
]

async function addVarieties() {
  const varietiesRef = db.collection('varieties')

  for (const variety of newVarieties) {
    const doc = varietiesRef.doc()
    await doc.set({ ...variety, householdId: HOUSEHOLD_ID })
    console.log(`  Added variety "${variety.name}" (${doc.id})`)
  }
}

// --- Main ---

async function main() {
  console.log(`\n=== March 2026 Garden Update (household: ${HOUSEHOLD_ID}) ===\n`)

  console.log('Fixing bed sun exposures and notes...')
  await fixBeds()

  console.log('\nAdding new varieties...')
  await addVarieties()

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
