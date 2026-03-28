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

        // Dedup: check if one was already created today
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
