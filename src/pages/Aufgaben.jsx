import { useState } from 'react'
import { useGarden } from '../context/GardenContext'
import { useAuth } from '../context/AuthContext'
import TaskItem from '../components/TaskItem'
import { getKW } from '../utils/kw'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Plus } from 'lucide-react'

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2, blocked: 3 }

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 1
    const pb = PRIORITY_ORDER[b.priority] ?? 1
    return pa - pb
  })
}

export default function Aufgaben() {
  const { tasks, loading } = useGarden()
  const { householdId } = useAuth()
  const [filter, setFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const currentKW = getKW()
  const thisWeekTasks = tasks.filter((t) => t.dueKW === currentKW)
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueKW < currentKW)
  const filteredTasks = thisWeekTasks.filter((t) => {
    if (filter === 'all') return true
    if (filter === 'open') return !t.completed
    return t.assignedTo === filter
  })

  // Split into active and blocked
  const activeTasks = sortByPriority(filteredTasks.filter((t) => t.priority !== 'blocked'))
  const blockedTasks = filteredTasks.filter((t) => t.priority === 'blocked')

  const addTask = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    await addDoc(collection(db, 'tasks'), {
      title: newTitle.trim(), type: 'custom', dueKW: currentKW,
      dueYear: new Date().getFullYear(), assignedTo: null,
      completed: false, completedDate: null, completedBy: null, householdId,
    })
    setNewTitle('')
    setShowAdd(false)
  }

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-slate-200 rounded-xl h-16 animate-pulse" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Aufgaben</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="p-2 bg-green-600 rounded-lg text-white hover:bg-green-700"><Plus className="w-5 h-5" /></button>
      </div>
      {showAdd && (
        <form onSubmit={addTask} className="flex gap-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Neue Aufgabe..." autoFocus
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:border-green-500 focus:outline-none" />
          <button type="submit" className="px-4 py-2.5 bg-green-600 rounded-xl text-sm font-medium text-white">Hinzufügen</button>
        </form>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'open', 'philipp', 'nastia'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {f === 'all' ? 'Alle' : f === 'open' ? 'Offen' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {overdueTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-500 mb-2">Überfällig ({overdueTasks.length})</h3>
          <div className="space-y-2">{overdueTasks.map((t) => <TaskItem key={t.id} task={t} />)}</div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 mb-2">KW {currentKW}</h3>
        <div className="space-y-2">
          {activeTasks.map((t) => <TaskItem key={t.id} task={t} />)}
          {activeTasks.length === 0 && blockedTasks.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">Keine Aufgaben diese Woche</p>
          )}
        </div>
      </div>
      {blockedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Verschoben ({blockedTasks.length})</h3>
          <div className="space-y-2">{blockedTasks.map((t) => <TaskItem key={t.id} task={t} />)}</div>
        </div>
      )}
    </div>
  )
}
