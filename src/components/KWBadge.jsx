import { getKW } from '../utils/kw'

export default function KWBadge() {
  const kw = getKW()
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
      KW {kw}
    </span>
  )
}
