/** A member's first photo, or their initial on a gold tile when they have none (or are not yet verified). */
export function MemberAvatar({ name, photo, size = 48 }: { name: string; photo?: string; size?: number }) {
  const style = { width: size, height: size }
  if (photo) {
    return <img src={photo} alt="" loading="lazy" style={style} className="shrink-0 rounded-full object-cover" />
  }
  return (
    <span
      style={style}
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-[linear-gradient(140deg,#b99432,#8b6b1f)] font-serif font-semibold text-ink"
    >
      <span style={{ fontSize: size * 0.4 }}>{(name.trim()[0] || '?').toUpperCase()}</span>
    </span>
  )
}
