export interface RtbhCommunity {
  code: string
  effect: string
  description: string
  scope: string
}

export interface RtbhOperator {
  name: string
  asn: number
  note: string
  communities: RtbhCommunity[]
}

/**
 * Kaynaklar (son doğrulama: Ağustos 2026):
 * - Türk Telekom (9121), Süperonline (34984), TT International (6663),
 *   Seabone/Sparkle (6762), Cogent (174), Vodafone TR (15897):
 *   operatör NOC dokümantasyonlarından derlenmiştir.
 * - RFC 7999 well-known BLACKHOLE community (65535:666): IETF RFC 7999.
 * Prodüksiyona almadan önce ilgili operatörün NOC'u ile teyit edin.
 */
export const RTBH_DATA: RtbhOperator[] = [
  {
    name: 'Türk Telekom',
    asn: 9121,
    note: 'AS9121 — yerleşik operatör / TTNet',
    communities: [
      {
        code: '9121:666',
        effect: 'Blackhole',
        description: "İşaretlenen prefix null-route'a düşürülür.",
        scope: '/32',
      },
      {
        code: '9121:444',
        effect: 'Sadece yurtiçi anons',
        description: 'Trafik yalnızca Türkiye içi ağlara anons edilir.',
        scope: '/24+',
      },
      {
        code: '9121:555',
        effect: 'Sadece yurtdışı blackhole',
        description: 'Yalnızca yurtdışı kaynaklı trafik blackhole edilir.',
        scope: '/32',
      },
    ],
  },
  {
    name: 'Süperonline / Turkcell',
    asn: 34984,
    note: 'AS34984',
    communities: [
      {
        code: '34984:666',
        effect: 'Blackhole',
        description: 'Trafik yönlendirilmeden düşürülür.',
        scope: '/32',
      },
      {
        code: '34984:444',
        effect: 'Sadece yurtiçi anons',
        description: 'Trafik yalnızca yurtiçine anons edilir.',
        scope: '/24+',
      },
    ],
  },
  {
    name: 'Türk Telekom International (Sparkle TR)',
    asn: 6663,
    note: 'AS6663',
    communities: [
      {
        code: '6663:0',
        effect: 'Blackhole',
        description: 'İstenmeyen trafik blackhole edilir.',
        scope: '/32',
      },
      {
        code: '6663:40001',
        effect: "Upstream'e anons etme",
        description: 'Trafiğin upstream sağlayıcılara anonsunu engeller.',
        scope: '/24+',
      },
      {
        code: '6663:40002',
        effect: "Peer'lere anons etme",
        description: 'Trafiğin peer ağlara anonsunu engeller.',
        scope: '/24+',
      },
      {
        code: '6663:70',
        effect: 'Local Preference 70',
        description: 'Orta seviye önceliklendirme.',
        scope: '—',
      },
      {
        code: '6663:20',
        effect: 'Local Preference 20',
        description: 'Düşük seviye önceliklendirme.',
        scope: '—',
      },
    ],
  },
  {
    name: 'Seabone / Sparkle',
    asn: 6762,
    note: 'AS6762',
    communities: [
      {
        code: '6762:666',
        effect: 'Blackhole',
        description: 'İstenmeyen trafik blackhole edilir.',
        scope: '/32',
      },
      {
        code: '6762:1090',
        effect: 'Local Preference 90',
        description: 'Yüksek öncelik.',
        scope: '—',
      },
      {
        code: '6762:1070',
        effect: 'Local Preference 70',
        description: 'Orta öncelik.',
        scope: '—',
      },
      {
        code: '6762:1050',
        effect: 'Local Preference 50',
        description: 'Düşük öncelik.',
        scope: '—',
      },
      {
        code: '6762:20099',
        effect: "LINX'e anons etme",
        description: "LINX IX'ine anonsu engeller.",
        scope: '/24+',
      },
      {
        code: '6762:20098',
        effect: "AMS-IX'e anons etme",
        description: "AMS-IX'e anonsu engeller.",
        scope: '/24+',
      },
      {
        code: '6762:20097',
        effect: "DE-CIX'e anons etme",
        description: "DE-CIX'e anonsu engeller.",
        scope: '/24+',
      },
    ],
  },
  {
    name: 'Vodafone Türkiye',
    asn: 15897,
    note: 'AS15897',
    communities: [
      {
        code: '15897:666',
        effect: 'Sadece Vodafone içi anons',
        description: 'Trafik yalnızca Vodafone ağı içinde anons edilir.',
        scope: '/24+',
      },
      {
        code: '15897:3801',
        effect: 'Yurtdışı kes',
        description: 'Yurtdışına anonsu keser.',
        scope: '/32',
      },
      {
        code: '15897:999',
        effect: 'Yurtdışı anons kes',
        description: 'Yurtdışına anonsu keser.',
        scope: '/24',
      },
      {
        code: '15897:557',
        effect: 'VF dışına anons kes',
        description: "Vodafone dışına anonsu keser (customer'lar hariç).",
        scope: '/24+',
      },
      {
        code: '15897:556',
        effect: 'VF + Customer anonsu kes',
        description: 'Vodafone ve customer anonsunu keser.',
        scope: '/24+',
      },
    ],
  },
  {
    name: 'Cogent Communications',
    asn: 174,
    note: 'AS174 — global transit',
    communities: [
      {
        code: '174:3000',
        effect: "Peer'lara anons etme",
        description: "Trafiğin peer'lara anonsunu engeller.",
        scope: '/24+',
      },
      {
        code: '174:70',
        effect: 'Local Preference 70',
        description: 'Orta seviye öncelik.',
        scope: '—',
      },
      {
        code: '174:120',
        effect: 'Local Preference 120',
        description: 'Yüksek seviye öncelik.',
        scope: '—',
      },
      {
        code: '174:970',
        effect: "Kuzey Amerika'ya anons etme",
        description: 'Kuzey Amerika bölgesine anonsu engeller.',
        scope: '/24+',
      },
      {
        code: '174:980',
        effect: "Avrupa'ya anons etme",
        description: 'Avrupa bölgesine anonsu engeller.',
        scope: '/24+',
      },
    ],
  },
  {
    name: 'RFC 7999 Well-Known Community',
    asn: 65535,
    note: 'IETF standardı — birçok IX/upstream destekler',
    communities: [
      {
        code: '65535:666',
        effect: 'Blackhole (standart)',
        description: 'IETF tarafından tanımlanan evrensel blackhole community.',
        scope: "/32 (v4), /128 (v6)",
      },
    ],
  },
]

export function filterRtbhData(data: RtbhOperator[], query: string): RtbhOperator[] {
  const q = query.trim().toLowerCase()
  if (!q) return data

  return data
    .map((op) => {
      const operatorMatches = op.name.toLowerCase().includes(q) || String(op.asn).includes(q)
      const communities = operatorMatches
        ? op.communities
        : op.communities.filter(
            (c) => c.code.toLowerCase().includes(q) || c.effect.toLowerCase().includes(q),
          )
      return communities.length ? { ...op, communities } : null
    })
    .filter((op): op is RtbhOperator => op !== null)
}
