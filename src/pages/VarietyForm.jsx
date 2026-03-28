import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import { doc, addDoc, updateDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { categoryLabels } from '../utils/formatters'
import { ArrowLeft, Save } from 'lucide-react'

const emptyVariety = {
  name: '', category: 'tomato', type: '',
  sowIndoorsKW: null, sowDirectKW: null, transplantKW: null, harvestKW: null,
  sunRequirement: 'full', frostSensitive: true,
  companions: [], incompatible: [],
  succession: false, successionIntervalWeeks: null,
  selfSeeding: false, notes: '',
}

export default function VarietyForm() {
  const { varietyId } = useParams()
  const { varieties } = useGarden()
  const { householdId } = useAuth()
  const navigate = useNavigate()
  const isEdit = !!varietyId
  const existing = isEdit ? varieties.find((v) => v.id === varietyId) : null
  const [form, setForm] = useState(existing || emptyVariety)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (existing) setForm(existing) }, [existing])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const parseKWRange = (value) => {
    if (!value || !value.includes('-')) return null
    const [a, b] = value.split('-').map(Number)
    return (a && b) ? [a, b] : null
  }
  const kwRangeStr = (range) => range ? `${range[0]}-${range[1]}` : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, householdId }
    delete data.id
    if (isEdit) await updateDoc(doc(db, 'varieties', varietyId), data)
    else await addDoc(collection(db, 'varieties'), data)
    navigate('/saatgut')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-500"><ArrowLeft className="w-5 h-5" /></button>
        <h2 className="font-bold">{isEdit ? 'Sorte bearbeiten' : 'Neue Sorte'}</h2>
        <button type="submit" disabled={saving} className="p-2 text-green-600 disabled:opacity-50"><Save className="w-5 h-5" /></button>
      </div>
      <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Name" required
        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none" />
      <select value={form.category} onChange={(e) => set('category', e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm">
        {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-3">
        {[['Vorziehen (KW)', 'sowIndoorsKW', '7-11'], ['Direktsaat (KW)', 'sowDirectKW', '14-22'],
          ['Auspflanzen (KW)', 'transplantKW', '20-22'], ['Ernte (KW)', 'harvestKW', '27-42']].map(([label, field, ph]) => (
          <div key={field}>
            <label className="text-xs text-slate-500 mb-1 block">{label}</label>
            <input value={kwRangeStr(form[field])} onChange={(e) => set(field, parseKWRange(e.target.value))}
              placeholder={`z.B. ${ph}`} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-green-500 focus:outline-none" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.frostSensitive} onChange={(e) => set('frostSensitive', e.target.checked)} className="rounded" />
          Frostempfindlich
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.selfSeeding} onChange={(e) => set('selfSeeding', e.target.checked)} className="rounded" />
          Selbstaussaat
        </label>
      </div>
      <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Notizen..."
        rows={3} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none" />
    </form>
  )
}
