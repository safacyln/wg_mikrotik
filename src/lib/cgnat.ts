import { subnetInfo } from './ip'

export interface CgnatCapacityInput {
  publicCidr: string
  privateCidr: string
  startPort: number
  portWidth: number
}

export interface CgnatCapacityResult {
  publicPrefix: number
  publicNetwork: string
  publicUsableIps: number
  privatePrefix: number
  privateNetwork: string
  neededSubscribers: number
  portsPerIp: number
  totalCapacity: number
  fits: boolean
  suggestedPublicPrefix: number | null
}

function parseCidr(input: string) {
  const [ip, prefixStr] = input.trim().split('/')
  const prefix = parseInt(prefixStr, 10)
  if (!ip || Number.isNaN(prefix)) return null
  return subnetInfo(ip, prefix)
}

/** En dar (en yüksek prefix) public bloğu bulur; verilen abone sayısını karşılayacak IP sayısını sağlar. */
function findSuggestedPublicPrefix(requiredIps: number): number | null {
  for (let prefix = 32; prefix >= 0; prefix--) {
    const usable = prefix >= 31 ? Math.pow(2, 32 - prefix) : Math.pow(2, 32 - prefix) - 2
    if (usable >= requiredIps) return prefix
  }
  return null
}

export function calculateCgnatCapacity(input: CgnatCapacityInput): CgnatCapacityResult | null {
  const pub = parseCidr(input.publicCidr)
  const priv = parseCidr(input.privateCidr)
  if (!pub || !priv || input.startPort < 1 || input.startPort > 65535 || input.portWidth < 1) {
    return null
  }

  const portsPerIp = Math.max(1, Math.floor((65535 - input.startPort + 1) / input.portWidth))
  const publicUsableIps = pub.usable > 0 ? pub.usable : pub.total
  const neededSubscribers = priv.usable > 0 ? priv.usable : priv.total
  const totalCapacity = publicUsableIps * portsPerIp
  const fits = totalCapacity >= neededSubscribers

  const requiredIps = Math.ceil(neededSubscribers / portsPerIp)
  const suggestedPublicPrefix = fits ? null : findSuggestedPublicPrefix(requiredIps)

  return {
    publicPrefix: pub.prefix,
    publicNetwork: pub.network,
    publicUsableIps,
    privatePrefix: priv.prefix,
    privateNetwork: priv.network,
    neededSubscribers,
    portsPerIp,
    totalCapacity,
    fits,
    suggestedPublicPrefix,
  }
}

export interface CgnatNetmapInput {
  iface: string
  comment: string
  publicCidr: string
  privateCidr: string
}

export function generateCgnatNetmap(input: CgnatNetmapInput): string | null {
  const pub = parseCidr(input.publicCidr)
  const priv = parseCidr(input.privateCidr)
  if (!pub || !priv) return null

  const lines: string[] = []
  lines.push('/ip firewall nat')
  lines.push(
    `add chain=srcnat action=netmap src-address=${input.privateCidr} to-addresses=${pub.network} out-interface=${input.iface} comment="${input.comment}"`,
  )
  lines.push(
    `add chain=dstnat action=netmap dst-address=${input.publicCidr} to-addresses=${priv.network} in-interface=${input.iface} comment="${input.comment}"`,
  )
  return lines.join('\n')
}
