import { useGarden } from '../context/GardenContext'
import useWeather from '../hooks/useWeather'
import AlertBanner from '../components/AlertBanner'
import WeatherWidget from '../components/WeatherWidget'
import { getKW, isInKWRange } from '../utils/kw'
import { taskTypeLabels } from '../utils/formatters'
import { CheckCircle2 } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { tasks, varieties, loading } = useGarden()
  const { weather } = useWeather(49.64, 8.45, 3)
  const { user } = useAuth()
  const currentKW = getKW()

  const openTasks = tasks.filter((t) =>
    !t.completed && t.dueKW === currentKW &&
    (t.priority === undefined || (t.priority !== 'low' && t.priority !== 'blocked'))
  )
  const sowNowVarieties = varieties.filter((v) =>
    isInKWRange(currentKW, v.sowIndoorsKW) || isInKWRange(currentKW, v.sowDirectKW)
  )

  const completeTask = async (taskId) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      completed: true, completedDate: new Date(),
      completedBy: user.displayName || user.email,
    })
  }

  if (loading) {
    return <div className="space-y-4"><div className="bg-slate-200 rounded-xl h-24 animate-pulse" /><div className="bg-slate-200 rounded-xl h-32 animate-pulse" /></div>
  }

  return (
    <div className="space-y-4">
      <AlertBanner weather={weather} />
      <WeatherWidget weather={weather} />
      {openTasks.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold mb-3">{openTasks.length} wichtige Aufgaben</h3>
          <div className="space-y-2">
            {openTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{task.title}</div>
                  <div className="text-xs text-slate-500">{taskTypeLabels[task.type] || task.type}</div>
                </div>
                <button onClick={() => completeTask(task.id)} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {sowNowVarieties.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Jetzt aussäen (KW {currentKW})</h3>
          <div className="flex flex-wrap gap-2">
            {sowNowVarieties.map((v) => (
              <span key={v.id || v.name} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{v.name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
