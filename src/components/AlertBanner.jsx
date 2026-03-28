import { Droplets, Snowflake } from 'lucide-react'

export default function AlertBanner({ weather }) {
  if (!weather) return null
  const alerts = []
  if (weather.frostRisk) {
    const coldestDay = weather.forecast.reduce((min, d) => d.minTemp < min.minTemp ? d : min)
    alerts.push({
      type: 'frost', icon: <Snowflake className="w-5 h-5" />,
      message: `Frostalarm: ${coldestDay.minTemp}°C erwartet — Jungpflanzen abdecken!`,
      color: 'bg-red-50 border-red-500 text-red-700',
    })
  }
  if (weather.rainExpected) {
    alerts.push({
      type: 'rain', icon: <Droplets className="w-5 h-5" />,
      message: 'Regen erwartet — nicht gießen heute',
      color: 'bg-blue-50 border-blue-500 text-blue-700',
    })
  }
  if (alerts.length === 0) return null
  return (
    <div className="flex flex-col gap-2 mb-4">
      {alerts.map((alert) => (
        <div key={alert.type} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${alert.color}`}>
          {alert.icon}
          <span className="text-sm font-medium">{alert.message}</span>
        </div>
      ))}
    </div>
  )
}
