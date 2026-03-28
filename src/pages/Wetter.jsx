import useWeather from '../hooks/useWeather'
import { weatherDescriptions } from '../services/weather'
import { Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react'

export default function Wetter() {
  const { weather, loading, error } = useWeather(49.64, 8.45, 3)
  const today = new Date()
  const eisheilige = new Date(today.getFullYear(), 4, 15)
  const daysUntilEisheilige = Math.ceil((eisheilige - today) / (1000 * 60 * 60 * 24))

  if (loading) return <div className="space-y-4"><div className="bg-slate-200 rounded-xl h-32 animate-pulse" /><div className="bg-slate-200 rounded-xl h-64 animate-pulse" /></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">{error}</div>

  const { current, forecast, frostRisk, rainExpected } = weather
  const desc = weatherDescriptions[current.weatherCode] || { label: '—', icon: '🌡️' }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Wetter</h2>
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-4xl font-bold text-slate-800">{Math.round(current.temperature)}°C</div>
            <div className="text-slate-500">{desc.label}</div>
          </div>
          <div className="text-5xl">{desc.icon}</div>
        </div>
        <div className="flex gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {current.humidity}%</span>
          <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {Math.round(current.windSpeed)} km/h</span>
        </div>
      </div>
      {frostRisk && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Frostgefahr in den nächsten Tagen!</span>
        </div>
      )}
      {rainExpected && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
          <Droplets className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Regen erwartet — nicht gießen</span>
        </div>
      )}
      {daysUntilEisheilige > 0 && daysUntilEisheilige <= 60 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{daysUntilEisheilige}</div>
          <div className="text-sm text-amber-600">Tage bis Eisheilige (15. Mai)</div>
          <div className="text-xs text-slate-500 mt-1">Frostempfindliche Pflanzen erst danach rausstellen</div>
        </div>
      )}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-3">7-Tage-Vorhersage</h3>
        <div className="space-y-2">
          {forecast.map((day) => {
            const dayDesc = weatherDescriptions[day.weatherCode] || { icon: '—' }
            const isFrosty = day.minTemp <= 3
            return (
              <div key={day.date} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="w-24 text-sm">{new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                <span className="text-lg">{dayDesc.icon}</span>
                <div className="flex items-center gap-2 text-sm">
                  <span className={isFrosty ? 'text-red-600 font-bold' : 'text-blue-500'}>{Math.round(day.minTemp)}°</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-orange-500">{Math.round(day.maxTemp)}°</span>
                </div>
                <div className="w-16 text-right text-xs text-slate-500">{day.precipitation > 0 ? `${day.precipitation} mm` : '—'}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
