export function DownloadButton({
  text,
  filename,
}: {
  text: string
  filename: string
}) {
  function handleDownload() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="rounded-[3px] border border-border px-2.5 py-[5px] font-mono text-[11px] text-text-muted transition hover:border-text-dim hover:text-text"
    >
      İndir
    </button>
  )
}
