import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className={`rounded-[3px] border px-2.5 py-[5px] font-mono text-[11px] transition ${
        copied
          ? 'border-teal-dim text-teal'
          : 'border-border text-text-muted hover:border-teal-dim hover:text-teal'
      }`}
    >
      {copied ? 'Kopyalandı ✓' : 'Kopyala'}
    </button>
  )
}
