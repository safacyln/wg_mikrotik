import type { ReactNode } from 'react'

export function Field({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-[7px] text-left">
      <span className="text-[12.5px] font-medium text-text-muted">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-[3px] border border-border bg-bg px-3 py-2.5 font-mono text-[13.5px] text-text outline-none transition placeholder:text-text-dim focus:border-teal focus:shadow-[0_0_0_3px_rgba(86,230,201,0.12)]'
