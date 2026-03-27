const functions = require('firebase-functions')
const admin = require('firebase-admin')
const db = admin.firestore()

function getKW() {
  const d = new Date()
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil(((utc - yearStart) / 86400000 + 1) / 7)
}

exports.dailyDigest = functions.pubsub
  .schedule('every day 07:00').timeZone('Europe/Berlin')
  .onRun(async () => {
    const kw = getKW()
    const households = await db.collection('households').get()

    for (const household of households.docs) {
      const householdId = household.id
      const openTasks = await db.collection('tasks')
        .where('householdId', '==', householdId)
        .where('dueKW', '==', kw)
        .where('completed', '==', false).get()
      if (openTasks.empty) continue

      const weatherDoc = await db.doc('weather/current').get()
      const weather = weatherDoc.exists ? weatherDoc.data() : null

      let body = `${openTasks.size} offene Aufgaben diese Woche`
      if (weather) {
        body += ` • ${Math.round(weather.temperature)}°C`
        if (weather.frostRisk) body += ' ❄️ Frostgefahr!'
      }

      const members = await db.collection('members')
        .where('householdId', '==', householdId).get()
      const tokenDocs = await Promise.all(
        members.docs.map((m) => db.doc(`fcmTokens/${m.id}`).get())
      )
      const tokens = tokenDocs.filter((d) => d.exists).map((d) => d.data().token)
      if (tokens.length > 0) {
        await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title: 'Guten Morgen, Gärtner! 🌻', body },
        })
      }
    }
    return null
  })
