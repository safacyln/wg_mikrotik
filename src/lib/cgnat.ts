import { ip2int, int2ip, maskFromPrefix, isValidIPv4 } from './ip'

export interface CgnatPlanInput {
  publicStartIp: string
  publicTotal: number
  privateStartIp: string
  privateTotal: number
  groupPrefix: number
  startPort: number
  portWidth: number
  iface: string
  comment: string
  includeIcmp: boolean
}

export interface CgnatPlan {
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
  if (!isValidIPv4(input.publicStartIp) || !isValidIPv4(input.privateStartIp)) {
    return { ok: false, error: 'Geçersiz başlangıç IP adresi.' }
  }
  if (!Number.isFinite(input.groupPrefix) || input.groupPrefix < 1 || input.groupPrefix > 31) {
    return { ok: false, error: 'Grup boyutu (prefix) 1 ile 31 arasında olmalı.' }
  }
  if (!Number.isFinite(input.startPort) || input.startPort < 1 || input.startPort > MAX_PORT) {
    return { ok: false, error: 'Başlangıç portu 1 ile 65535 arasında olmalı.' }
  }
  if (!Number.isFinite(input.portWidth) || input.portWidth < 1) {
    return { ok: false, error: 'Port genişliği en az 1 olmalı.' }
  }

  const groupSize = Math.pow(2, 32 - input.groupPrefix)

  if (!Number.isFinite(input.publicTotal) || input.publicTotal < groupSize) {
    return {
      ok: false,
      error: `Public havuz en az bir grup (${groupSize} IP) büyüklüğünde olmalı.`,
    }
  }
  if (!Number.isFinite(input.privateTotal) || input.privateTotal < groupSize) {
    return {
      ok: false,
      error: `Abone havuzu en az bir grup (${groupSize} IP) büyüklüğünde olmalı.`,
    }
  }
  if (input.publicTotal % groupSize !== 0) {
    return {
      ok: false,
      error: `Public havuz toplamı (${input.publicTotal}) grup boyutuna (${groupSize}) tam bölünmeli.`,
    }
  }
  if (input.privateTotal % groupSize !== 0) {
    return {
      ok: false,
      error: `Abone havuzu toplamı (${input.privateTotal}) grup boyutuna (${groupSize}) tam bölünmeli.`,
    }
  }

  const publicStart = ip2int(input.publicStartIp)
  const privateStart = ip2int(input.privateStartIp)
  if (publicStart === null || privateStart === null) {
    return { ok: false, error: 'Geçersiz başlangıç IP adresi.' }
  }
  const groupMask = maskFromPrefix(input.groupPrefix)
  if ((publicStart & ~groupMask) !== 0) {
    return {
      ok: false,
      error: `Public başlangıç IP'si /${input.groupPrefix} grup sınırına hizalı değil (bir /${input.groupPrefix} bloğunun ilk adresiyle başlamalı).`,
    }
  }
  if ((privateStart & ~groupMask) !== 0) {
    return {
      ok: false,
      error: `Abone havuzu başlangıç IP'si /${input.groupPrefix} grup sınırına hizalı değil.`,
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

  const publicGroupCount = input.publicTotal / groupSize
  const privateGroupCount = input.privateTotal / groupSize
  const capacityGroups = publicGroupCount * slicesPerPublicGroup
  const capacityHosts = capacityGroups * groupSize
  const neededHosts = input.privateTotal
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
    const publicGroupCidr = `${int2ip(publicGroupStart)}/${input.groupPrefix}`

    for (
      let slice = 0;
      slice < slicesPerPublicGroup && privateGroupIndex < assignedGroupCount;
      slice++
    ) {
      const privateGroupStart = privateStart + privateGroupIndex * groupSize
      const privateGroupCidr = `${int2ip(privateGroupStart)}/${input.groupPrefix}`
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
