import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import { getKW } from '../utils/kw'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { X, Plus, Clock } from 'lucide-react'

export default function TemplateBrowser({ onClose }) {
  const { taskTemplates, tasks } = useGarden()
  const { householdId } = useAuth()
  const currentKW = getKW()
  const year = new Date().getFullYear()

  // Show bei_bedarf templates where current KW is in window
  const available = taskTemplates.filter((t) =>
    t.recurrence === 'bei_bedarf' &&
    t.active !== false &&
    currentKW >= t.kwStart &&
    currentKW <= t.kwEnd
  )

  // Check which ones already have an active task this week
  const existingTemplateIds = new Set(
    tasks.filter(t => t.dueKW === currentKW && t.dueYear === year && !t.completed)
      .map(t => t.templateId)
      .filter(Boolean)
  )

  const addFromTemplate = async (template) => {
    await addDoc(collection(db, 'tasks'), {
      title: template.title,
      type: 'maintenance',
      templateId: template.id,
      kategorie: template.kategorie,
      dueKW: currentKW,
      dueYear: year,
      priority: 'normal',
      priorityReason: 'Manuell hinzugefügt',
      weatherBlocked: false,
      blockedReason: null,
      precondition: template.precondition || null,
      durationMinutes: template.durationMinutes || null,
      completed: false,
      completedDate: null,
      completedBy: null,
      householdId,
    })
  }

  // Group by kategorie
  const grouped = {}
  for (const t of available) {
    if (!grouped[t.kategorie]) grouped[t.kategorie] = []
    grouped[t.kategorie].push(t)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Weitere Aufgaben</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500">Aufgaben bei Bedarf hinzufuegen (KW {currentKW})</p>

        {Object.entries(grouped).map(([kat, templates]) => (
          <div key={kat}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{kat}</h4>
            <div className="space-y-2">
              {templates.map((t) => {
                const alreadyAdded = existingTemplateIds.has(t.id)
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{t.title}</div>
                      {t.description && <div className="text-xs text-slate-500 mt-0.5">{t.description}</div>}
                      {t.durationMinutes && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3" />~{t.durationMinutes} Min
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => addFromTemplate(t)}
                      disabled={alreadyAdded}
                      className={`flex-shrink-0 p-2 rounded-lg ${
                        alreadyAdded
                          ? 'bg-slate-200 text-slate-400'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {available.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Keine optionalen Aufgaben fuer diese Woche</p>
        )}
      </div>
    </div>
  )
}
