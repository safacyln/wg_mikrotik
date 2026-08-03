import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { RackCardHeader } from '../components/RackCardHeader'
import { TermOutput } from '../components/TermOutput'
import { CrossStrip } from '../components/CrossStrip'
import { generateCgnatConfig, type CgnatBlock } from '../lib/cgnat'

let nextBlockId = 1

interface BlockRow extends CgnatBlock {
  id: number
}

function newBlock(
  publicCidr = '',
  privateCidr = '',
  startPort = 1000,
  portWidth = 1500,
): BlockRow {
  return { id: nextBlockId++, publicCidr, privateCidr, startPort, portWidth }
}

export function CgnatView() {
  const [iface, setIface] = useState('vlan_2756')
  const [comment, setComment] = useState('newcgnat')
  const [useUdp, setUseUdp] = useState(true)
  const [useTcp, setUseTcp] = useState(true)
  const [useIcmp, setUseIcmp] = useState(false)
  const [blocks, setBlocks] = useState<BlockRow[]>([
    newBlock('217.177.0.96/29', '100.48.15.0/29', 1000, 1500),
  ])

  const [error, setError] = useState('')
  const [output, setOutput] = useState('')

  function updateBlock(id: number, patch: Partial<CgnatBlock>) {
    setBlocks((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function removeBlock(id: number) {
    setBlocks((rows) => rows.filter((r) => r.id !== id))
  }

  function handleGenerate() {
    const config = generateCgnatConfig(
      {
        iface: iface.trim() || 'vlan_1',
        comment: comment.trim() || 'cgnat',
        useUdp,
        useTcp,
        useIcmp,
      },
      blocks,
    )

    if (!config) {
      setOutput('')
      setError('En az bir geçerli public/private CIDR çifti girin (örn. 217.177.0.96/29).')
      return
    }
    setError('')
    setOutput(config)
  }

  return (
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Netmap / Radius Üretici
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          CGNAT Netmap / RADIUS Üretici
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          Public/private blok çiftlerinden MikroTik netmap kurallarını ve port bazlı RADIUS
          eşleme dosyalarını üretir.
        </p>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <RackCardHeader unitTag="1U — Genel Ayarlar" ready={!!output} />

        <div className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] sm:grid-cols-2">
          <Field label="Out-interface (VLAN)">
            <input className={inputClass} value={iface} onChange={(e) => setIface(e.target.value)} />
          </Field>
          <Field label="Comment">
            <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 flex flex-col gap-[7px]">
          <span className="text-[12.5px] font-medium text-text-muted">Protokoller</span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-[7px] font-mono text-[12.5px] text-text-muted">
              <input
                type="checkbox"
                checked={useUdp}
                onChange={(e) => setUseUdp(e.target.checked)}
                className="h-[14px] w-[14px] accent-teal"
              />
              udp
            </label>
            <label className="flex items-center gap-[7px] font-mono text-[12.5px] text-text-muted">
              <input
                type="checkbox"
                checked={useTcp}
                onChange={(e) => setUseTcp(e.target.checked)}
                className="h-[14px] w-[14px] accent-teal"
              />
              tcp
            </label>
            <label className="flex items-center gap-[7px] font-mono text-[12.5px] text-text-muted">
              <input
                type="checkbox"
                checked={useIcmp}
                onChange={(e) => setUseIcmp(e.target.checked)}
                className="h-[14px] w-[14px] accent-teal"
              />
              icmp
            </label>
          </div>
        </div>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <div className="mb-5 flex items-center justify-between">
          <span className="font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
            2U — Bloklar
          </span>
          <button
            onClick={() => setBlocks((rows) => [...rows, newBlock()])}
            className="rounded-[3px] border border-border px-3.5 py-[7px] text-[12.5px] font-medium text-text-muted transition hover:border-text-dim hover:text-text"
          >
            + Satır ekle
          </button>
        </div>

        {blocks.map((row) => (
          <div
            key={row.id}
            className="mb-4 grid grid-cols-2 items-end gap-3.5 sm:grid-cols-[1fr_1fr_108px_108px_40px]"
          >
            <Field label="Public CIDR">
              <input
                className={inputClass}
                placeholder="217.177.0.96/29"
                value={row.publicCidr}
                onChange={(e) => updateBlock(row.id, { publicCidr: e.target.value })}
              />
            </Field>
            <Field label="Private CIDR">
              <input
                className={inputClass}
                placeholder="100.48.15.0/29"
                value={row.privateCidr}
                onChange={(e) => updateBlock(row.id, { privateCidr: e.target.value })}
              />
            </Field>
            <Field label="Başlangıç Portu">
              <input
                type="number"
                className={inputClass}
                value={row.startPort}
                onChange={(e) => updateBlock(row.id, { startPort: Number(e.target.value) })}
              />
            </Field>
            <Field label="Port Genişliği">
              <input
                type="number"
                className={inputClass}
                value={row.portWidth}
                onChange={(e) => updateBlock(row.id, { portWidth: Number(e.target.value) })}
              />
            </Field>
            <button
              onClick={() => removeBlock(row.id)}
              className="h-[38px] w-full rounded-[3px] border border-border text-base text-danger transition hover:border-danger hover:bg-danger/10"
            >
              ×
            </button>
          </div>
        ))}

        {error && (
          <p className="mt-2 rounded-[3px] border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-[22px] flex justify-end gap-2.5">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2.5 rounded-[3px] bg-amber px-5 py-[11px] text-[13.5px] font-semibold text-[#17110a] transition hover:shadow-[0_0_0_3px_rgba(255,138,61,0.18)] active:translate-y-px"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
            </svg>
            Üret
          </button>
        </div>
      </div>

      {output && (
        <TermOutput prompt="/ip/firewall/nat export" text={output} filename="cgnat-netmap.rsc" />
      )}

      <CrossStrip />
    </>
  )
}
