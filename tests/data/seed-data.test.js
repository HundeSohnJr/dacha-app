import { describe, it, expect } from 'vitest'
import { varieties, beds } from '../../src/data/seed-data'

describe('seed data: varieties', () => {
  it('contains at least 100 varieties', () => {
    expect(varieties.length).toBeGreaterThanOrEqual(100)
  })
  it('every variety has required fields', () => {
    for (const v of varieties) {
      expect(v.name).toBeTruthy()
      expect(v.category).toBeTruthy()
      expect(typeof v.frostSensitive).toBe('boolean')
    }
  })
  it('KW ranges are valid [start, end] pairs or null', () => {
    for (const v of varieties) {
      for (const field of ['sowIndoorsKW', 'sowDirectKW', 'transplantKW', 'harvestKW']) {
        const val = v[field]
        if (val !== null) {
          expect(Array.isArray(val)).toBe(true)
          expect(val).toHaveLength(2)
          expect(val[0]).toBeLessThanOrEqual(val[1])
          expect(val[0]).toBeGreaterThanOrEqual(1)
          expect(val[1]).toBeLessThanOrEqual(52)
        }
      }
    }
  })
})

describe('seed data: beds', () => {
  it('contains 17 beds', () => {
    expect(beds.length).toBe(17)
  })
  it('every bed has required fields', () => {
    for (const b of beds) {
      expect(b.name).toBeTruthy()
      expect(['raised', 'ground', 'greenhouse', 'small']).toContain(b.type)
      expect(['full', 'partial', 'shade']).toContain(b.sunExposure)
    }
  })
})
