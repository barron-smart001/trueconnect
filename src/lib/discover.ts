// Filtering rules and demo data for the dashboard ("Home"). The deck is a stand-in for the matching service:
// replace `PROFILES` with the API response and keep `matches()` on the server side if filtering moves there.

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
  /** Only shown in the mobile filters. The demo deck has no activity data, so it does not filter yet. */
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
  id: number
  name: string
  age: number
  gender: 'Women' | 'Men'
  location: string
  /** Distance from the signed-in member, in km. */
  distance: number
  intent: Intent
  trust: number
  verified: boolean
  prompt: string
  /** Photo URL. Profiles without one show an initial on a gold tile. */
  photo?: string
}

export const PROFILES: Profile[] = [
  {
    id: 1, name: 'Tomiwa', age: 32, gender: 'Women', location: 'Lagos, Nigeria', distance: 12, intent: 'Marriage Minded',
    trust: 92, verified: true, photo: '/images/profile-tomiwa.jpg',
    prompt: '"A perfect Sunday looks like jollof at my mum\'s, then a long walk before the week starts again."',
  },
  {
    id: 2, name: 'Adaeze', age: 29, gender: 'Women', location: 'Ikeja, Nigeria', distance: 8, intent: 'Marriage Minded',
    trust: 86, verified: true,
    prompt: '"Looking for someone who laughs easily, prays together and still plans a surprise now and then."',
  },
  {
    id: 3, name: 'Zainab', age: 26, gender: 'Women', location: 'Surulere, Nigeria', distance: 15, intent: 'Meaningful Dating',
    trust: 74, verified: true,
    prompt: '"Weekend markets, long calls with my sister, and a very serious love of suya."',
  },
  {
    id: 7, name: 'Funmilayo', age: 31, gender: 'Women', location: 'Yaba, Nigeria', distance: 9, intent: 'Marriage Minded',
    trust: 82, verified: true,
    prompt: '"I keep a garden on my balcony and a list of places I still want to take someone."',
  },
  {
    id: 8, name: 'Bisi', age: 28, gender: 'Women', location: 'Ikoyi, Nigeria', distance: 14, intent: 'Marriage Minded',
    trust: 88, verified: true,
    prompt: '"Sunday service, then lunch with the whole family. Bring an appetite."',
  },
  {
    id: 9, name: 'Yetunde', age: 34, gender: 'Women', location: 'Victoria Island, Nigeria', distance: 16, intent: 'Marriage Minded',
    trust: 91, verified: true,
    prompt: '"A calm person in a loud city, looking for something that lasts."',
  },
  {
    id: 10, name: 'Kemi', age: 30, gender: 'Women', location: 'Ajah, Nigeria', distance: 27, intent: 'Marriage Minded',
    trust: 84, verified: true,
    prompt: '"Early runs by the lagoon, late dinners with friends."',
  },
  {
    id: 11, name: 'Folake', age: 27, gender: 'Women', location: 'Ikorodu, Nigeria', distance: 31, intent: 'Marriage Minded',
    trust: 80, verified: true,
    prompt: '"Teacher, reader, terrible at keeping secrets about surprise gifts."',
  },
  {
    id: 4, name: 'Ngozi', age: 36, gender: 'Women', location: 'Abuja, Nigeria', distance: 530, intent: 'Concierge',
    trust: 95, verified: true,
    prompt: '"Private by nature. Ask me about the book I am rereading for the third time."',
  },
  {
    id: 5, name: 'Chidi', age: 34, gender: 'Men', location: 'Lekki, Nigeria', distance: 11, intent: 'Marriage Minded',
    trust: 90, verified: true,
    prompt: '"Engineer by day, amateur chef by night. Family dinners are non-negotiable."',
  },
  {
    id: 6, name: 'Kwame', age: 31, gender: 'Men', location: 'Accra, Ghana', distance: 800, intent: 'Meaningful Dating',
    trust: 81, verified: false,
    prompt: '"Slow mornings, good music, and a standing Saturday football match."',
  },
]

export function matches(profile: Profile, f: Filters): boolean {
  const [minAge, maxAge] = ageRange(f.age)
  return (
    (f.show === 'Everyone' || profile.gender === f.show) &&
    profile.intent === f.looking &&
    profile.age >= minAge &&
    profile.age <= maxAge &&
    profile.distance <= distanceKm(f.distance) &&
    profile.trust >= minTrust(f.trust) &&
    (!f.verifiedOnly || profile.verified)
  )
}

export const DAILY_INTRODUCTIONS = 15
/** The frame shows 8 of 15 used. */
export const STARTING_USED = 8

/** Whole hours until local midnight, when the daily introductions reset. */
export function hoursUntilReset(now = new Date()): number {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((midnight.getTime() - now.getTime()) / 3_600_000))
}
