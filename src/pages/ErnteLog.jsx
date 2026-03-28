import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { formatDate, formatQuantity } from '../utils/formatters'
import HarvestForm from '../components/HarvestForm'
import { Plus } from 'lucide-react'

export default function ErnteLog() {
  const { harvests, varieties, plantings, loading } = useGarden()
  const [showForm, setShowForm] = useState(false)
  const getVarietyName = (plantingId) => {
    const planting = plantings.find((p) => p.id === plantingId)
    if (!planting) return '—'
    return varieties.find((v) => v.id === planting.varietyId)?.name || '—'
  }
  const sortedHarvests = [...harvests].sort((a, b) => {
    const dateA = a.date?.toDate?.() ?? new Date(a.date)
    const dateB = b.date?.toDate?.() ?? new Date(b.date)
    return dateB - dateA
  })

  if (loading) return <div className="bg-slate-200 rounded-xl h-32 animate-pulse" />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Ernte-Log</h2>
        <button onClick={() => setShowForm(!showForm)} className="p-2 bg-green-600 rounded-lg text-white"><Plus className="w-5 h-5" /></button>
      </div>
      {showForm && <HarvestForm onClose={() => setShowForm(false)} />}
      <div className="space-y-2">
        {sortedHarvests.map((h) => (
          <div key={h.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <div>
              <div className="text-sm font-medium">{getVarietyName(h.plantingId)}</div>
              <div className="text-xs text-slate-500">{formatDate(h.date)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{formatQuantity(h.quantity, h.unit)}</div>
              <div className="text-xs text-slate-500">{h.quality === 'great' ? '⭐ Super' : h.quality === 'good' ? 'Gut' : 'Mäßig'}</div>
            </div>
          </div>
        ))}
        {sortedHarvests.length === 0 && <p className="text-slate-500 text-sm text-center py-8">Noch keine Ernten erfasst</p>}
      </div>
    </div>
  )
}
