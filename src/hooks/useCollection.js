import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'

export default function useCollection(collectionName, householdId, orderField) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!householdId) {
      setData([])
      setLoading(false)
      return
    }
    const constraints = [where('householdId', '==', householdId)]
    if (orderField) constraints.push(orderBy(orderField))
    const q = query(collection(db, collectionName), ...constraints)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setData(items)
      setLoading(false)
    })
    return unsubscribe
  }, [collectionName, householdId, orderField])

  return { data, loading }
}
