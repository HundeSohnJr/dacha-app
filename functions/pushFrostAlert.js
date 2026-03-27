const admin = require('firebase-admin')
const db = admin.firestore()

async function pushFrostAlert(householdId, minTemp) {
  const today = new Date().toISOString().split('T')[0]
  const existing = await db.collection('alerts')
    .where('householdId', '==', householdId)
    .where('type', '==', 'frost')
    .where('date', '==', today).get()
  if (!existing.empty) return

  const members = await db.collection('members')
    .where('householdId', '==', householdId).get()
  const tokenDocs = await Promise.all(
    members.docs.map((m) => db.doc(`fcmTokens/${m.id}`).get())
  )
  const tokens = tokenDocs.filter((d) => d.exists).map((d) => d.data().token)

  if (tokens.length > 0) {
    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: 'Frostalarm! ❄️',
        body: `${Math.round(minTemp)}°C erwartet — Jungpflanzen abdecken!`,
      },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    })
  }

  await db.collection('alerts').add({
    type: 'frost', householdId, date: today,
    message: `Frostalarm: ${minTemp}°C erwartet`,
    sentAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

module.exports = { pushFrostAlert }
