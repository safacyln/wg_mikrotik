import { ip2int, int2ip, maskFromPrefix, isValidIPv4 } from './ip'

export interface CgnatPlanInput {
  publicStartIp: string
  publicTotal: number
  privateCidr: string
  startPort: number
  portWidth: number
  iface: string
  comment: string
  includeIcmp: boolean
}

export interface CgnatPlan {
  groupPrefix: number
  groupSize: number
  publicGroupCount: number
  privateGroupCount: number
  slicesPerPublicGroup: number
  capacityGroups: number
  capacityHosts: number
  neededHosts: number
  assignedGroupCount: number
  assignedHostCount: number
  unassignedGroupCount: number
  unassignedHostCount: number
  fits: boolean
  mikrotikConfig: string
  radiusExport: string
  radiusLineCount: number
}

export type CgnatPlanResult = { ok: true; plan: CgnatPlan } | { ok: false; error: string }

const MAX_PORT = 65535
const MAX_HOSTS = 50000
/** Denenecek grup boyutu (prefix) sırası — /29 (8'li) sektör standardıdır, uymazsa küçültülür. */
const GROUP_PREFIX_CANDIDATES = [29, 30, 31, 32]

function parseFullCidr(cidr: string): { start: number; total: number } | null {
  const [ip, prefixStr] = cidr.trim().split('/')
  const prefix = parseInt(prefixStr, 10)
  const n = ip2int(ip ?? '')
  if (n === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return null
  const mask = maskFromPrefix(prefix)
  return { start: (n & mask) >>> 0, total: Math.pow(2, 32 - prefix) }
}

function pickGroupPrefix(
  publicStart: number,
  publicTotal: number,
  privateStart: number,
  privateTotal: number,
): number | null {
  for (const prefix of GROUP_PREFIX_CANDIDATES) {
    const size = Math.pow(2, 32 - prefix)
    if (size > publicTotal || size > privateTotal) continue
    if (publicTotal % size !== 0 || privateTotal % size !== 0) continue
    if (publicStart % size !== 0 || privateStart % size !== 0) continue
    return prefix
  }
  return null
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

export function planCgnat(input: CgnatPlanInput): CgnatPlanResult {
  if (!isValidIPv4(input.publicStartIp)) {
    return { ok: false, error: 'Geçersiz public başlangıç IP adresi.' }
  }
  if (!Number.isFinite(input.publicTotal) || input.publicTotal < 1) {
    return { ok: false, error: 'Public havuz toplam IP sayısı en az 1 olmalı.' }
  }
  if (!Number.isFinite(input.startPort) || input.startPort < 1 || input.startPort > MAX_PORT) {
    return { ok: false, error: 'Başlangıç portu 1 ile 65535 arasında olmalı.' }
  }
  if (!Number.isFinite(input.portWidth) || input.portWidth < 1) {
    return { ok: false, error: 'Abone başına port genişliği en az 1 olmalı.' }
  }

  const publicStart = ip2int(input.publicStartIp)
  if (publicStart === null) {
    return { ok: false, error: 'Geçersiz public başlangıç IP adresi.' }
  }

  const privatePool = parseFullCidr(input.privateCidr)
  if (!privatePool) {
    return { ok: false, error: "Abone havuzu geçersiz. Örnek: 100.64.15.0/24" }
  }
  const { start: privateStart, total: privateTotal } = privatePool

  const groupPrefix = pickGroupPrefix(publicStart, input.publicTotal, privateStart, privateTotal)
  if (groupPrefix === null) {
    return {
      ok: false,
      error:
        'Public havuz ile abone havuzu birbiriyle uyumlu gruplara bölünemedi. Başlangıç IP\'lerinin ve toplam sayıların 8\'in katı olacak şekilde hizalanmasını deneyin.',
    }
  }
  const groupSize = Math.pow(2, 32 - groupPrefix)

  const slicesPerPublicGroup = Math.floor((MAX_PORT - input.startPort + 1) / input.portWidth)
  if (slicesPerPublicGroup < 1) {
    return {
      ok: false,
      error:
        'Başlangıç portu + port genişliği 65535 sınırını aşıyor, port dilimi oluşturulamıyor.',
    }
  }

  const publicGroupCount = input.publicTotal / groupSize
  const privateGroupCount = privateTotal / groupSize
  const capacityGroups = publicGroupCount * slicesPerPublicGroup
  const capacityHosts = capacityGroups * groupSize
  const neededHosts = privateTotal
  const fits = privateGroupCount <= capacityGroups
  const assignedGroupCount = Math.min(privateGroupCount, capacityGroups)
  const assignedHostCount = assignedGroupCount * groupSize
  const unassignedGroupCount = privateGroupCount - assignedGroupCount
  const unassignedHostCount = unassignedGroupCount * groupSize

  if (assignedHostCount > MAX_HOSTS) {
    return {
      ok: false,
      error: `Bu havuz boyutu (${assignedHostCount} host) tarayıcıda güvenle üretilemeyecek kadar büyük. Lütfen abone havuzunu ${MAX_HOSTS} hostun altında tutacak şekilde parçalara bölün.`,
    }
  }

  const mikrotikLines: string[] = ['/ip firewall nat']
  const radiusLines: string[] = []

  let privateGroupIndex = 0
  for (let pg = 0; pg < publicGroupCount && privateGroupIndex < assignedGroupCount; pg++) {
    const publicGroupStart = publicStart + pg * groupSize
    const publicGroupCidr = `${int2ip(publicGroupStart)}/${groupPrefix}`

    for (
      let slice = 0;
      slice < slicesPerPublicGroup && privateGroupIndex < assignedGroupCount;
      slice++
    ) {
      const privateGroupStart = privateStart + privateGroupIndex * groupSize
      const privateGroupCidr = `${int2ip(privateGroupStart)}/${groupPrefix}`
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
        const privIp = int2ip(privateGroupStart + h)
        const pubIp = int2ip(publicGroupStart + h)
        radiusLines.push(`${privIp} ${pubIp} ${portRange}`)
      }

      privateGroupIndex++
    }
  }

  return {
    ok: true,
    plan: {
      groupPrefix,
      groupSize,
      publicGroupCount,
      privateGroupCount,
      slicesPerPublicGroup,
      capacityGroups,
      capacityHosts,
      neededHosts,
      assignedGroupCount,
      assignedHostCount,
      unassignedGroupCount,
      unassignedHostCount,
      fits,
      mikrotikConfig: mikrotikLines.join('\n'),
      radiusExport: radiusLines.join('\n'),
      radiusLineCount: radiusLines.length,
    },
  }
}
