import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { RackCardHeader } from '../components/RackCardHeader'
import { CrossStrip } from '../components/CrossStrip'
import { prefixFromMask, subnetInfo, type SubnetInfo } from '../lib/ip'

interface SplitRow {
  network: string
  first: string
  last: string
  broadcast: string
  usable: number
}

export function IpCalcView() {
  const [host, setHost] = useState('')
  const [mask, setMask] = useState('')
  const [mask2, setMask2] = useState('')

  const [error, setError] = useState('')
  const [info, setInfo] = useState<SubnetInfo | null>(null)
  const [split, setSplit] = useState<{ prefix: number; rows: SplitRow[] } | null>(null)

  function handleCalculate() {
    const prefix = prefixFromMask(mask)
    const result = host.trim() && prefix !== null ? subnetInfo(host, prefix) : null

    if (!result) {
      setInfo(null)
      setSplit(null)
      setError('Geçersiz IP adresi veya netmask. Örn: 217.177.0.0 ve 29')
      return
    }
    setError('')
    setInfo(result)

    const prefix2 = mask2.trim() ? prefixFromMask(mask2) : null
    if (prefix2 !== null && prefix2 > result.prefix && prefix2 <= 32) {
      const subCount = Math.pow(2, prefix2 - result.prefix)
      const subSize = Math.pow(2, 32 - prefix2)
      const rows: SplitRow[] = []
      for (let i = 0; i < subCount; i++) {
        const subNetInt = result.networkInt + i * subSize
        const s = subnetInfo(
          [
            (subNetInt >>> 24) & 255,
            (subNetInt >>> 16) & 255,
            (subNetInt >>> 8) & 255,
            subNetInt & 255,
          ].join('.'),
          prefix2,
        )
        if (!s) continue
        rows.push({
          network: `${s.network}/${prefix2}`,
          first: s.first,
          last: s.last,
          broadcast: s.broadcast,
          usable: s.usable,
        })
      }
      setSplit({ prefix: prefix2, rows })
    } else if (mask2.trim() && (prefix2 === null || prefix2 <= result.prefix)) {
      setSplit(null)
      setError("İkinci netmask, ilk netmask'ten daha dar (büyük prefix) olmalı.")
    } else {
      setSplit(null)
    }
  }

  return (
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Subnet Hesaplayıcı
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          IP Adresi ve Subnet Hesaplayıcı
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          IPv4 host, netmask, broadcast ve subnet hesaplayıcı. İkinci bir netmask girerek bloğu
          alt ağlara bölün.
        </p>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <RackCardHeader unitTag="1U — Ağ Girdisi" ready={!!info} readyLabel="hesaplandı" />

        <div className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] sm:grid-cols-2 md:grid-cols-3">
          <Field label="Host / IP Adresi">
            <input
              className={inputClass}
              placeholder="örn. 217.177.0.0"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </Field>
          <Field label="Netmask (CIDR /29, 29 veya 255.255.255.248)">
            <input
              className={inputClass}
              placeholder="örn. 29"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
            />
          </Field>
          <Field label="İkinci Netmask (opsiyonel — alt ağlara böl)">
            <input
              className={inputClass}
              placeholder="örn. 30"
              value={mask2}
              onChange={(e) => setMask2(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-[22px] flex justify-end">
          <button
            onClick={handleCalculate}
            className="inline-flex items-center gap-2.5 rounded-[3px] bg-amber px-5 py-[11px] text-[13.5px] font-semibold text-[#17110a] transition hover:shadow-[0_0_0_3px_rgba(255,138,61,0.18)] active:translate-y-px"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M8 9h8M8 13h8M8 17h4" />
            </svg>
            Hesapla
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-[22px] rounded-[3px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {info && (
        <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
          <div className="mb-2 font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
            Sonuç — /{info.prefix}
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-border-soft bg-border-soft sm:grid-cols-3 md:grid-cols-4">
            <ResultCell k="Network" v={info.network} />
            <ResultCell k="Netmask" v={info.mask} />
            <ResultCell k="Wildcard" v={info.wildcard} />
            <ResultCell k="Broadcast" v={info.broadcast} />
            <ResultCell k="İlk Host" v={info.first} />
            <ResultCell k="Son Host" v={info.last} />
            <ResultCell k="Toplam Adres" v={String(info.total)} />
            <ResultCell k="Kullanılabilir Host" v={String(info.usable)} />
          </div>
        </div>
      )}

      {split && split.rows.length > 0 && (
        <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
          <div className="mb-2 font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
            {split.rows.length} alt ağa bölündü — /{split.prefix}
          </div>
          <div className="overflow-x-auto">
            <table className="mt-3.5 w-full border-collapse font-mono text-[12px]">
              <thead>
                <tr>
                  <th className="border-b border-border px-2.5 py-2 text-left text-[10px] font-medium tracking-wide text-text-dim uppercase">
                    Subnet
                  </th>
                  <th className="border-b border-border px-2.5 py-2 text-left text-[10px] font-medium tracking-wide text-text-dim uppercase">
                    Kullanılabilir Aralık
                  </th>
                  <th className="border-b border-border px-2.5 py-2 text-left text-[10px] font-medium tracking-wide text-text-dim uppercase">
                    Broadcast
                  </th>
                  <th className="border-b border-border px-2.5 py-2 text-left text-[10px] font-medium tracking-wide text-text-dim uppercase">
                    Host
                  </th>
                </tr>
              </thead>
              <tbody>
                {split.rows.map((row) => (
                  <tr key={row.network} className="hover:bg-white/[0.015]">
                    <td className="border-b border-border-soft px-2.5 py-2 text-teal">
                      {row.network}
                    </td>
                    <td className="border-b border-border-soft px-2.5 py-2 text-teal">
                      {row.first} - {row.last}
                    </td>
                    <td className="border-b border-border-soft px-2.5 py-2 text-text-muted">
                      {row.broadcast}
                    </td>
                    <td className="border-b border-border-soft px-2.5 py-2 text-text-muted">
                      {row.usable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CrossStrip />
    </>
  )
}

function ResultCell({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-bg-grid px-4 py-3.5">
      <div className="mb-1.5 text-[10.5px] tracking-wide text-text-dim uppercase">{k}</div>
      <div className="font-mono text-[15px] font-medium text-teal">{v}</div>
    </div>
  )
}
