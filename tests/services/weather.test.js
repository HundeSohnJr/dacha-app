import { describe, it, expect } from 'vitest'
import { buildWeatherUrl, parseWeatherResponse } from '../../src/services/weather'

describe('buildWeatherUrl', () => {
  it('constructs Open-Meteo URL with coordinates', () => {
    const url = buildWeatherUrl(49.64, 8.45)
    expect(url).toContain('api.open-meteo.com')
    expect(url).toContain('latitude=49.64')
    expect(url).toContain('longitude=8.45')
    expect(url).toContain('temperature_2m_min')
    expect(url).toContain('temperature_2m_max')
    expect(url).toContain('precipitation_sum')
  })
})

describe('parseWeatherResponse', () => {
  it('parses API response into app format', () => {
    const mockResponse = {
      current: { temperature_2m: 14.2, weather_code: 2, relative_humidity_2m: 65, wind_speed_10m: 12 },
      daily: {
        time: ['2026-03-27', '2026-03-28'],
        temperature_2m_min: [3.1, 5.2],
        temperature_2m_max: [14.2, 16.0],
        precipitation_sum: [0, 2.5],
        weather_code: [2, 61],
      },
    }
    const result = parseWeatherResponse(mockResponse, 3)
    expect(result.current.temperature).toBe(14.2)
    expect(result.forecast).toHaveLength(2)
    expect(result.forecast[0].minTemp).toBe(3.1)
    expect(result.frostRisk).toBe(true)
  })
})
