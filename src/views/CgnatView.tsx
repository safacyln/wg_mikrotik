import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { RackCardHeader } from '../components/RackCardHeader'
import { PlainOutput } from '../components/PlainOutput'
import { VerdictCard } from '../components/VerdictCard'
import { CrossStrip } from '../components/CrossStrip'
import { planCgnat, type CgnatPlan } from '../lib/cgnat'

export function CgnatView() {
  const [publicStartIp, setPublicStartIp] = useState('217.177.0.96')
  const [publicTotal, setPublicTotal] = useState(32)
  const [privateCidr, setPrivateCidr] = useState('100.48.15.0/24')
  const [startPort, setStartPort] = useState(1000)
  const [portWidth, setPortWidth] = useState(1500)
  const [iface, setIface] = useState('vlan_2756')
  const [comment, setComment] = useState('LogiSafe CGNAT')
  const [includeIcmp, setIncludeIcmp] = useState(true)

  const [error, setError] = useState('')
  const [result, setResult] = useState<CgnatPlan | null>(null)

  function handlePlan() {
    const outcome = planCgnat({
      publicStartIp: publicStartIp.trim(),
      publicTotal,
      privateCidr: privateCidr.trim(),
      startPort,
      portWidth,
      iface: iface.trim() || 'vlan_1',
      comment: comment.trim() || 'LogiSafe CGNAT',
      includeIcmp,
    })

    if (!outcome.ok) {
      setError(outcome.error)
      setResult(null)
      return
    }
    setError('')
    setResult(outcome.plan)
  }

  return (
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Toplu Netmap + RADIUS Üretici
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          CGNAT Toplu Netmap ve RADIUS Dışa Aktarım
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          Public havuzunuzu ve abonelere ayrılan private havuzu otomatik olarak gruplara bölüp
          port dilimleyerek eşleştirir. Kaç abonenin sığdığını hesaplar, sığan kısım için
          MikroTik netmap kurallarını ve RADIUS firmasına verilecek IP↔port eşleme dosyasını
          üretir.
        </p>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <RackCardHeader unitTag="1U — Havuzlar" ready={!!result} readyLabel="planlandı" />

        <div className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] sm:grid-cols-2">
          <Field label="Public Havuz Başlangıç IP">
            <input
              className={inputClass}
              placeholder="örn. 217.177.0.96"
              value={publicStartIp}
              onChange={(e) => setPublicStartIp(e.target.value)}
            />
          </Field>
          <Field label="Public Havuz Toplam IP Sayısı">
            <input
              type="number"
              className={inputClass}
              value={publicTotal}
              onChange={(e) => setPublicTotal(Number(e.target.value))}
            />
          </Field>
          <Field label="Abone (Private) Havuzu">
            <input
              className={inputClass}
              placeholder="örn. 100.48.15.0/24"
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

        <label className="mt-4 flex items-center gap-[9px] text-[13px] text-text-muted">
          <input
            type="checkbox"
            checked={includeIcmp}
            onChange={(e) => setIncludeIcmp(e.target.checked)}
            className="h-[15px] w-[15px] accent-amber"
          />
          ICMP netmap kuralı da eklensin (port kısıtlaması olmadan)
        </label>

        {error && (
          <p className="mt-4 rounded-[3px] border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-[22px] flex justify-end gap-2.5">
          <button
            onClick={handlePlan}
            className="inline-flex items-center gap-2.5 rounded-[3px] bg-amber px-5 py-[11px] text-[13.5px] font-semibold text-[#17110a] transition hover:shadow-[0_0_0_3px_rgba(255,138,61,0.18)] active:translate-y-px"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
            </svg>
            Planla ve Üret
          </button>
        </div>
      </div>

      {result && (
        <>
          <VerdictCard
            positive={result.fits}
            title={
              result.fits
                ? `Tamamı sığıyor — ${result.assignedHostCount} abonenin tamamı bu public havuza yerleşti`
                : `Kısmen sığıyor — ${result.assignedHostCount} / ${result.neededHosts} abone yerleşti, ${result.unassignedHostCount} abone için havuz yetersiz`
            }
            subtitle={
              <>
                {result.publicGroupCount} public grup (/{result.groupPrefix}) × grup başına{' '}
                {result.slicesPerPublicGroup} port dilimi = {result.capacityGroups} grup ={' '}
                {result.capacityHosts} abone kapasitesi. Abone havuzunda {result.privateGroupCount}{' '}
                grup ({result.neededHosts} host) var.
                {!result.fits && (
                  <>
                    {' '}
                    Kalan {result.unassignedGroupCount} grubu (
                    {result.unassignedHostCount} abone) yerleştirmek için public havuzu
                    büyütün veya port genişliğini azaltın.
                  </>
                )}
              </>
            }
          />

          <PlainOutput
            prompt="/ip/firewall/nat export (MikroTik'e yapıştırın)"
            text={result.mikrotikConfig}
            filename="cgnat-netmap.rsc"
          />

          <PlainOutput
            prompt={`RADIUS IP↔port eşleme — ${result.radiusLineCount} satır (RADIUS firmasına verilecek)`}
            text={result.radiusExport}
            filename="cgnat-radius-export.txt"
          />
        </>
      )}

      <CrossStrip />
    </>
  )
}
