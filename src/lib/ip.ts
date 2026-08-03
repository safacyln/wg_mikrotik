export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
}

export function addOffset(ip: string, offset: number): string {
  const parts = ip.trim().split('.').map(Number)
  let value =
    (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3]
  value += offset
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join('.')
}

export function ip2int(ip: string): number | null {
  if (!isValidIPv4(ip)) return null
  const parts = ip.trim().split('.').map(Number)
  return (
    ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
  )
}

export function int2ip(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')
}

export function maskFromPrefix(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
}

/** Accepts a CIDR prefix ("29") or a dotted netmask ("255.255.255.248"). */
export function prefixFromMask(input: string): number | null {
  const str = input.trim()
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10)
    return n >= 0 && n <= 32 ? n : null
  }
  const n = ip2int(str)
  if (n === null) return null
  let bits = 0
  let sawZero = false
  for (let i = 31; i >= 0; i--) {
    const bit = (n >>> i) & 1
    if (bit) {
      if (sawZero) return null
      bits++
    } else {
      sawZero = true
    }
  }
  return bits
}

export interface SubnetInfo {
  network: string
  networkInt: number
  broadcast: string
  broadcastInt: number
  mask: string
  wildcard: string
  first: string
  last: string
  total: number
  usable: number
  prefix: number
}

export function subnetInfo(ipStr: string, prefix: number): SubnetInfo | null {
  const ip = ip2int(ipStr)
  if (ip === null || prefix < 0 || prefix > 32) return null
  const mask = maskFromPrefix(prefix)
  const network = (ip & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const total = Math.pow(2, 32 - prefix)
  const first = prefix >= 31 ? network : network + 1
  const last = prefix >= 31 ? broadcast : broadcast - 1
  return {
    network: int2ip(network),
    networkInt: network,
    broadcast: int2ip(broadcast),
    broadcastInt: broadcast,
    mask: int2ip(mask),
    wildcard: int2ip(~mask >>> 0),
    first: int2ip(first),
    last: int2ip(last),
    total,
    usable: prefix >= 31 ? total : total - 2,
    prefix,
  }
}
