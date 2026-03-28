import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { taskTypeLabels } from '../utils/formatters'
import { CheckCircle2, Circle, Snowflake, Clock } from 'lucide-react'

function PriorityBadge({ priority, priorityReason }) {
  if (!priority || !priorityReason) return null

  if (priority === 'high') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'normal') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'low') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
        {priorityReason}
      </span>
    )
  }
  if (priority === 'blocked') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-500">
        <Snowflake className="w-3 h-3" />
        {priorityReason}
      </span>
    )
  }
  return null
}

export default function TaskItem({ task }) {
  const { user } = useAuth()
  const isBlocked = task.priority === 'blocked'
  const toggle = async () => {
    await updateDoc(doc(db, 'tasks', task.id), {
      completed: !task.completed,
      completedDate: task.completed ? null : new Date(),
      completedBy: task.completed ? null : (user.displayName || user.email),
    })
  }
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
      task.completed || isBlocked
        ? 'bg-slate-50 border-slate-200'
        : 'bg-white border border-slate-200'
    }`}>
      <button onClick={toggle} className={`flex-shrink-0 ${task.completed ? 'text-green-600' : 'text-slate-400 hover:text-green-600'}`}>
        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${task.completed || isBlocked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </div>
        {task.precondition && (
          <div className="text-xs text-slate-400 mt-0.5">{task.precondition}</div>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap mt-0.5">
          <span>{taskTypeLabels[task.type] || task.type}</span>
          {task.durationMinutes && (
            <span className="inline-flex items-center gap-0.5 text-slate-400">
              <Clock className="w-3 h-3" />~{task.durationMinutes} Min
            </span>
          )}
          <PriorityBadge priority={task.priority} priorityReason={task.priorityReason} />
        </div>
      </div>
    </div>
  )
}
