import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'
import useCollection from '../hooks/useCollection'

const GardenContext = createContext(null)

export function GardenProvider({ children }) {
  const { householdId } = useAuth()
  const { data: varieties, loading: varietiesLoading } = useCollection('varieties', householdId, 'name')
  const { data: beds, loading: bedsLoading } = useCollection('beds', householdId, 'name')
  const { data: plantings, loading: plantingsLoading } = useCollection('plantings', householdId)
  const { data: tasks, loading: tasksLoading } = useCollection('tasks', householdId)
  const { data: harvests, loading: harvestsLoading } = useCollection('harvests', householdId)
  const loading = varietiesLoading || bedsLoading || plantingsLoading || tasksLoading || harvestsLoading

  return (
    <GardenContext.Provider value={{ varieties, beds, plantings, tasks, harvests, loading }}>
      {children}
    </GardenContext.Provider>
  )
}

export function useGarden() {
  const ctx = useContext(GardenContext)
  if (!ctx) throw new Error('useGarden must be used within GardenProvider')
  return ctx
}
