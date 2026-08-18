import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { RackCardHeader } from '../components/RackCardHeader'
import { TermOutput } from '../components/TermOutput'
import { VerdictCard } from '../components/VerdictCard'
import { CrossStrip } from '../components/CrossStrip'
import {
  calculateCgnatCapacity,
  generateCgnatNetmap,
  type CgnatCapacityResult,
} from '../lib/cgnat'

export function CgnatView() {
  const [iface, setIface] = useState('vlan_2756')
  const [comment, setComment] = useState('cgnat')
  const [publicCidr, setPublicCidr] = useState('217.177.0.96/28')
  const [privateCidr, setPrivateCidr] = useState('100.64.0.0/24')
  const [startPort, setStartPort] = useState(1000)
  const [portWidth, setPortWidth] = useState(200)

  const [error, setError] = useState('')
  const [result, setResult] = useState<CgnatCapacityResult | null>(null)
  const [output, setOutput] = useState('')

  function handleCalculate() {
    const capacity = calculateCgnatCapacity({
      publicCidr: publicCidr.trim(),
      privateCidr: privateCidr.trim(),
      startPort,
      portWidth,
    })

    if (!capacity) {
      setResult(null)
      setOutput('')
      setError(
        'Geçerli bir Public CIDR, Private CIDR, başlangıç portu ve port genişliği girin (örn. 217.177.0.96/28).',
      )
      return
    }
    setError('')
    setResult(capacity)

    if (capacity.fits) {
      const netmap = generateCgnatNetmap({
        iface: iface.trim() || 'vlan_1',
        comment: comment.trim() || 'cgnat',
        publicCidr: publicCidr.trim(),
        privateCidr: privateCidr.trim(),
      })
      setOutput(netmap ?? '')
    } else {
      setOutput('')
    }
  }

  return (
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Kapasite Hesabı + Netmap
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          CGNAT Kapasite Hesaplayıcı ve Netmap Üretici
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          Public IP bloğunuza abonelere ayıracağınız private subnet ile başlangıç portu ve abone
          başına port genişliğini girin — bu public blok kaç aboneye yeteceğini hesaplayıp,
          sığıyorsa doğrudan MikroTik netmap kuralını üretir.
        </p>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <RackCardHeader unitTag="1U — Public / Private Bloklar" ready={!!result} readyLabel="hesaplandı" />

        <div className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] sm:grid-cols-2">
          <Field label="Public CIDR (firmanın elindeki blok)">
            <input
              className={inputClass}
              placeholder="örn. 217.177.0.96/28"
              value={publicCidr}
              onChange={(e) => setPublicCidr(e.target.value)}
            />
          </Field>
          <Field label="Private CIDR (abonelere ayrılan subnet)">
            <input
              className={inputClass}
              placeholder="örn. 100.64.0.0/24"
              value={privateCidr}
              onChange={(e) => setPrivateCidr(e.target.value)}
            />
          </Field>
          <Field label="Başlangıç Portu">
            <input
              type="number"
              className={inputClass}
              value={startPort}
              onChange={(e) => setStartPort(Number(e.target.value))}
            />
          </Field>
          <Field label="Abone Başına Port Genişliği">
            <input
              type="number"
              className={inputClass}
              value={portWidth}
              onChange={(e) => setPortWidth(Number(e.target.value))}
            />
          </Field>
          <Field label="Out-interface (VLAN)">
            <input className={inputClass} value={iface} onChange={(e) => setIface(e.target.value)} />
          </Field>
          <Field label="Comment">
            <input className={inputClass} value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
        </div>

        {error && (
          <p className="mt-4 rounded-[3px] border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-[22px] flex justify-end gap-2.5">
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

      {result && (
        <>
          <VerdictCard
            positive={result.fits}
            title={
              result.fits
                ? `Sığar — bu public blok ${result.totalCapacity} aboneye kadar yeter`
                : `Sığmaz — bu public blok en fazla ${result.totalCapacity} aboneye yeter`
            }
            subtitle={
              <>
                {result.publicNetwork}/{result.publicPrefix} → {result.publicUsableIps} kullanılabilir
                public IP × abone başına {result.portsPerIp} port = {result.totalCapacity} abone
                kapasitesi. {result.privateNetwork}/{result.privatePrefix} bloğunda {result.neededSubscribers}{' '}
                abone var.
                {!result.fits && result.suggestedPublicPrefix !== null && (
                  <>
                    {' '}
                    Öneri: en az bir /{result.suggestedPublicPrefix} public blok kullanın.
                  </>
                )}
              </>
            }
          />

          {result.fits && output && (
            <TermOutput prompt="/ip/firewall/nat export" text={output} filename="cgnat-netmap.rsc" />
          )}
        </>
      )}

      <CrossStrip />
    </>
  )
}
