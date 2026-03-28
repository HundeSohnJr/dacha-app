const admin = require('firebase-admin')

function getDb() {
  return admin.firestore()
}

// Lazy db accessor so tests can mock firebase-admin before it's called
const db = new Proxy({}, {
  get(_, prop) {
    return getDb()[prop]
  },
})

function getKW(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

function isInRange(kw, range) {
  return !!(range && kw >= range[0] && kw <= range[1])
}

/**
 * Check weather conditions against a template's weatherCondition.
 * Returns { blocked: boolean, reason: string|null, skip: boolean }
 * - blocked: task should be created but marked as weather-blocked
 * - skip: task should not be created at all (condition not met)
 */
function checkWeatherCondition(weatherCondition, weather) {
  if (!weatherCondition || !weather?.forecast) {
    return { blocked: false, reason: null, skip: false }
  }

  const forecast = weather.forecast

  switch (weatherCondition) {
    case 'frostfrei': {
      const frostInNext3Days = forecast.slice(0, 3).some(d => d.minTemp <= 0)
      if (frostInNext3Days) {
        const coldest = Math.min(...forecast.slice(0, 3).map(d => d.minTemp))
        return { blocked: true, reason: `Frost erwartet (${Math.round(coldest)}°C)`, skip: false }
      }
      return { blocked: false, reason: null, skip: false }
    }
    case 'trocken': {
      const rainNext24h = forecast[0]?.precipitation > 2
      if (rainNext24h) {
        return { blocked: true, reason: `Regen erwartet (${forecast[0].precipitation}mm)`, skip: false }
      }
      return { blocked: false, reason: null, skip: false }
    }
    case '>25°C': {
      const hotEnough = forecast[0]?.maxTemp > 25
      if (!hotEnough) {
        return { blocked: false, reason: null, skip: true }
      }
      return { blocked: false, reason: null, skip: false }
    }
    default:
      return { blocked: false, reason: null, skip: false }
  }
}

/**
 * Calculate priority for a template-based task.
 */
function calcTemplatePriority(templatePriority, currentKW, kwEnd, weatherBlocked) {
  if (weatherBlocked) {
    return { priority: 'blocked', priorityReason: 'Wetter ungeeignet' }
  }
  if (templatePriority === 'hoch' && kwEnd - currentKW <= 1) {
    return { priority: 'high', priorityReason: 'Zeitkritisch' }
  }
  if (templatePriority === 'hoch') {
    return { priority: 'normal', priorityReason: 'Diese Woche' }
  }
  if (templatePriority === 'mittel') {
    return { priority: 'normal', priorityReason: 'Diese Woche' }
  }
  return { priority: 'low', priorityReason: 'Optional' }
}

/**
 * Create a task document from a template.
 */
function buildTaskFromTemplate(template, kw, year, priority, priorityReason, weatherBlocked, blockedReason) {
  return {
    title: template.title,
    type: 'maintenance',
    templateId: `template-${template.id}`,
    kategorie: template.kategorie,
    dueKW: kw,
    dueYear: year,
    priority,
    priorityReason,
    weatherBlocked,
    blockedReason,
    precondition: template.precondition || null,
    durationMinutes: template.durationMinutes || null,
    completed: false,
    completedDate: null,
    completedBy: null,
  }
}

module.exports = {
  getKW,
  isInRange,
  checkWeatherCondition,
  calcTemplatePriority,
  buildTaskFromTemplate,
  db,
}
