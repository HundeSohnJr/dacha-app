/**
 * One-time script: backfill priority fields on existing KW 13 / 2026 tasks
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/update-tasks-priority.js
 */

const admin = require('firebase-admin')

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
})

const db = admin.firestore()

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

function calcPriority(currentKW, idealKW, endKW, frostBlocked, weatherBoost) {
  if (frostBlocked) return { priority: 'blocked', priorityReason: 'Wegen Frost verschoben' }
  if (weatherBoost) return { priority: 'high', priorityReason: 'Wetter perfekt' }
  if (endKW - currentKW <= 1) return { priority: 'high', priorityReason: 'Zeitkritisch' }
  if (currentKW >= idealKW) return { priority: 'normal', priorityReason: 'Ideal diese Woche' }
  return { priority: 'low', priorityReason: 'Optional — Fenster offen' }
}

async function main() {
  const KW = 13
  const YEAR = 2026
  const HOUSEHOLD = 'woll-family'

  console.log(`Fetching tasks for ${HOUSEHOLD}, KW ${KW}, year ${YEAR}...`)

  const [tasksSnap, varietiesSnap] = await Promise.all([
    db.collection('tasks')
      .where('householdId', '==', HOUSEHOLD)
      .where('dueKW', '==', KW)
      .where('dueYear', '==', YEAR)
      .get(),
    db.collection('varieties')
      .where('householdId', '==', HOUSEHOLD)
      .get(),
  ])

  console.log(`Found ${tasksSnap.size} tasks, ${varietiesSnap.size} varieties`)

  // Build variety lookup by name
  const varietiesByName = {}
  for (const vDoc of varietiesSnap.docs) {
    const v = vDoc.data()
    varietiesByName[v.name] = v
  }

  const batch = db.batch()
  let updated = 0
  let skipped = 0

  for (const tDoc of tasksSnap.docs) {
    const task = tDoc.data()
    const title = task.title || ''

    // Determine which variety and action type from title
    let matchedVariety = null
    let isOutdoor = false
    let isTransplant = false

    for (const [name, variety] of Object.entries(varietiesByName)) {
      if (title.startsWith(name)) {
        matchedVariety = variety

        if (title.includes('direkt aussäen')) {
          isOutdoor = true
        } else if (title.includes('auspflanzen')) {
          isTransplant = true
        }
        // else: vorziehen (Fensterbank) — indoor, both flags false
        break
      }
    }

    if (!matchedVariety) {
      console.log(`  SKIP (no variety match): "${title}"`)
      skipped++
      continue
    }

    // Determine the relevant KW range
    let range = null
    if (isTransplant) {
      range = matchedVariety.transplantKW
    } else if (isOutdoor) {
      range = matchedVariety.sowDirectKW
    } else {
      range = matchedVariety.sowIndoorsKW
    }

    if (!range) {
      console.log(`  SKIP (no range): "${title}"`)
      skipped++
      continue
    }

    const idealKW = calcIdealKW(range, matchedVariety.frostSensitive, isOutdoor || isTransplant)
    // No live weather data for backfill — use no frost/no boost
    const { priority, priorityReason } = calcPriority(KW, idealKW, range[1], false, false)

    console.log(`  UPDATE "${title}" → priority=${priority} (${priorityReason})`)

    batch.update(tDoc.ref, {
      priority,
      priorityReason,
      weatherBlocked: false,
      blockedReason: null,
    })
    updated++
  }

  if (updated > 0) {
    await batch.commit()
    console.log(`\nDone. Updated ${updated} tasks, skipped ${skipped}.`)
  } else {
    console.log(`\nNothing to update. Skipped ${skipped} tasks.`)
  }

  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
