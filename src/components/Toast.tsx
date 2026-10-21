import { CircleCheck } from 'lucide-react'

export function Toast({ title, children }: { title: string; children: string }) {
  return (
    <div
      role="status"
      className="fixed inset-x-[15px] top-[15px] z-50 flex gap-3 md:inset-x-auto md:right-6 md:top-6 md:w-[400px] rounded-xl border border-[#e4dcd1] bg-[#efe8d8] p-4 shadow-[0_10px_30px_rgba(21,18,14,0.12)]"
    >
      <CircleCheck size={16} strokeWidth={1.5} className="mt-[3px] shrink-0 text-ink" />
      <div>
        <p className="text-[14px] font-medium leading-[22px] text-ink">{title}</p>
        <p className="text-[14px] leading-[22px] text-[#5c5748]">{children}</p>
      </div>
    </div>
  )
}
