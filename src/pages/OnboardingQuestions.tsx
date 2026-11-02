import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock } from 'lucide-react'
import { StepHeader } from '../components/onboarding/StepHeader'
import {
  ApiError,
  getOnboardingCompatibilityDraft,
  saveOnboardingCompatibility,
  saveOnboardingCompatibilityDraft,
  type OnboardingCompatibilityDraft,
} from '../lib/api'

type Layout = 'stack' | 'row'

const questions: { key: string; title: string; options: string[]; cols: string; layout: Layout; first?: boolean }[] = [
  {
    key: 'faith',
    title: 'How big a role does faith play in your day-to-day life?',
    options: ['Not really', 'Somewhat', 'Very important', 'Central to who I am'],
    cols: 'grid-cols-3 gap-2 md:grid-cols-4',
    layout: 'stack',
    first: true,
  },
  {
    key: 'family_involvement',
    title: 'How involved is your family in your major life decisions?',
    options: ['Not very involved', 'Somewhat involved', 'Very involved', 'Central to who I am'],
    cols: 'grid-cols-1 gap-[10px] md:grid-cols-2',
    layout: 'row',
  },
  {
    key: 'conflict_approach',
    title: "When you disagree with someone you're close to, what's your instinct?",
    options: ['I need space before I talk it out', 'I want to resolve it right away', 'Depends entirely on the day', 'I usually let it go'],
    cols: 'grid-cols-1 gap-[10px] md:grid-cols-2',
    layout: 'row',
  },
  {
    key: 'relocation',
    title: 'Would you relocate for the right relationship?',
    options: ['No', 'Yes, absolutely', 'Very important'],
    cols: 'grid-cols-3 gap-2',
    layout: 'stack',
  },
]

const loveLanguages = ['Quality time', 'Acts of service', 'Words of affirmation', 'Physical touch', 'Thoughtful gifts']
const MAX_LOVE = 2

