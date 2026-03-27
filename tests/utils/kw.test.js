import { describe, it, expect } from 'vitest'
import { getKW, isInKWRange, getKWProgress } from '../../src/utils/kw'

describe('getKW', () => {
  it('returns the ISO week number for a date', () => {
    expect(getKW(new Date(2026, 2, 27))).toBe(13)
  })
  it('handles year boundaries', () => {
    expect(getKW(new Date(2026, 0, 1))).toBe(1)
  })
  it('returns current KW when no date given', () => {
    const result = getKW()
    expect(result).toBeGreaterThanOrEqual(1)
    expect(result).toBeLessThanOrEqual(53)
  })
})

describe('isInKWRange', () => {
  it('returns true when KW is within range', () => {
    expect(isInKWRange(13, [10, 16])).toBe(true)
  })
  it('returns false when KW is outside range', () => {
    expect(isInKWRange(5, [10, 16])).toBe(false)
  })
  it('returns true at range boundaries', () => {
    expect(isInKWRange(10, [10, 16])).toBe(true)
    expect(isInKWRange(16, [10, 16])).toBe(true)
  })
  it('returns false for null range', () => {
    expect(isInKWRange(13, null)).toBe(false)
  })
})

describe('getKWProgress', () => {
  it('returns 0 before the range', () => {
    expect(getKWProgress(5, [10, 20])).toBe(0)
  })
  it('returns 1 after the range', () => {
    expect(getKWProgress(25, [10, 20])).toBe(1)
  })
  it('returns 0.5 at midpoint', () => {
    expect(getKWProgress(15, [10, 20])).toBe(0.5)
  })
})
