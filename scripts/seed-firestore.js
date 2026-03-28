/**
 * One-time script to seed Firestore with garden data.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   HOUSEHOLD_ID=<your-household-id> \
 *   node scripts/seed-firestore.js
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { varieties, beds } from '../src/data/seed-data.js'

const serviceAccount = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

async function seed() {
  const householdId = process.env.HOUSEHOLD_ID
  if (!householdId) {
    console.error('Error: Set HOUSEHOLD_ID env var')
    process.exit(1)
  }

  console.log(`Seeding ${varieties.length} varieties...`)
  let batch = db.batch()
  let count = 0

  for (const v of varieties) {
    const ref = db.collection('varieties').doc()
    batch.set(ref, { ...v, householdId })
    count++
    if (count % 400 === 0) {
      await batch.commit()
      console.log(`  Committed ${count} docs...`)
      batch = db.batch()
    }
  }

  console.log(`Seeding ${beds.length} beds...`)
  for (const b of beds) {
    const ref = db.collection('beds').doc()
    batch.set(ref, { ...b, householdId })
    count++
  }

  await batch.commit()
  console.log(`Done! Seeded ${count} documents.`)
}

seed().catch(console.error)
