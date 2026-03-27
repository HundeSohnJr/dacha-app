export function getKW(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

export function isInKWRange(kw, range) {
  if (!range) return false
  return kw >= range[0] && kw <= range[1]
}

export function getKWProgress(kw, range) {
  if (kw < range[0]) return 0
  if (kw > range[1]) return 1
  return (kw - range[0]) / (range[1] - range[0])
}
