const { onSchedule } = require('firebase-functions/v2/scheduler')
const admin = require('firebase-admin')
const fetch = require('node-fetch')

const db = admin.firestore()

async function fetchWeatherData(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lng,
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code',
    timezone: 'Europe/Berlin', forecast_days: '7',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error(`Weather API: ${res.status}`)
  return res.json()
}

exports.checkWeather = onSchedule(
  { schedule: 'every 6 hours', timeZone: 'Europe/Berlin' },
  async () => {
    const households = await db.collection('households').get()
    for (const doc of households.docs) {
      const { location, frostThresholdC = 3 } = doc.data()
      if (!location) continue

      const data = await fetchWeatherData(location.lat, location.lng)
      const forecast = data.daily.time.map((date, i) => ({
        date, minTemp: data.daily.temperature_2m_min[i],
        maxTemp: data.daily.temperature_2m_max[i],
        precipitation: data.daily.precipitation_sum[i],
        weatherCode: data.daily.weather_code[i],
      }))
      const frostRisk = forecast.some((d) => d.minTemp <= frostThresholdC)

      await db.doc('weather/current').set({
        temperature: data.current.temperature_2m,
        weatherCode: data.current.weather_code,
        forecast, frostRisk,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      })

      if (frostRisk) {
        const { pushFrostAlert } = require('./pushFrostAlert')
        const coldest = forecast.reduce((min, d) => d.minTemp < min.minTemp ? d : min)
        await pushFrostAlert(doc.id, coldest.minTemp)
      }
    }
  }
)
