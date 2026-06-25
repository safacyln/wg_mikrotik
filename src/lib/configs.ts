export interface ServerSettings {
  endpoint: string
  listenPort: number
  serverInterfaceName: string
  serverAddress: string // e.g. 10.10.0.1
  serverCidr: number // e.g. 24
  mtu: number
  dns: string
  allowedIPs: string // what clients tunnel through, e.g. 0.0.0.0/0
  persistentKeepalive: number
  usePresharedKey: boolean
}

export interface ClientEntry {
  name: string
  address: string // e.g. 10.10.0.2
  privateKey: string
  publicKey: string
  presharedKey: string
}

export interface KeySet {
  serverPrivateKey: string
  serverPublicKey: string
}

export function mikrotikServerConfig(
  settings: ServerSettings,
  keys: KeySet,
  clients: ClientEntry[],
): string {
  const lines: string[] = []
  lines.push('/interface wireguard')
  lines.push(
    `add listen-port=${settings.listenPort} mtu=${settings.mtu} name=${settings.serverInterfaceName} private-key="${keys.serverPrivateKey}"`,
  )
  lines.push('')
  lines.push('/ip address')
  lines.push(
    `add address=${settings.serverAddress}/${settings.serverCidr} interface=${settings.serverInterfaceName}`,
  )
  lines.push('')
  lines.push('/interface wireguard peers')
  for (const client of clients) {
    const psk = settings.usePresharedKey
      ? ` preshared-key="${client.presharedKey}"`
      : ''
    lines.push(
      `add interface=${settings.serverInterfaceName} public-key="${client.publicKey}" allowed-address=${client.address}/32${psk} comment="${client.name}"`,
    )
  }
  lines.push('')
  lines.push('/ip firewall filter')
  lines.push(
    `add chain=input protocol=udp dst-port=${settings.listenPort} action=accept comment="WireGuard ${settings.serverInterfaceName}" place-before=0`,
  )
  return lines.join('\n')
}

export function mikrotikClientConfig(
  settings: ServerSettings,
  keys: KeySet,
  client: ClientEntry,
  clientInterfaceName = 'wireguard1',
): string {
  const lines: string[] = []
  lines.push('/interface wireguard')
  lines.push(
    `add listen-port=${settings.listenPort} mtu=${settings.mtu} name=${clientInterfaceName} private-key="${client.privateKey}"`,
  )
  lines.push('')
  lines.push('/ip address')
  lines.push(`add address=${client.address}/32 interface=${clientInterfaceName}`)
  lines.push('')
  lines.push('/interface wireguard peers')
  const psk = settings.usePresharedKey
    ? ` preshared-key="${client.presharedKey}"`
    : ''
  lines.push(
    `add interface=${clientInterfaceName} public-key="${keys.serverPublicKey}" endpoint-address=${settings.endpoint} endpoint-port=${settings.listenPort} allowed-address=${settings.allowedIPs}${psk} persistent-keepalive=${settings.persistentKeepalive}s comment="${settings.serverInterfaceName}"`,
  )
  lines.push('')
  lines.push('/ip route')
  if (settings.allowedIPs === '0.0.0.0/0') {
    lines.push(`add dst-address=0.0.0.0/0 gateway=${clientInterfaceName}`)
  } else {
    for (const net of settings.allowedIPs.split(',').map((n) => n.trim())) {
      lines.push(`add dst-address=${net} gateway=${clientInterfaceName}`)
    }
  }
  return lines.join('\n')
}

export function wgQuickClientConfig(
  settings: ServerSettings,
  keys: KeySet,
  client: ClientEntry,
): string {
  const lines: string[] = []
  lines.push('[Interface]')
  lines.push(`PrivateKey = ${client.privateKey}`)
  lines.push(`Address = ${client.address}/32`)
  if (settings.dns.trim()) lines.push(`DNS = ${settings.dns}`)
  lines.push(`MTU = ${settings.mtu}`)
  lines.push('')
  lines.push('[Peer]')
  lines.push(`PublicKey = ${keys.serverPublicKey}`)
  if (settings.usePresharedKey) {
    lines.push(`PresharedKey = ${client.presharedKey}`)
  }
  lines.push(`Endpoint = ${settings.endpoint}:${settings.listenPort}`)
  lines.push(`AllowedIPs = ${settings.allowedIPs}`)
  lines.push(`PersistentKeepalive = ${settings.persistentKeepalive}`)
  return lines.join('\n')
}
