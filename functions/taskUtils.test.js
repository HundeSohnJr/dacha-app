import { describe, it, expect, vi } from 'vitest'

// Mock firebase-admin before importing
vi.mock('firebase-admin', () => ({
  firestore: () => ({}),
}))

const { checkWeatherCondition, calcTemplatePriority, getKW, isInRange } = require('./taskUtils')

describe('getKW', () => {
  it('returns KW 13 for 2026-03-28', () => {
    expect(getKW(new Date(2026, 2, 28))).toBe(13)
  })
})

describe('isInRange', () => {
  it('returns true when kw is within range', () => {
    expect(isInRange(10, [8, 14])).toBe(true)
  })
  it('returns true on boundaries', () => {
    expect(isInRange(8, [8, 14])).toBe(true)
    expect(isInRange(14, [8, 14])).toBe(true)
  })
  it('returns false outside range', () => {
    expect(isInRange(7, [8, 14])).toBe(false)
    expect(isInRange(15, [8, 14])).toBe(false)
  })
  it('returns false for null range', () => {
    expect(isInRange(10, null)).toBe(false)
  })
})

describe('checkWeatherCondition', () => {
  const makeWeather = (overrides = {}) => ({
    forecast: [
      { date: '2026-03-28', minTemp: 5, maxTemp: 15, precipitation: 0, ...overrides },
      { date: '2026-03-29', minTemp: 4, maxTemp: 14, precipitation: 0 },
      { date: '2026-03-30', minTemp: 6, maxTemp: 16, precipitation: 0 },
    ],
  })

  it('returns not blocked when no condition', () => {
    expect(checkWeatherCondition(null, makeWeather())).toEqual({ blocked: false, reason: null, skip: false })
  })

  it('frostfrei: blocks when frost in next 3 days', () => {
    const weather = makeWeather()
    weather.forecast[1].minTemp = -2
    const result = checkWeatherCondition('frostfrei', weather)
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('Frost')
  })

  it('frostfrei: not blocked when warm', () => {
    expect(checkWeatherCondition('frostfrei', makeWeather()).blocked).toBe(false)
  })

  it('trocken: blocks when rain > 2mm', () => {
    const result = checkWeatherCondition('trocken', makeWeather({ precipitation: 5 }))
    expect(result.blocked).toBe(true)
    expect(result.reason).toContain('Regen')
  })

  it('trocken: not blocked when dry', () => {
    expect(checkWeatherCondition('trocken', makeWeather({ precipitation: 1 })).blocked).toBe(false)
  })

  it('>25°C: skips when not hot enough', () => {
    const result = checkWeatherCondition('>25°C', makeWeather({ maxTemp: 20 }))
    expect(result.skip).toBe(true)
  })

  it('>25°C: does not skip when hot', () => {
    expect(checkWeatherCondition('>25°C', makeWeather({ maxTemp: 30 })).skip).toBe(false)
  })
})

describe('calcTemplatePriority', () => {
  it('returns blocked when weatherBlocked', () => {
    expect(calcTemplatePriority('hoch', 10, 14, true).priority).toBe('blocked')
  })
  it('returns high for hoch in last 2 KWs', () => {
    const r = calcTemplatePriority('hoch', 13, 14, false)
    expect(r.priority).toBe('high')
    expect(r.priorityReason).toBe('Zeitkritisch')
  })
  it('returns normal for hoch not near end', () => {
    expect(calcTemplatePriority('hoch', 9, 14, false).priority).toBe('normal')
  })
  it('returns normal for mittel', () => {
    expect(calcTemplatePriority('mittel', 10, 14, false).priority).toBe('normal')
  })
  it('returns low for niedrig', () => {
    const r = calcTemplatePriority('niedrig', 10, 14, false)
    expect(r.priority).toBe('low')
    expect(r.priorityReason).toBe('Optional')
  })
})
