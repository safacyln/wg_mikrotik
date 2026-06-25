import type { ReactNode } from 'react'

export function Field({
  label,
  children,
}: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-2 text-left">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#11141c] px-4 py-2.5 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30'
