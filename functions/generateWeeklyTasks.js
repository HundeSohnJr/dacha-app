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

exports.generateWeeklyTasks = onSchedule(
  { schedule: 'every monday 06:00', timeZone: 'Europe/Berlin' },
  async () => {
    const kw = getKW()
    const year = new Date().getFullYear()
    const households = await db.collection('households').get()

    for (const household of households.docs) {
      const householdId = household.id
      const varieties = await db.collection('varieties')
        .where('householdId', '==', householdId).get()
      const existingTasks = await db.collection('tasks')
        .where('householdId', '==', householdId)
        .where('dueKW', '==', kw).where('dueYear', '==', year).get()
      const existingTitles = new Set(existingTasks.docs.map((d) => d.data().title))

      const batch = db.batch()
      let newCount = 0

      for (const vDoc of varieties.docs) {
        const v = vDoc.data()
        const tasks = []
        if (isInRange(kw, v.sowIndoorsKW)) tasks.push({ title: `${v.name} vorziehen (Fensterbank)`, type: 'sow' })
        if (isInRange(kw, v.sowDirectKW)) tasks.push({ title: `${v.name} direkt aussäen`, type: 'sow' })
        if (isInRange(kw, v.transplantKW)) tasks.push({ title: `${v.name} auspflanzen`, type: 'transplant' })

        for (const t of tasks) {
          if (!existingTitles.has(t.title)) {
            batch.set(db.collection('tasks').doc(), {
              ...t, dueKW: kw, dueYear: year,
              assignedTo: null, completed: false, completedDate: null, completedBy: null,
              householdId,
            })
            newCount++
          }
        }
      }

      if (newCount > 0) {
        await batch.commit()
        const members = await db.collection('members')
          .where('householdId', '==', householdId).get()
        const tokenDocs = await Promise.all(
          members.docs.map((m) => db.doc(`fcmTokens/${m.id}`).get())
        )
        const tokens = tokenDocs.filter((d) => d.exists).map((d) => d.data().token)
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
