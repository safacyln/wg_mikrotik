import { int2ip, subnetInfo } from './ip'

export interface CgnatBlock {
  publicCidr: string
  privateCidr: string
  startPort: number
  portWidth: number
}

export interface CgnatSettings {
  iface: string
  comment: string
  useUdp: boolean
  useTcp: boolean
  useIcmp: boolean
}

function parseCidr(input: string) {
  const [ip, prefixStr] = input.trim().split('/')
  const prefix = parseInt(prefixStr, 10)
  if (!ip || Number.isNaN(prefix)) return null
  return subnetInfo(ip, prefix)
}

export function generateCgnatConfig(
  settings: CgnatSettings,
  blocks: CgnatBlock[],
): string | null {
  const parsedBlocks = blocks.map((b) => ({
    ...b,
    pub: parseCidr(b.publicCidr),
    priv: parseCidr(b.privateCidr),
  }))

  if (parsedBlocks.length === 0 || parsedBlocks.some((b) => !b.pub || !b.priv)) {
    return null
  }

  let out = ''
  let radius = ''

  parsedBlocks.forEach((block, idx) => {
    const { pub, priv, publicCidr, privateCidr, startPort, portWidth } = block
    if (!pub || !priv) return
    const tag = `${settings.comment}-${idx + 1}`
    const endPort = startPort + portWidth - 1

    out += `\n# --- Blok ${idx + 1}: ${publicCidr} <-> ${privateCidr} ---\n`
    out += `/ip firewall nat\n`
    out += `add chain=srcnat action=netmap src-address=${privateCidr} to-addresses=${pub.network} out-interface=${settings.iface} comment="${tag}"\n`
    out += `add chain=dstnat action=netmap dst-address=${publicCidr} to-addresses=${priv.network} in-interface=${settings.iface} comment="${tag}"\n`

    if (settings.useTcp) {
      out += `add chain=srcnat action=netmap protocol=tcp src-address=${privateCidr} dst-port=${startPort}-${endPort} to-addresses=${pub.network} out-interface=${settings.iface} comment="${tag}-tcp"\n`
    }
    if (settings.useUdp) {
      out += `add chain=srcnat action=netmap protocol=udp src-address=${privateCidr} dst-port=${startPort}-${endPort} to-addresses=${pub.network} out-interface=${settings.iface} comment="${tag}-udp"\n`
    }
    if (settings.useIcmp) {
      out += `add chain=srcnat action=netmap protocol=icmp src-address=${privateCidr} to-addresses=${pub.network} out-interface=${settings.iface} comment="${tag}-icmp"\n`
    }

    const hostCount = priv.usable > 0 ? priv.usable : priv.total
    const slice = Math.floor(portWidth / hostCount) || 1
    radius += `\n# ${privateCidr} -> port aralığı paylaşımı (${hostCount} host)\n`
    for (let h = 0; h < hostCount; h++) {
      const hostIp = int2ip(priv.networkInt + (priv.usable > 0 ? 1 : 0) + h)
      const s = startPort + h * slice
      const e = Math.min(s + slice - 1, endPort)
      radius += `${hostIp}\tCisco-AVPair = "cgnat:port-range=${s}-${e}"\n`
    }
  })

  out += `\n\n# --- RADIUS port-eşleme (Cisco-AVPair, örnek format) ---\n${radius}`
  return out.trim()
}
