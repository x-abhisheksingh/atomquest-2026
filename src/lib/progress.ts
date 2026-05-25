export type UoMType = 'MIN' | 'MAX' | 'TIMELINE' | 'ZERO'

export function computeProgress(
  uomType: UoMType,
  target: number,
  actual: number | null
): number {
  if (actual === null || actual === undefined) return 0

  switch (uomType) {
    case 'MAX':
      // Higher is better: actual / target
      return Math.min(100, Math.round((actual / target) * 100))

    case 'MIN':
      // Lower is better: target / actual
      if (actual === 0) return 100
      return Math.min(100, Math.round((target / actual) * 100))

    case 'ZERO':
      // Target is zero: 100% if achieved 0, else 0%
      return actual === 0 ? 100 : 0

    case 'TIMELINE':
      // actual = days taken, target = days planned
      // Lower actual = better
      if (actual === 0) return 100
      return Math.min(100, Math.round((target / actual) * 100))

    default:
      return 0
  }
}

export function progressColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-500'
}

export function progressBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-yellow-400'
  return 'bg-red-400'
}
