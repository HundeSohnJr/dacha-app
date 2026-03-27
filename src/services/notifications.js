import { getToken } from 'firebase/messaging'
import { doc, setDoc } from 'firebase/firestore'
import { getMessagingInstance } from './firebase'
import { db } from './firebase'

export async function requestNotificationPermission(userId, householdId) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null
  const messaging = await getMessagingInstance()
  if (!messaging) return null
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  const token = await getToken(messaging, { vapidKey })
  await setDoc(doc(db, 'fcmTokens', userId), {
    token, householdId, updatedAt: new Date(),
  })
  return token
}
