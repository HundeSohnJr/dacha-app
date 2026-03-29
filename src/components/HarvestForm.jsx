import { useState } from 'react'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useGarden } from '../context/GardenContext'

export default function HarvestForm({ onClose }) {
  const { plantings, varieties } = useGarden()
  const { householdId } = useAuth()
  const [plantingId, setPlantingId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [quality, setQuality] = useState('good')
  const activePlantings = plantings.filter((p) => p.status !== 'done')
  const getPlantingName = (p) => p.customName || varieties.find((v) => v.id === p.varietyId)?.name || '—'

  const handleSubmit = async (e) => {
    e.preventDefault()
    await addDoc(collection(db, 'harvests'), {
      plantingId, date: new Date(), quantity: parseFloat(quantity), unit, quality, householdId,
    })
    onClose?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-slate-200 rounded-xl p-4">
      <h3 className="font-semibold text-sm">Ernte erfassen</h3>
      <select value={plantingId} onChange={(e) => setPlantingId(e.target.value)} required
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm">
        <option value="">Pflanzung wählen...</option>
        {activePlantings.map((p) => <option key={p.id} value={p.id}>{getPlantingName(p)}</option>)}
      </select>
      <div className="flex gap-2">
        <input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Menge" required
          className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm" />
        <select value={unit} onChange={(e) => setUnit(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm">
          <option value="kg">kg</option><option value="stück">Stück</option><option value="bund">Bund</option>
        </select>
      </div>
      <div className="flex gap-2">
        {['great', 'good', 'poor'].map((q) => (
          <button key={q} type="button" onClick={() => setQuality(q)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium ${quality === q ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {q === 'great' ? 'Super' : q === 'good' ? 'Gut' : 'Mäßig'}
          </button>
        ))}
      </div>
      <button type="submit" className="w-full py-2.5 bg-green-600 rounded-xl text-sm font-medium text-white">Speichern</button>
    </form>
  )
}
