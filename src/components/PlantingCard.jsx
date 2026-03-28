import { getStatusStyle } from '../utils/plantingStatus'

export default function PlantingCard({ planting, varietyName, onTap }) {
  const style = getStatusStyle(planting.status)

  return (
    <button
      onClick={() => onTap(planting)}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800">{varietyName}</div>
        {planting.notes && (
          <div className="text-xs text-slate-400 mt-0.5 truncate">{planting.notes}</div>
        )}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} ml-2 flex-shrink-0`}>
        {style.label}
      </span>
    </button>
  )
}
