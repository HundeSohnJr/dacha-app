import { Link } from 'react-router-dom'
import { Sun, CloudSun, Cloud } from 'lucide-react'
import { isActivePlanting } from '../utils/plantingStatus'

const sunIcons = {
  full: <Sun className="w-3 h-3 text-yellow-500 flex-shrink-0" />,
  partial: <CloudSun className="w-3 h-3 text-amber-400 flex-shrink-0" />,
  shade: <Cloud className="w-3 h-3 text-slate-400 flex-shrink-0" />,
}

export default function BedCard({ bed, plantings, varieties, compact }) {
  const activePlantings = plantings.filter((p) => p.bedId === bed.id && isActivePlanting(p))
  const hasPlantings = activePlantings.length > 0

  let preview = ''
  if (hasPlantings && varieties) {
    const names = activePlantings
      .map((p) => p.customName || varieties.find((v) => v.id === p.varietyId)?.name)
      .filter(Boolean)
    const show = compact ? 2 : 3
    if (names.length <= show) {
      preview = names.join(', ')
    } else {
      preview = names.slice(0, show).join(', ') + ` +${names.length - show}`
    }
  }

  return (
    <Link to={`/beete/${bed.id}`}
      className={`block rounded-xl border transition-colors ${
        hasPlantings ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-white border-slate-200 hover:bg-slate-50'
      } ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex items-center justify-between mb-0.5">
        <span className={`font-semibold text-slate-800 ${compact ? 'text-xs' : 'text-sm'}`}>{bed.name}</span>
        {sunIcons[bed.sunExposure]}
      </div>
      <div className={`text-slate-500 ${compact ? 'text-[10px] leading-tight' : 'text-xs'}`}>
        {preview || 'Leer'}
      </div>
    </Link>
  )
}
