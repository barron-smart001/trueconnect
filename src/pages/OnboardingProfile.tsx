import { useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, Plus, X } from 'lucide-react'
import { StepHeader } from '../components/onboarding/StepHeader'
import { completeStep } from '../lib/onboarding'

const controlClass =
  'h-10 w-full rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-4 text-[14px] text-[#5c5748] outline-none placeholder:text-[#5c5748] focus:border-gold'
const labelClass = 'mb-1.5 block text-[14px] font-medium leading-5 text-[#5c5748]'

const MAX_PHOTOS = 6
const MIN_PHOTOS = 3
const MAX_BIO = 500

// `placeholder` slots stand in for photos until real uploads exist.
type Photo = { kind: 'placeholder' } | { kind: 'upload'; url: string }

const prompts = ['A perfect Sunday looks like…', 'My love language is…', 'Non-negotiable for me is…', 'Family means…']

const dos = [
  'Use a clear, recent photo of your face as your main image',
  'Include at least one full-length photo',
  'Show a little of your life — travel, hobbies, friends',
]
const avoids = [
  "Group photos as your main image — we can't tell who you are",
  'Heavy filters or photos older than two years',
  'Screenshots from other apps or social media',
]

function Field({ label, htmlFor, children, className = '' }: { label: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

function SelectField({ id, placeholder, options }: { id: string; placeholder: string; options: string[] }) {
  return (
    <div className="relative">
      <select id={id} name={id} defaultValue="" className={`${controlClass} cursor-pointer appearance-none pr-10`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#5c5748]" aria-hidden />
    </div>
  )
}

function PhotoSlot({ photo, index, onAdd, onRemove }: { photo: Photo | null; index: number; onAdd: (file: File) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null)

  if (!photo) {
    return (
      <>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onAdd(e.target.files[0])} />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-[282px] flex-col md:h-[283px] items-center justify-center gap-[6px] rounded-lg border border-dashed border-[#e4dcd1] bg-[#efe8d8] text-[12px] text-[#5c5748]"
        >
          <Plus size={18} strokeWidth={2} className="text-[#8a6a1f]" aria-hidden />
          Add photo
        </button>
      </>
    )
  }

  return (
    <div className="relative h-[282px] overflow-hidden md:h-[283px] rounded-lg border border-[#a2853b] bg-[linear-gradient(150deg,#8a6a1f,#c9a33a)]">
      {photo.kind === 'upload' ? (
        <img src={photo.url} alt={`Photo ${index + 1}`} className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-serif text-[30px] text-[#4f401a] md:text-[40px]">A</span>
      )}
      {index === 0 && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/50 px-[9px] py-0.5 text-[11px] leading-4 text-cream">Main photo</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-ink/55 text-[#80631e]"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  )
}

export function OnboardingProfile() {
  const navigate = useNavigate()
  const [bio, setBio] = useState('')
  const [photos, setPhotos] = useState<(Photo | null)[]>([
    { kind: 'placeholder' },
    { kind: 'placeholder' },
    { kind: 'placeholder' },
    null,
    null,
    null,
  ])
  const [prompt, setPrompt] = useState(0)
  const added = photos.filter(Boolean).length

  const setSlot = (i: number, photo: Photo | null) => setPhotos((p) => p.map((x, j) => (j === i ? photo : x)))

  return (
    <div className="min-h-screen bg-cream">
      <StepHeader step={1} total={3} label="Setting up your profile" />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          completeStep('profile')
          navigate('/onboarding/questions')
        }}
        className="mx-auto w-full max-w-[666px] px-4 pb-10 pt-9 md:px-0 md:pb-[60px] md:pt-[72px]"
      >
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] leading-5 text-[#5c5748]">
          <Link to="/onboarding" className="flex items-center gap-2">
            <ChevronLeft size={12} strokeWidth={1.5} aria-hidden /> Back to setup
          </Link>
          <span className="size-1.5 shrink-0 rounded-full bg-[#8a6a1f]" aria-hidden />
          <span className="font-medium text-[#8a6a1f]">Photos &amp; bio</span>
        </nav>

        <h1 className="mt-[25px] font-serif md:mt-6 text-[40px] leading-[48px] text-ink">Show members the real you</h1>
        <p className="mt-[18px] max-w-[510px] text-[16px] leading-6 text-[#5c5748]">
          This is what people see first — good photos and an honest bio matter<br className="md:hidden" /> more here than a perfectly written profile. You can always change this<br className="md:hidden" /> later.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-x-6">
          <Field label="Full Name" htmlFor="name" className="md:col-span-2">
            <input id="name" name="name" type="text" defaultValue="John Doe" autoComplete="name" className={controlClass} />
          </Field>

          <Field label="Date of Birth *" htmlFor="dob">
            <div className="relative">
              <input id="dob" name="dob" type="text" placeholder="DD/MM/YY" inputMode="numeric" required className={`${controlClass} pr-10`} />
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#5c5748]" aria-hidden />
            </div>
          </Field>
          <Field label="Gender *" htmlFor="gender" className="mt-2 md:mt-0">
            <SelectField id="gender" placeholder="Select your gender" options={['Female', 'Male', 'Prefer not to say']} />
          </Field>

          <Field label="Phone Number *" htmlFor="phone">
            <div className={`${controlClass} flex items-center gap-[10px] focus-within:border-gold`}>
              <span className="flex items-center gap-2">+234 <ChevronDown size={12} aria-hidden /></span>
              <input id="phone" name="phone" type="tel" defaultValue="90836754567" required className="min-w-0 flex-1 bg-transparent outline-none" />
            </div>
          </Field>
          <Field label="Location (Auto-detected)" htmlFor="location" className="mt-2 md:mt-0">
            <input id="location" name="location" type="text" defaultValue="Lagos, Nigeria" readOnly className={controlClass} />
          </Field>

          <Field label="What are you looking for? *" htmlFor="intent" className="md:col-span-2">
            <SelectField id="intent" placeholder="Select your interest" options={['Marriage-minded', 'Meaningful Dating', 'Concierge & discreet']} />
          </Field>
        </div>

        <div className="mt-[25px] flex items-center justify-between">
          <label htmlFor="bio" className="text-[16px] font-semibold leading-6 text-ink">About you</label>
          <span className="text-[14px] text-[#5c5748]">{bio.length} / {MAX_BIO}</span>
        </div>
        <textarea
          id="bio"
          name="bio"
          value={bio}
          maxLength={MAX_BIO}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell members who you are, what you value, and what you're looking for. Specifics are more interesting than generic — talk about your week, not just your job title."
          className="mt-[15px] block h-[153px] w-full resize-none rounded-lg border border-[#e4dcd1] bg-cream px-[17px] py-[17px] md:h-[123px] md:px-6 text-[16px] leading-6 text-[#5c5748] outline-none placeholder:text-[#b7af9c] focus:border-gold"
        />
        <p className="mt-[5px] text-[12px] leading-5 text-[#5c5748]">Members with a written bio get matched up to twice as often.</p>

        <div className="mt-[25px] flex items-center justify-between">
          <h2 className="font-serif text-[18px] font-semibold leading-6 text-ink">Your photos</h2>
          <span className="mr-4 text-[12px] text-[#5c5748]">{added} of {MAX_PHOTOS} added · {MIN_PHOTOS} minimum</span>
        </div>
        <div className="mt-[15px] grid gap-4 md:mr-[2px] md:grid-cols-3 md:gap-[14px]">
          {photos.map((photo, i) => (
            <PhotoSlot
              key={i}
              photo={photo}
              index={i}
              onAdd={(file) => setSlot(i, { kind: 'upload', url: URL.createObjectURL(file) })}
              onRemove={() => setSlot(i, null)}
            />
          ))}
        </div>

        <section className="mt-6 grid gap-3.5 md:mr-[2px] rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-6 pb-[23px] pt-[22px] md:grid-cols-[313px_1fr] md:gap-0" aria-label="Photo tips">
          <div className="md:mt-[11px]">
            <h3 className="text-[14px] font-semibold leading-5 text-[#5f7a56]">Do</h3>
            <ul className="mt-[11px] space-y-[5px] text-[14px] leading-[22px] text-[#5c5748]">
              {dos.map((t) => (
                <li key={t} className="flex items-center gap-2 md:max-w-[285px]">
                  <Check size={11} strokeWidth={2} className="shrink-0 text-[#5f7a56]" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[14px] font-semibold leading-5 text-[#a64b34]">Avoid</h3>
            <ul className="mt-[11px] space-y-[5px] text-[14px] leading-[22px] text-[#5c5748]">
              {avoids.map((t) => (
                <li key={t} className="flex items-center gap-2 md:max-w-[285px]">
                  <X size={11} strokeWidth={2} className="shrink-0 text-[#a64b34]" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <p className="mt-[25px] text-[16px] leading-6 text-ink">
          Add a prompt <span className="text-[#5c5748]">(optional, but it helps)</span>
        </p>
        <div className="mt-[7px] flex flex-col items-start gap-4 md:flex-row md:flex-wrap" role="radiogroup" aria-label="Prompt">
          {prompts.map((p, i) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={prompt === i}
              onClick={() => setPrompt(i)}
              className={`h-[42px] rounded-full border px-4 text-[12px] ${
                prompt === i ? 'border-ink bg-ink text-cream' : 'border-[#e4dcd1] bg-[#efe8d8] text-[#5c5748]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-[#e4dcd1] bg-cream px-4 pb-[15px] pt-[17px]">
          <label htmlFor="answer" className="block font-serif text-[16px] font-semibold leading-6 text-[#8a6a1f]">{prompts[prompt]}</label>
          <input
            id="answer"
            name="answer"
            type="text"
            defaultValue="Jollof at my mum's, church in the morning, then a long walk before the week starts again."
            className="mt-[5px] block h-6 w-full bg-transparent pl-[3px] text-[16px] text-[#5c5748] outline-none"
          />
        </div>

        <div className="mt-[55px] flex flex-col-reverse items-stretch gap-[17px] border-t border-[#e4dcd1] pt-[19px] text-center md:flex-row md:items-center md:justify-between md:pt-4 md:text-left">
          <Link to="/" className="text-[14px] text-[#5c5748]">Save &amp; continue later</Link>
          <button type="submit" className="flex h-[38px] items-center justify-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink">
            Continue to compatibility questions
          </button>
        </div>
      </form>
    </div>
  )
}
