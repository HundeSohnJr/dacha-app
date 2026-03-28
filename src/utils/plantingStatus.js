const STATUS_MAP = {
  planned: 'geplant',
  geplant: 'geplant',
  seedling: 'aktiv',
  transplanted: 'aktiv',
  growing: 'aktiv',
  harvesting: 'aktiv',
  aktiv: 'aktiv',
  done: 'fertig',
  fertig: 'fertig',
}

const STATUS_STYLES = {
  geplant: { label: 'Geplant', bg: 'bg-blue-100', text: 'text-blue-700' },
  aktiv: { label: 'Aktiv', bg: 'bg-green-100', text: 'text-green-700' },
  fertig: { label: 'Fertig', bg: 'bg-slate-100', text: 'text-slate-500' },
}

export function normalizeStatus(status) {
  return STATUS_MAP[status] || 'aktiv'
}

export function getStatusStyle(status) {
  return STATUS_STYLES[normalizeStatus(status)] || STATUS_STYLES.aktiv
}

export function isActivePlanting(planting) {
  const s = normalizeStatus(planting.status)
  return s === 'geplant' || s === 'aktiv'
}
