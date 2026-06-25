import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

export function QrCode({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, text, {
      width: 220,
      margin: 1,
      color: { dark: '#0a0e14', light: '#ffffff' },
    })
  }, [text])

  return (
    <div className="inline-block rounded-lg bg-white p-3">
      <canvas ref={canvasRef} />
    </div>
  )
}
