import { useState } from 'react'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useGarden } from '../context/GardenContext'
import { normalizeStatus } from '../utils/plantingStatus'
import { X, Trash2 } from 'lucide-react'

export default function EditPlantingSheet({ planting, varietyName, onClose }) {
  const { beds } = useGarden()
  const [bedId, setBedId] = useState(planting.bedId)
  const [status, setStatus] = useState(normalizeStatus(planting.status))
  const [notes, setNotes] = useState(planting.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async () => {
    if (saving) return
    setSaving(true)
    await updateDoc(doc(db, 'plantings', planting.id), {
      bedId,
      status,
      notes: notes.trim() || null,
    })
    onClose()
  }

  const remove = async () => {
    if (saving) return
    setSaving(true)
    await deleteDoc(doc(db, 'plantings', planting.id))
    onClose()
  }

  const statuses = ['geplant', 'aktiv', 'fertig']
  const statusLabels = { geplant: 'Geplant', aktiv: 'Aktiv', fertig: 'Fertig' }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{varietyName}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Beet</label>
          <select
            value={bedId}
            onChange={(e) => setBedId(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
          >
            {beds.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
          <div className="flex gap-2">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  status === s ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Notizen</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notizen..."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>

        <div className="border-t border-slate-200 pt-4">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-red-500 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> Pflanzung löschen
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600"
              >
                Abbrechen
              </button>
              <button
                onClick={remove}
                disabled={saving}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                Wirklich löschen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
