import { weatherDescriptions } from '../services/weather'

export default function WeatherWidget({ weather }) {
  if (!weather) return <div className="bg-slate-800 rounded-xl p-4 animate-pulse h-24" />
  const { current } = weather
  const desc = weatherDescriptions[current.weatherCode] || { label: '—', icon: '🌡️' }
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl font-bold">{Math.round(current.temperature)}°C</div>
          <div className="text-slate-400 text-sm">{desc.label}</div>
        </div>
        <div className="text-4xl">{desc.icon}</div>
      </div>
      <div className="flex gap-4 mt-3 text-xs text-slate-400">
        <span>💧 {current.humidity}%</span>
        <span>💨 {Math.round(current.windSpeed)} km/h</span>
      </div>
    </div>
  )
}
