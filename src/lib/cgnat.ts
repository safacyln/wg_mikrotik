import { ip2int, int2ip, maskFromPrefix } from './ip'

export interface CgnatPlanInput {
  publicCidr: string
  privateCidr: string
  startPort: number
  portWidth: number
  iface: string
  comment: string
  includeIcmp: boolean
}

export interface CgnatPlan {
  publicPrefix: number
  publicNetwork: string
  groupSize: number
  slicesPerPublicGroup: number
  capacityHosts: number
  privateFamilyPrefix: number
  firstPrivateFamilyNetwork: string
  lastPrivateFamilyNetwork: string
  familyBlocksUsed: number
  mikrotikConfig: string
  radiusExport: string
  radiusLineCount: number
}

export type CgnatPlanResult = { ok: true; plan: CgnatPlan } | { ok: false; error: string }

const MAX_PORT = 65535
const MAX_HOSTS = 50000

function parseFullCidr(cidr: string): { start: number; total: number; prefix: number } | null {
  const [ip, prefixStr] = cidr.trim().split('/')
  const prefix = parseInt(prefixStr, 10)
  const n = ip2int(ip ?? '')
  if (n === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return null
  const mask = maskFromPrefix(prefix)
  return { start: (n & mask) >>> 0, total: Math.pow(2, 32 - prefix), prefix }
}

function formatRouterosAdd(tokens: string[], width = 78): string {
  const lines: string[] = []
  let current = 'add'
  for (const token of tokens) {
    const candidate = `${current} ${token}`
    if (candidate.length > width) {
      lines.push(current)
      current = `    ${token}`
    } else {
      current = candidate
    }
  }
  lines.push(current)
  return lines.map((line, i) => (i < lines.length - 1 ? `${line} \\` : line)).join('\n')
}

/**
 * Tek bir public bloğun (ör. /29) TAMAMINI port dilimleyerek kullanır.
 * Abone havuzu, verilen private CIDR'ın boyutu kadar bir "aile" bloğudur
 * (ör. /24); bu aile tükenince otomatik olarak bir sonraki aynı boyuttaki
 * private bloğa geçilir (100.50.20.0/24 bitince 100.50.21.0/24 gibi) —
 * public bloğun tüm port kapasitesi kullanılana kadar bu devam eder.
 */
export function planCgnat(input: CgnatPlanInput): CgnatPlanResult {
  if (!Number.isFinite(input.startPort) || input.startPort < 1 || input.startPort > MAX_PORT) {
    return { ok: false, error: 'Başlangıç portu 1 ile 65535 arasında olmalı.' }
  }
  if (!Number.isFinite(input.portWidth) || input.portWidth < 1) {
    return { ok: false, error: 'Abone başına port genişliği en az 1 olmalı.' }
  }

  const pub = parseFullCidr(input.publicCidr)
  if (!pub) {
    return { ok: false, error: 'Public havuz geçersiz. Örnek: 203.0.113.96/29' }
  }
  const priv = parseFullCidr(input.privateCidr)
  if (!priv) {
    return { ok: false, error: 'Abone havuzu geçersiz. Örnek: 100.64.20.0/24' }
  }

  const groupSize = pub.total
  const groupPrefix = pub.prefix
  const privateFamilySize = priv.total

  if (privateFamilySize < groupSize || privateFamilySize % groupSize !== 0) {
    return {
      ok: false,
      error: `Abone havuzu bloğu (/${priv.prefix}), public bloktan (/${groupPrefix}) daha küçük veya ona tam bölünemiyor. Abone havuzu en az public blok kadar geniş olmalı (ör. public /29 ise abone havuzu /24 gibi daha büyük bir blok olabilir).`,
    }
  }

  const slicesPerPublicGroup = Math.floor((MAX_PORT - input.startPort + 1) / input.portWidth)
  if (slicesPerPublicGroup < 1) {
    return {
      ok: false,
      error:
        'Başlangıç portu + port genişliği 65535 sınırını aşıyor, port dilimi oluşturulamıyor.',
    }
  }

  const capacityHosts = slicesPerPublicGroup * groupSize
  if (capacityHosts > MAX_HOSTS) {
    return {
      ok: false,
      error: `Bu public blok (${capacityHosts} abone kapasitesi) tarayıcıda güvenle üretilemeyecek kadar büyük. Abone başına port genişliğini artırın (daha az port dilimi) veya daha küçük bir public blok kullanın.`,
    }
  }

  const chunksPerFamily = privateFamilySize / groupSize
  const publicGroupCidr = `${int2ip(pub.start)}/${groupPrefix}`

  const mikrotikLines: string[] = ['/ip firewall nat']
  const radiusLines: string[] = []

  let familyIndex = 0
  let chunkInFamily = 0

  for (let slice = 0; slice < slicesPerPublicGroup; slice++) {
    const privateChunkStart = priv.start + familyIndex * privateFamilySize + chunkInFamily * groupSize
    const privateGroupCidr = `${int2ip(privateChunkStart)}/${groupPrefix}`
    const portStart = input.startPort + slice * input.portWidth
    const portEnd = portStart + input.portWidth - 1
    const portRange = `${portStart}-${portEnd}`

    for (const protocol of ['udp', 'tcp']) {
      mikrotikLines.push(
        formatRouterosAdd([
          'action=netmap',
          'chain=srcnat',
          `comment=${input.comment}`,
          `out-interface=${input.iface}`,
          `protocol=${protocol}`,
          `src-address=${privateGroupCidr}`,
          `to-addresses=${publicGroupCidr}`,
          `to-ports=${portRange}`,
        ]),
      )
    }
    if (input.includeIcmp) {
      mikrotikLines.push(
        formatRouterosAdd([
          'action=netmap',
          'chain=srcnat',
          `comment=${input.comment}`,
          `out-interface=${input.iface}`,
          'protocol=icmp',
          `src-address=${privateGroupCidr}`,
          `to-addresses=${publicGroupCidr}`,
        ]),
      )
    }

    for (let h = 0; h < groupSize; h++) {
      const privIp = int2ip(privateChunkStart + h)
      const pubIp = int2ip(pub.start + h)
      radiusLines.push(`${privIp} ${pubIp} ${portRange}`)
    }

    chunkInFamily++
    if (chunkInFamily >= chunksPerFamily) {
      chunkInFamily = 0
      familyIndex++
    }
  }

  const familyBlocksUsed = familyIndex + (chunkInFamily > 0 ? 1 : 0)
  const lastFamilyStart = priv.start + (familyBlocksUsed - 1) * privateFamilySize

  return {
    ok: true,
    plan: {
      publicPrefix: groupPrefix,
      publicNetwork: int2ip(pub.start),
      groupSize,
      slicesPerPublicGroup,
      capacityHosts,
      privateFamilyPrefix: priv.prefix,
      firstPrivateFamilyNetwork: int2ip(priv.start),
      lastPrivateFamilyNetwork: int2ip(lastFamilyStart),
      familyBlocksUsed,
      mikrotikConfig: mikrotikLines.join('\n'),
      radiusExport: radiusLines.join('\n'),
      radiusLineCount: radiusLines.length,
    },
  }
}
