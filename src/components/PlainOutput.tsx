import { CopyButton } from './CopyButton'
import { DownloadButton } from './DownloadButton'

export function PlainOutput({
  prompt,
  text,
  filename,
}: {
  prompt: string
  text: string
  filename: string
}) {
  return (
    <div className="mb-[22px] overflow-hidden rounded-[3px] border border-border bg-bg-grid">
      <div className="flex items-center justify-between border-b border-border-soft bg-surface-raised px-3.5 py-[9px]">
        <span className="font-mono text-[11.5px] text-text-dim">
          <b className="font-semibold text-amber">[radius@export]</b> &gt; {prompt}
        </span>
        <div className="flex gap-2">
          <CopyButton text={text} />
          <DownloadButton text={text} filename={filename} />
        </div>
      </div>
      <pre className="max-h-[420px] overflow-auto p-[14px_18px] font-mono text-[12.5px] leading-[1.75] whitespace-pre text-teal">
        {text}
      </pre>
    </div>
  )
}
