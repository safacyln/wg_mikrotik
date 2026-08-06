import { useMemo, useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { InfoBanner } from '../components/InfoBanner'
import { IconCopyButton } from '../components/IconCopyButton'
import { CrossStrip } from '../components/CrossStrip'
import { RTBH_DATA, filterRtbhData } from '../lib/rtbh'

export function RtbhView() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => filterRtbhData(RTBH_DATA, search), [search])

  return (
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Referans + Arama
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          BGP RTBH Community Cheat Sheet — Türkiye
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          Türkiye'deki büyük operatörlerin Remote-Triggered Blackhole ve anons kontrol
          community değerleri, tek yerde. Operatör, ASN veya community koduna göre arayın.
        </p>
      </div>

      <InfoBanner>
        <b className="text-text">Community değerleri operatörler tarafından zaman zaman değiştirilebilir.</b>{' '}
        Prodüksiyona almadan önce ilgili operatörün NOC'u veya güncel AS-SET/IRR kaydıyla teyit
        edin. Blackhole için önerilen prefix uzunluğu genellikle /32'dir (IPv6 için /128).
      </InfoBanner>

      <div className="mb-[22px] max-w-[420px]">
        <Field label="Operatör, ASN veya community ara">
          <input
            className={inputClass}
            placeholder="örn. superonline, 9121, 666"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Field>
      </div>

      {filtered.length === 0 ? (
        <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
          <p className="py-4 text-center font-mono text-[12.5px] text-text-dim">
            "{search}" için eşleşme bulunamadı.
          </p>
        </div>
      ) : (
        filtered.map((op) => (
          <div
            key={op.name}
            className="rack-card mb-4 rounded-[3px] border border-border bg-surface py-[26px] pr-7"
          >
            <div className="mb-4 flex flex-wrap items-baseline gap-2.5">
              <span className="text-[16px] font-semibold text-text">{op.name}</span>
              <span className="rounded-sm border border-amber-dim bg-amber/10 px-2 py-0.5 font-mono text-[12px] text-amber">
                AS{op.asn}
              </span>
              <span className="text-[12px] text-text-dim">{op.note}</span>
            </div>

            {op.communities.map((c, i) => (
              <div
                key={c.code}
                className={`grid grid-cols-1 items-center gap-3.5 py-2.5 sm:grid-cols-[130px_1fr_100px_34px] ${
                  i > 0 ? 'border-t border-border-soft' : ''
                }`}
              >
                <span className="font-mono text-[13.5px] font-semibold text-teal">{c.code}</span>
                <span>
                  <span className="text-[13px] font-medium text-text">{c.effect}</span>
                  <div className="mt-0.5 text-[12px] text-text-dim">{c.description}</div>
                </span>
                <span className="font-mono text-[11px] text-text-muted">{c.scope}</span>
                <IconCopyButton text={c.code} />
              </div>
            ))}
          </div>
        ))
      )}

      <div className="mt-11 border-t border-border-soft pt-[26px]">
        <div className="mb-3.5 font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
          Listede eksik bir operatör mü var?
        </div>
        <div className="flex items-start gap-3 rounded-[3px] border border-border bg-surface px-4 py-[13px] text-[12.5px] leading-relaxed text-text-muted">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="mt-0.5 flex-none text-text-dim"
          >
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          <div>
            TurkNet, Türksat, Millenicom, Vodafone Mobil gibi operatörlerin doğrulanmış RTBH
            community'sini bize iletirseniz (NOC dokümanı veya IRR kaydı ile birlikte) burada
            yayınlarız — bu, DDoS Danışmanlık ekibimiz tarafından teyit edilerek eklenir.
          </div>
        </div>
      </div>

      <CrossStrip />
    </>
  )
}
