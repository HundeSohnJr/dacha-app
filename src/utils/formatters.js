export function formatDate(date) {
  if (!date) return '—'
  const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatQuantity(quantity, unit) {
  if (quantity == null) return '—'
  const formatted = Number.isInteger(quantity) ? quantity : quantity.toFixed(1)
  return `${formatted} ${unit}`
}

export const categoryLabels = {
  tomato: 'Tomate', cucumber: 'Gurke', zucchini: 'Zucchini', squash: 'Kürbis',
  patisson: 'Patisson', aubergine: 'Aubergine', pepper: 'Paprika', bean: 'Bohne',
  pea: 'Erbse', carrot: 'Möhre', beetroot: 'Rote Bete', radish: 'Radieschen',
  lettuce: 'Salat', kohlrabi: 'Kohlrabi', cauliflower: 'Blumenkohl', broccoli: 'Brokkoli',
  kale: 'Grünkohl', herb: 'Kräuter', flower: 'Blume', onion: 'Zwiebel', root: 'Wurzelgemüse',
}

export const taskTypeLabels = {
  sow: 'Aussaat', transplant: 'Auspflanzen', harvest: 'Ernten',
  water: 'Gießen', cover: 'Abdecken', custom: 'Sonstiges',
}
