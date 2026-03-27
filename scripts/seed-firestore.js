/**
 * One-time script to seed Firestore with garden data.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json \
 *   HOUSEHOLD_ID=<your-household-id> \
 *   node scripts/seed-firestore.js
 */

const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore()

// We need to use a dynamic import or require the compiled seed data
// Since seed-data.js uses ES modules, we'll duplicate the data reference approach
const path = require('path')

async function seed() {
  const householdId = process.env.HOUSEHOLD_ID
  if (!householdId) {
    console.error('Error: Set HOUSEHOLD_ID env var')
    process.exit(1)
  }

  // Dynamic import for ESM seed data
  let varieties, beds
  try {
    const seedData = await import(path.resolve(__dirname, '../src/data/seed-data.js'))
    varieties = seedData.varieties
    beds = seedData.beds
  } catch (err) {
    console.error('Failed to load seed data. Make sure src/data/seed-data.js exists.')
    console.error(err.message)
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
