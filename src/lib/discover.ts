// Dashboard filter values and display labels. Matching is performed by the database.

export type ShowMe = 'Women' | 'Men' | 'Everyone'
export type Intent = 'Marriage Minded' | 'Meaningful Dating' | 'Concierge'

export type Filters = {
  show: ShowMe
  looking: Intent
  /** Slider positions, 0–1. */
  age: number
  distance: number
  trust: number
  verifiedOnly: boolean
  /** Only shown in the mobile filters. */
  activeThisWeek: boolean
}

// The Figma frame's thumbs sit 79px along a 256px track.
export const DEFAULT_POSITION = 79 / 256

export const DEFAULT_FILTERS: Filters = {
  show: 'Women',
  looking: 'Marriage Minded',
  age: DEFAULT_POSITION,
  distance: DEFAULT_POSITION,
  trust: DEFAULT_POSITION,
  verifiedOnly: true,
  activeThisWeek: true,
}

// Slider position → value. At the default position these give the frame's labels: "27 – 36", "Within 50km", "80+".
export const ageRange = (p: number): [number, number] => {
  const start = Math.round(18 + p * 30)
  return [start, start + 9]
}
export const distanceKm = (p: number) => Math.max(5, Math.round((p * 162) / 5) * 5)
export const minTrust = (p: number) => Math.round(71 + p * 29)

export const ageLabel = (p: number) => ageRange(p).join(' – ')
export const distanceLabel = (p: number) => `Within ${distanceKm(p)}km`
export const trustLabel = (p: number) => `${minTrust(p)}+`

/** "Marriage Minded" in the filter panel is "Marriage-minded" everywhere else. */
export const intentLabel = (intent: Intent) =>
  ({ 'Marriage Minded': 'Marriage-minded', 'Meaningful Dating': 'Meaningful dating', Concierge: 'Concierge' })[intent]

export type Profile = {
  id: string
  name: string
  age: number
  gender: 'Women' | 'Men' | 'Prefer not to say'
  location: string
  /** Distance from the signed-in member, in km. */
  distance: number
  intent: Intent
  trust: number
  verified: boolean
  prompt: string
  /** Signed photo URL. Profiles without one show an initial on a gold tile. */
  photo?: string
}

/** Whole hours until local midnight, when the daily introductions reset. */
export function hoursUntilReset(now = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000))
}
