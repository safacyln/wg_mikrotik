const products = [
  {
    name: 'LogiSpot',
    description: 'Cloud Hotspot ile misafir ağı ve internet erişim yönetimi.',
    href: 'https://logisafe.net.tr/urunler/logispot-hotspot/',
  },
  {
    name: 'LogiFeeds',
    description: "USOM/BTK'nın ilettiği engelleme kararlarını otomatik uygulayan sistem.",
    href: 'https://logisafe.net.tr/urunler/logifeeds/',
  },
  {
    name: 'LogiSafe SIEM',
    description: 'Çoklu-tenant log toplama, ClickHouse tabanlı arama ve EPS raporlama.',
    href: 'https://logisafe.net.tr/urunler/logisafe-siem/',
  },
  {
    name: 'Network Danışmanlık',
    description: 'MikroTik, Juniper ve Huawei ile ISP network planlama ve kurulum.',
    href: 'https://logisafe.net.tr/hizmetlerimiz/danismanlik/isp-planning/',
  },
]

const partners = [
  {
    name: 'TrendMicro',
    description: 'Uç nokta ve ağ güvenliği için teknoloji ortağımız.',
    href: 'https://logisafe.net.tr/urunler/trend-micro-vision-one/',
  },
  {
    name: 'FastNetMon',
    description: 'DDoS tespit ve mitigasyon altyapımızın çekirdeği.',
    href: 'https://logisafe.net.tr/urunler/fastnetmon-advanced/',
  },
]

export function CrossStrip() {
  return (
    <div className="mt-11 border-t border-border-soft pt-[26px]">
      <div className="mb-3.5 font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
        LogiSafe Ürünleri
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {products.map((p) => (
          <CrossCard key={p.name} {...p} />
        ))}
      </div>

      <div className="mt-[22px] mb-3.5 font-mono text-[10.5px] tracking-wide text-text-dim uppercase">
        Teknoloji Partnerlerimiz
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {partners.map((p) => (
          <CrossCard key={p.name} {...p} partner />
        ))}
      </div>
    </div>
  )
}

function CrossCard({
  name,
  description,
  href,
  partner,
}: {
  name: string
  description: string
  href: string
  partner?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-[3px] border border-border-soft bg-surface p-3.5 transition duration-150 ease-out hover:-translate-y-0.5 hover:border-border hover:shadow-[0_6px_18px_rgba(0,0,0,0.35)]"
    >
      <span className="text-[13px] font-semibold text-text transition group-hover:text-amber">
        {name} →
      </span>
      {partner && (
        <span className="ml-2 inline-block rounded-sm border border-amber-dim px-1.5 py-px align-middle font-mono text-[9.5px] tracking-wide text-amber uppercase">
          Partner
        </span>
      )}
      <p className="mt-1.5 text-[12px] leading-relaxed text-text-dim">{description}</p>
    </a>
  )
}
