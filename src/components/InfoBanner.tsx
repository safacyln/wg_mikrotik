import type { ReactNode } from 'react'

export function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[22px] flex items-start gap-3 rounded-[3px] border border-amber-dim bg-amber/[0.06] px-4 py-[13px] text-[12.5px] leading-relaxed text-text-muted">
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 flex-none text-amber"
      >
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
      <div>{children}</div>
    </div>
  )
}
