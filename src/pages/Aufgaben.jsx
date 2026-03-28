import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import TaskItem from '../components/TaskItem'
import TemplateBrowser from '../components/TemplateBrowser'
import { getKW } from '../utils/kw'
import { kategorieOrder } from '../utils/formatters'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Plus, ChevronDown, ChevronRight } from 'lucide-react'

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2, blocked: 3 }

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1))
}

function groupByKategorie(tasks) {
  const groups = {}
  for (const task of tasks) {
    const kat = task.kategorie || 'Aussaat & Pflanzung'
    if (!groups[kat]) groups[kat] = []
    groups[kat].push(task)
  }
  for (const kat of Object.keys(groups)) {
    groups[kat] = sortByPriority(groups[kat])
  }
  return groups
}

export default function Aufgaben() {
  const { tasks, loading } = useGarden()
  const { householdId } = useAuth()
  const [selectedKategorie, setSelectedKategorie] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [blockedOpen, setBlockedOpen] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)

  const currentKW = getKW()
  const thisWeekTasks = tasks.filter((t) => t.dueKW === currentKW)
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueKW < currentKW)

  // Only incomplete tasks for the main view
  const incompleteTasks = thisWeekTasks.filter((t) => !t.completed && t.priority !== 'blocked')
  const blockedTasks = thisWeekTasks.filter((t) => t.priority === 'blocked')

  // Determine which categories are present in this week's tasks
  const presentCategories = Array.from(
    new Set(incompleteTasks.map((t) => t.kategorie || 'Aussaat & Pflanzung'))
  ).sort((a, b) => {
    const ai = kategorieOrder.indexOf(a)
    const bi = kategorieOrder.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  // Apply category filter
  const filteredTasks = selectedKategorie
    ? incompleteTasks.filter((t) => (t.kategorie || 'Aussaat & Pflanzung') === selectedKategorie)
    : incompleteTasks

  // Group by kategorie and sort groups by kategorieOrder
  const groups = groupByKategorie(filteredTasks)
  const orderedGroupKeys = Object.keys(groups).sort((a, b) => {
    const ai = kategorieOrder.indexOf(a)
    const bi = kategorieOrder.indexOf(b)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await addDoc(collection(db, 'tasks'), {
      title: newTitle.trim(), type: 'custom', dueKW: currentKW,
      dueYear: new Date().getFullYear(), assignedTo: null,
      completed: false, completedDate: null, completedBy: null, householdId,
      kategorie: null, templateId: null,
    })
    setNewTitle('')
    setShowAdd(false)
  }

  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="bg-slate-200 rounded-xl h-16 animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aufgaben</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add custom task form */}
      {showAdd && (
        <form onSubmit={addTask} className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Neue Aufgabe..."
            autoFocus
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none"
          />
          <button type="submit" className="px-4 py-2.5 bg-green-600 rounded-xl text-sm font-medium text-white">
            Hinzufügen
          </button>
        </form>
      )}

      {/* Category filter chips */}
      {presentCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedKategorie(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
              selectedKategorie === null
                ? 'bg-green-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Alle
          </button>
          {presentCategories.map((kat) => (
            <button
              key={kat}
              onClick={() => setSelectedKategorie(selectedKategorie === kat ? null : kat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedKategorie === kat
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {kat}
            </button>
          ))}
        </div>
      )}

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-500 mb-2">
            Überfällig ({overdueTasks.length})
          </h3>
          <div className="space-y-2">
            {overdueTasks.map((t) => <TaskItem key={t.id} task={t} />)}
          </div>
        </div>
      )}

      {/* Grouped tasks */}
      {orderedGroupKeys.length > 0 ? (
        <div className="space-y-4">
          {orderedGroupKeys.map((kat) => (
            <div key={kat}>
              <h3 className="text-sm font-semibold text-slate-500 mb-2">{kat}</h3>
              <div className="space-y-2">
                {groups[kat].map((t) => <TaskItem key={t.id} task={t} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        blockedTasks.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">Keine Aufgaben diese Woche</p>
        )
      )}

      {/* Blocked section — collapsible */}
      {blockedTasks.length > 0 && (
        <div>
          <button
            onClick={() => setBlockedOpen(!blockedOpen)}
            className="flex items-center gap-1 text-sm font-semibold text-slate-400 mb-2"
          >
            {blockedOpen
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
            Verschoben ({blockedTasks.length})
          </button>
          {blockedOpen && (
            <div className="space-y-2">
              {blockedTasks.map((t) => <TaskItem key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}

      {/* + Weitere Aufgaben button */}
      <button
        onClick={() => setShowBrowser(true)}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Weitere Aufgaben
      </button>

      {showBrowser && <TemplateBrowser onClose={() => setShowBrowser(false)} />}
    </div>
  )
}
