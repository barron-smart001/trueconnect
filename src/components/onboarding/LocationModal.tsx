import { MapPinned, X } from 'lucide-react'

type Props = { location: string; onClose: () => void; onConfirm: () => void }

export function LocationModal({ location, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 md:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-title"
        className="relative w-full max-w-[402px] rounded-[28px] bg-cream px-6 pb-6 pt-6 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="ml-auto flex size-9 items-center justify-center rounded-full border border-[#e4dcd1] text-ink"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <MapPinned size={49} strokeWidth={1.25} className="mx-auto mt-6 text-[#8a6a1f]" aria-hidden />
        <h2 id="location-title" className="mt-4 font-serif text-[18px] font-semibold leading-6 text-ink">
          New Location Detected
        </h2>
        <p className="mt-[7px] text-[14px] leading-[22px] text-[#5c5748]">
          We detected you may have moved to <span className="text-[#8a6a1f]">{location}.</span>
          <br />
          Confirm this location to update your profile
        </p>
        <div className="mt-6 flex gap-[23px]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-md border-[1.5px] border-[#e4dcd1] bg-[#efe8d8] text-[14px] font-medium text-ink"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[38px] flex-1 self-center rounded-md bg-gold text-[14px] font-medium text-ink"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  )
}