function Radio({ selected, small }: { selected: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border ${
        selected ? 'border-gold' : 'border-[#706b5c]'
      } ${small ? 'size-[18px]' : 'size-5'}`}
    >
      {selected && <span className="size-2 rounded-full bg-gold" />}
    </span>
  )
}

function QuestionBlock({ caption, title, children, tight, extra }: { caption: string; title: string; children: ReactNode; tight?: boolean; extra?: boolean }) {
  return (
    <section className={`md:pr-[2px] ${extra ? 'mt-6 pb-px' : 'mt-6'}`} aria-label={title}>
      <p className="text-[12px] leading-5 text-[#5c5748]">{caption}</p>
      <h2 className={`max-w-[520px] font-serif text-[18px] font-semibold leading-6 text-ink ${tight ? 'mb-[15px] mt-2' : 'mb-[19px] mt-[7px]'}`}>{title}</h2>
      {children}
    </section>
  )
}

function Options({ name, options, cols, layout, value, onChange }: { name: string; options: string[]; cols: string; layout: Layout; value: number; onChange: (i: number) => void }) {
  return (
    <div role="radiogroup" aria-label={name} className={`grid ${cols}`}>
      {options.map((label, i) => {
        const selected = value === i
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(i)}
            className={`rounded-lg border ${
              selected ? 'border-ink bg-ink text-cream' : 'border-[#e4dcd1] bg-cream text-[#5c5748]'
            } ${
              layout === 'stack'
                ? `flex h-[90px] flex-col items-center px-4 pt-5 md:h-[71px] md:px-0 ${selected ? 'gap-[7px] md:gap-1.5 md:pt-2.5' : 'gap-[9px] md:gap-2 md:pt-3'} text-center text-[12px] leading-[18px]`
                : 'flex h-[47px] items-center gap-[11px] pl-[15px] text-left text-[14px]'
            }`}
          >
            <Radio selected={selected} small={layout === 'row'} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function OnboardingQuestions() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState([1, 1, 0, 1])
  const [love, setLove] = useState<number[]>([0])
  const [notes, setNotes] = useState('')
  const [pending, setPending] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getOnboardingCompatibilityDraft()
      .then((draft) => {
        if (!active || !draft) return
        setAnswers(questions.map((question, index) => {
          const selected = question.options.indexOf(draft.answers[question.key])
          return selected >= 0 ? selected : [1, 1, 0, 1][index]
        }))
        setLove(draft.loveLanguages
          .map((language) => loveLanguages.indexOf(language))
          .filter((index) => index >= 0)
          .slice(0, MAX_LOVE))
        setNotes(draft.notes)
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Could not load your saved answers.')
      })
      .finally(() => { if (active) setLoadingDraft(false) })
    return () => { active = false }
  }, [])

  const toggleLove = (i: number) =>
    setLove((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : cur.length < MAX_LOVE ? [...cur, i] : cur))

  const currentAnswers = (): OnboardingCompatibilityDraft => ({
    answers: Object.fromEntries(questions.map((question, index) => [
      question.key,
      question.options[answers[index]],
    ])),
    loveLanguages: love.map((index) => loveLanguages[index]),
    notes,
  })

  async function saveDraftAndExit() {
    setPending(true)
    setError('')
    try {
      await saveOnboardingCompatibilityDraft(currentAnswers())
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your answers. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <StepHeader step={2} total={3} label="Setting up your profile" onSaveExit={() => void saveDraftAndExit()} saving={pending} disabled={loadingDraft} />

      <form
        onSubmit={async (e) => {
          e.preventDefault()
          setPending(true)
          setError('')
          try {
            await saveOnboardingCompatibility(currentAnswers())
            navigate('/onboarding/identity')
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Something went wrong while saving your answers. Please try again.')
          } finally {
            setPending(false)
          }
        }}
        className="mx-auto w-full max-w-[666px] px-4 pb-10 pt-9 md:px-0 md:pb-[88px] md:pt-[72px]"
      >
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[14px] leading-5 text-[#5c5748]">
          <Link to="/onboarding/profile" className="flex items-center gap-2">
            <ChevronLeft size={12} strokeWidth={1.5} aria-hidden /> Back to photos &amp; bio
          </Link>
          <span className="size-1.5 shrink-0 rounded-full bg-[#8a6a1f]" aria-hidden />
          <span className="font-medium text-[#8a6a1f]">Compatibility questions</span>
        </nav>

        <h1 className="mt-[25px] max-w-[600px] md:mt-6 font-serif text-[40px] leading-[48px] text-ink">A few questions before we start matching</h1>
        <p className="mt-[18px] max-w-[540px] text-[16px] leading-6 text-[#5c5748]">
          Our matching model weighs these alongside your intent and profile —<br className="md:hidden" /> they&apos;re what tell us who you&apos;ll
          actually get along with, not just who you&apos;ll<br className="md:hidden" /> like the look of.
        </p>

        <div className="mt-[23px] flex gap-3 rounded-lg border border-[#e4dcd1] bg-[#efe8d8] px-[19px] py-4 text-[14px] leading-[22px] text-[#5c5748]">
          <Lock size={14} strokeWidth={1.5} className="mt-1 shrink-0 text-[#8a6a1f]" aria-hidden />
          <p>
            <span className="font-medium text-ink">These answers are private.</span> They&apos;re used by our matching
            model only and never shown on your public profile.
          </p>
        </div>

        {questions.map((q, n) => (
          <QuestionBlock key={q.title} caption={`Question ${n + 1} of 5`} title={q.title} tight={q.first} extra={n === 2}>
            <Options
              name={q.title}
              options={q.options}
              cols={q.cols}
              layout={q.layout}
              value={answers[n]}
              onChange={(i) => setAnswers((a) => a.map((x, j) => (j === n ? i : x)))}
            />
          </QuestionBlock>
        ))}

        <QuestionBlock caption="Question 5 of 5 · Select up to two" title="How do you naturally show and receive love?">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4" role="group" aria-label="Love languages">
            {loveLanguages.map((label, i) => {
              const selected = love.includes(i)
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleLove(i)}
                  className={`h-[42px] rounded-full border text-[12px] ${
                    selected ? 'border-ink bg-ink text-cream' : 'border-[#e4dcd1] bg-[#efe8d8] text-[#5c5748]'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </QuestionBlock>

        <QuestionBlock caption="Optional" title="Anything else that would help us understand you better?">
          <textarea
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Share anything that matters to you that the questions above didn't quite cover."
            className="block h-[123px] w-full resize-none rounded-lg border border-[#e4dcd1] bg-cream px-[17px] py-[17px] text-[16px] leading-6 text-[#5c5748] outline-none placeholder:text-[#b7af9c] focus:border-gold"
          />
        </QuestionBlock>

        <div className="mt-[55px] flex flex-col-reverse items-center gap-[17px] border-t border-[#e4dcd1] pt-[19px] md:flex-row md:justify-between md:pt-4">
          <button type="button" onClick={() => void saveDraftAndExit()} disabled={pending || loadingDraft} className="text-[14px] text-[#5c5748] disabled:opacity-70">
            Save &amp; continue later
          </button>
          {error && <p role="alert" className="text-[14px] text-[#ff383c]">{error}</p>}
          <button type="submit" disabled={pending || loadingDraft} className="flex h-[38px] items-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-70">
            {loadingDraft ? 'Loading…' : pending ? 'Saving…' : 'Continue to identity verification'}
          </button>
        </div>
      </form>
    </div>
  )
}
