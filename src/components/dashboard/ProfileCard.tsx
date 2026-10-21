import { Check, Heart, MapPin, Shield, Star, Undo2, X } from 'lucide-react'
import { intentLabel, type Profile } from '../../lib/discover'

const round = 'flex items-center justify-center rounded-full border border-[#efe8d8] bg-white shadow-[0_6px_16px_rgba(21,18,14,0.08)] disabled:opacity-40'

type Props = {
  profile: Profile | null
  /** Why there is no profile to show. */
  emptyReason: 'limit' | 'none'
  hoursLeft: number
  saved: boolean
  canUndo: boolean
  onPass: () => void
  onLike: () => void
  onUndo: () => void
  onSave: () => void
}

function Photo({ profile }: { profile: Profile }) {
  if (profile.photo) {
    return <img src={profile.photo} alt={`${profile.name}, ${profile.age}`} className="absolute inset-0 size-full object-cover" />
  }
  // No photo yet: a gold tile with the initial, darkened at the bottom so the text stays readable.
  return (
    <div
      role="img"
      aria-label={`${profile.name}, ${profile.age}`}
      className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(21,18,14,0)_45%,rgba(21,18,14,0.78)_100%),linear-gradient(150deg,#d3ac5a,#8b6b1f)] font-serif text-[120px] text-ink/70"
    >
      {profile.name[0]}
    </div>
  )
}

export function ProfileCard({ profile, emptyReason, hoursLeft, saved, canUndo, onPass, onLike, onUndo, onSave }: Props) {
  const disabled = !profile
  return (
    <section aria-label="Suggested profile" className="flex flex-col items-center">
      {profile ? (
        <div className="relative h-[473px] w-full max-w-[378px] overflow-hidden rounded-[24px] shadow md:h-[557.5px]-[0_24px_48px_rgba(21,18,14,0.18)]">
          <Photo profile={profile} />
          <div className="absolute left-4 top-[18px] hidden gap-[5.5px] md:flex" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-[3px] w-[54.5px] ${i < 3 ? 'bg-white' : 'bg-[#b7af9c]'}`} />
            ))}
          </div>
          <div className="absolute inset-x-4 bottom-[26px] text-cream md:bottom-[20px]">
            <div className="flex items-center gap-[9px]">
              <h2 className="font-serif text-[24px] font-semibold leading-8">{profile.name}</h2>
              <span className="text-[14px]">{profile.age}</span>
              {profile.verified && (
                <span className="flex size-[18px] items-center justify-center rounded-full bg-[#c9922e] text-ink" title="ID-verified">
                  <Check size={11} strokeWidth={2.5} />
                </span>
              )}
            </div>
            <p className="mt-[3.5px] flex items-center gap-2 text-[14px] leading-6 text-cream/90">
              <MapPin size={13} strokeWidth={1.5} /> {profile.location} · {intentLabel(profile.intent)}
            </p>
            <p className="mt-[4px] max-w-[300px] font-serif text-[14px] italic leading-[22.5px]">{profile.prompt}</p>
          </div>
        </div>
      ) : (
        <div className="flex h-[473px] w-full max-w-[378px] flex-col items-center justify-center md:h-[557.5px] rounded-[24px] border border-[#e4dcd1] bg-white px-10 text-center">
          <h2 className="font-serif text-[16px] font-semibold leading-6 text-ink">
            {emptyReason === 'limit' ? "You've used today's introductions" : 'No more profiles right now'}
          </h2>
          <p className="mt-1 text-[14px] leading-[22px] text-[#5c5748]">
            {emptyReason === 'limit'
              ? `Fresh introductions arrive in ${hoursLeft}h. Quality over quantity.`
              : 'Try widening your filters to see more people.'}
          </p>
        </div>
      )}

      <div className="mt-[16.5px] flex items-center gap-[18px]">
        <button type="button" aria-label="Pass" disabled={disabled} onClick={onPass} className={`${round} size-14 text-[#5c5748]`}><X size={20} strokeWidth={1.5} /></button>
        <button type="button" aria-label="Undo" disabled={!canUndo} onClick={onUndo} className={`${round} size-[46px] text-[#8a6a1f]`}><Undo2 size={18} strokeWidth={1.5} /></button>
        <button
          type="button"
          aria-label="Like"
          disabled={disabled}
          onClick={onLike}
          className="flex size-16 items-center justify-center rounded-full bg-[linear-gradient(150deg,#deab55,#c07f2e)] text-ink shadow-[0_6px_16px_rgba(21,18,14,0.08)] disabled:opacity-40"
        >
          <Heart size={24} fill="currentColor" strokeWidth={0} />
        </button>
        <button type="button" aria-label={saved ? 'Remove from saved' : 'Save for later'} aria-pressed={saved} disabled={disabled} onClick={onSave} className={`${round} size-[46px] text-[#a8452a]`}>
          <Star size={18} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <p className="mt-[24.5px] flex items-center gap-3 text-[12px] text-[#5c5748]">
        <Shield size={14} strokeWidth={1.5} className="text-[#8a6a1f]" /> Every profile here is ID-verified before you ever see it
      </p>
    </section>
  )
}
