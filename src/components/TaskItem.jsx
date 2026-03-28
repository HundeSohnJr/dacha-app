import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { taskTypeLabels } from '../utils/formatters'
import { CheckCircle2, Circle } from 'lucide-react'

export default function TaskItem({ task }) {
  const { user } = useAuth()
  const toggle = async () => {
    await updateDoc(doc(db, 'tasks', task.id), {
      completed: !task.completed,
      completedDate: task.completed ? null : new Date(),
      completedBy: task.completed ? null : (user.displayName || user.email),
    })
  }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${task.completed ? 'bg-slate-50 border-slate-200' : 'bg-white border border-slate-200'}`}>
      <button onClick={toggle} className={`flex-shrink-0 ${task.completed ? 'text-green-600' : 'text-slate-400 hover:text-green-600'}`}>
        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{taskTypeLabels[task.type] || task.type}</span>
          {task.assignedTo && <span>• {task.assignedTo}</span>}
        </div>
      </div>
    </div>
  )
}
