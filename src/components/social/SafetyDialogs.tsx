import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ApiError, REPORT_REASONS, reportMember, type ReportReason } from '../../lib/api'

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/60 p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[440px] rounded-lg border border-[#e4dcd1] bg-cream p-6 outline-none"
      >
        <h2 className="font-serif text-[24px] leading-8 text-ink">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export const secondaryButton =
  'flex h-[38px] items-center justify-center rounded-md border border-[#e4dcd1] bg-cream px-4 text-[14px] font-medium text-ink disabled:opacity-60'
export const primaryButton =
  'flex h-[38px] items-center justify-center rounded-md bg-gold px-4 text-[14px] font-medium text-ink disabled:opacity-60'

export function ReportDialog({ memberId, name, onClose, onDone }: {
  memberId: string
  name: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [details, setDetails] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!reason) {
      setError('Choose a reason for your report.')
      return
    }
    setPending(true)
    setError('')
    try {
      await reportMember(memberId, reason, details)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send your report. Please try again.')
      setPending(false)
    }
  }

  return (
    <Dialog title={`Report ${name}`} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <p className="mt-2 text-[14px] leading-[22px] text-[#5c5748]">
          Reports are confidential and reviewed by our safety team.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Reason</legend>
          {REPORT_REASONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-[14px] text-ink">
              <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} />
              {label}
            </label>
          ))}
        </fieldset>
        <label htmlFor="report-details" className="mt-4 block text-[14px] text-ink">Details (optional)</label>
        <textarea
          id="report-details"
          value={details}
          maxLength={1000}
          onChange={(event) => setDetails(event.target.value)}
          className="mt-1 block h-24 w-full resize-none rounded-lg border border-[#e4dcd1] bg-[#efe8d8] p-3 text-[14px] text-ink outline-none focus:border-gold"
        />
        {error && <p role="alert" className="mt-3 text-[14px] text-[#ff383c]">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className={secondaryButton}>Cancel</button>
          <button type="submit" disabled={pending} className={primaryButton}>{pending ? 'Sending…' : 'Send report'}</button>
        </div>
      </form>
    </Dialog>
  )
}
