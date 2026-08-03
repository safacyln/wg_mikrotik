import { CopyButton } from './CopyButton'
import { DownloadButton } from './DownloadButton'

export function TermOutput({
  prompt,
  text,
  filename,
}: {
  prompt: string
  text: string
  filename: string
}) {
  const lines = text.split('\n')
  return (
    <div className="mb-[22px] overflow-hidden rounded-[3px] border border-border bg-bg-grid">
      <div className="flex items-center justify-between border-b border-border-soft bg-surface-raised px-3.5 py-[9px]">
        <span className="font-mono text-[11.5px] text-text-dim">
          <b className="font-semibold text-amber">[admin@MikroTik]</b> &gt; {prompt}
        </span>
        <div className="flex gap-2">
          <CopyButton text={text} />
          <DownloadButton text={text} filename={filename} />
        </div>
      </div>
      <div className="term-body">
        <div className="term-lines">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="term-code">{text}</div>
      </div>
    </div>
  )
}
