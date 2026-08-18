import type { ReactNode } from 'react'

export function VerdictCard({
  positive,
  title,
  subtitle,
}: {
  positive: boolean
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <div
      className={`mb-[22px] flex items-center gap-4 rounded-[3px] border px-6 py-5 ${
        positive
          ? 'border-teal-dim bg-teal/[0.06]'
          : 'border-danger/35 bg-danger/[0.06]'
      }`}
    >
      <div
        className={`flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full ${
          positive ? 'bg-teal/15 text-teal' : 'bg-danger/15 text-danger'
        }`}
      >
        {positive ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        )}
      </div>
      <div>
        <div className={`mb-[3px] text-[15px] font-semibold ${positive ? 'text-teal' : 'text-danger'}`}>
          {title}
        </div>
        <div className="font-mono text-[12.5px] text-text-muted">{subtitle}</div>
      </div>
    </div>
  )
}
