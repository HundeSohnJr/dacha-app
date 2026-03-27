import { useState, useEffect } from 'react'
import { fetchWeather } from '../services/weather'

export default function useWeather(lat, lng, frostThreshold) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchWeather(lat, lng, frostThreshold)
        if (!cancelled) { setWeather(data); setError(null) }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 30 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [lat, lng, frostThreshold])

  return { weather, loading, error }
}
