const { onSchedule } = require('firebase-functions/v2/scheduler')
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

exports.generateWeeklyTasks = onSchedule(
  { schedule: 'every monday 06:00', timeZone: 'Europe/Berlin' },
  async () => {
    const kw = getKW()
    const year = new Date().getFullYear()
    const households = await db.collection('households').get()

    for (const household of households.docs) {
      const householdId = household.id
      const { frostThresholdC = 3 } = household.data()

      // Get weather forecast
      const weatherDoc = await db.doc('weather/current').get()
      const weather = weatherDoc.exists ? weatherDoc.data() : null
      const frostInForecast = weather?.forecast?.slice(0, 5).some(d => d.minTemp <= frostThresholdC) || false
      const idealWeather = weather?.forecast?.slice(0, 3).some(d =>
        d.minTemp >= 8 && d.maxTemp <= 18 && d.precipitation >= 1 && d.precipitation <= 5
      ) || false

      const varieties = await db.collection('varieties').where('householdId', '==', householdId).get()
      const existingTasks = await db.collection('tasks')
        .where('householdId', '==', householdId)
        .where('dueKW', '==', kw).where('dueYear', '==', year).get()
      const existingTitles = new Set(existingTasks.docs.map(d => d.data().title))

      const batch = db.batch()
      let newCount = 0

      for (const vDoc of varieties.docs) {
        const v = vDoc.data()
        const actions = []

        // Indoor sowing
        if (isInRange(kw, v.sowIndoorsKW)) {
          const idealKW = calcIdealKW(v.sowIndoorsKW, v.frostSensitive, false)
          const { priority, priorityReason } = calcPriority(kw, idealKW, v.sowIndoorsKW[1], false, false)
          actions.push({
            title: `${v.name} vorziehen (Fensterbank)`,
            type: 'sow', priority, priorityReason,
            weatherBlocked: false, blockedReason: null,
          })
        }

        // Direct sowing (outdoor)
        if (isInRange(kw, v.sowDirectKW)) {
          const idealKW = calcIdealKW(v.sowDirectKW, v.frostSensitive, true)
          const blocked = v.frostSensitive && frostInForecast
          const boost = !blocked && idealWeather
          const { priority, priorityReason } = calcPriority(kw, idealKW, v.sowDirectKW[1], blocked, boost)
          actions.push({
            title: `${v.name} direkt aussäen`,
            type: 'sow', priority, priorityReason,
            weatherBlocked: blocked,
            blockedReason: blocked ? `Frost erwartet (${Math.round(Math.min(...weather.forecast.slice(0,5).map(d=>d.minTemp)))}°C)` : null,
          })
        }

        // Transplanting
        if (isInRange(kw, v.transplantKW)) {
          const idealKW = calcIdealKW(v.transplantKW, v.frostSensitive, true)
          const blocked = v.frostSensitive && frostInForecast && kw < 20
          const { priority, priorityReason } = calcPriority(kw, idealKW, v.transplantKW[1], blocked, false)
          actions.push({
            title: `${v.name} auspflanzen`,
            type: 'transplant', priority, priorityReason,
            weatherBlocked: blocked,
            blockedReason: blocked ? 'Frost erwartet' : null,
          })
        }

        for (const a of actions) {
          if (!existingTitles.has(a.title)) {
            batch.set(db.collection('tasks').doc(), {
              ...a, dueKW: kw, dueYear: year,
              assignedTo: null, completed: false, completedDate: null, completedBy: null,
              householdId,
            })
            newCount++
          }
        }
      }

      if (newCount > 0) {
        await batch.commit()
        // Send push notification
        const members = await db.collection('members').where('householdId', '==', householdId).get()
        const tokenDocs = await Promise.all(members.docs.map(m => db.doc(`fcmTokens/${m.id}`).get()))
        const tokens = tokenDocs.filter(d => d.exists).map(d => d.data().token)
        if (tokens.length > 0) {
          await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
              title: `KW ${kw}: ${newCount} neue Aufgaben 🌱`,
              body: 'Schau mal in die Dacha App!',
            },
          })
        }
      }
    }
  }
)
