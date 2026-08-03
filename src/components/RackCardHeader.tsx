export function RackCardHeader({
  unitTag,
  ready,
  readyLabel = 'üretildi',
  idleLabel = 'bekleniyor',
}: {
  unitTag: string
  ready: boolean
  readyLabel?: string
  idleLabel?: string
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <span className="font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
        {unitTag}
      </span>
      <span
        className={`flex items-center gap-[7px] font-mono text-[10.5px] ${
          ready ? 'text-teal' : 'text-text-dim'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            ready ? 'bg-teal shadow-[0_0_7px_#56e6c9]' : 'bg-amber-dim'
          }`}
        />
        {ready ? readyLabel : idleLabel}
      </span>
    </div>
  )
}
