const DEFAULT_LAT = 49.64
const DEFAULT_LNG = 8.45

export function buildWeatherUrl(lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lng,
    current: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m',
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code,sunrise,sunset',
    timezone: 'Europe/Berlin',
    forecast_days: '7',
  })
  return `https://api.open-meteo.com/v1/forecast?${params}`
}

export function parseWeatherResponse(data, frostThreshold = 3) {
  const forecast = data.daily.time.map((date, i) => ({
    date,
    minTemp: data.daily.temperature_2m_min[i],
    maxTemp: data.daily.temperature_2m_max[i],
    precipitation: data.daily.precipitation_sum[i],
    weatherCode: data.daily.weather_code[i],
  }))
  const frostRisk = forecast.some((d) => Math.round(d.minTemp) <= frostThreshold)
  const rainExpected = forecast.slice(0, 2).some((d) => d.precipitation > 1)

  return {
    current: {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
    },
    forecast, frostRisk, rainExpected,
  }
}

export async function fetchWeather(lat, lng, frostThreshold) {
  const url = buildWeatherUrl(lat, lng)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
  const data = await res.json()
  return parseWeatherResponse(data, frostThreshold)
}

export const weatherDescriptions = {
  0: { label: 'Klar', icon: '☀️' },
  1: { label: 'Überwiegend klar', icon: '🌤️' },
  2: { label: 'Teilweise bewölkt', icon: '⛅' },
  3: { label: 'Bewölkt', icon: '☁️' },
  45: { label: 'Nebel', icon: '🌫️' },
  48: { label: 'Reifnebel', icon: '🌫️' },
  51: { label: 'Leichter Nieselregen', icon: '🌦️' },
  53: { label: 'Nieselregen', icon: '🌦️' },
  55: { label: 'Starker Nieselregen', icon: '🌧️' },
  61: { label: 'Leichter Regen', icon: '🌦️' },
  63: { label: 'Regen', icon: '🌧️' },
  65: { label: 'Starkregen', icon: '🌧️' },
  71: { label: 'Leichter Schnee', icon: '🌨️' },
  73: { label: 'Schnee', icon: '🌨️' },
  75: { label: 'Starker Schnee', icon: '❄️' },
  80: { label: 'Regenschauer', icon: '🌦️' },
  81: { label: 'Starke Schauer', icon: '🌧️' },
  95: { label: 'Gewitter', icon: '⛈️' },
}
