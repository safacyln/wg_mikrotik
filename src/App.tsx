import { useState } from 'react'
import { Field, inputClass } from './components/Field'
import { CopyButton } from './components/CopyButton'
import { DownloadButton } from './components/DownloadButton'
import { QrCode } from './components/QrCode'
import { generateKeyPair, generatePresharedKey } from './lib/wireguard'
import { addOffset, isValidIPv4 } from './lib/ip'
import {
  mikrotikServerConfig,
  mikrotikClientConfig,
  wgQuickClientConfig,
  type ServerSettings,
  type ClientEntry,
  type KeySet,
} from './lib/configs'

type OutputTab = 'mikrotik-server' | 'mikrotik-client' | 'client-conf'

interface GeneratedResult {
  settings: ServerSettings
  keys: KeySet
  clients: ClientEntry[]
}

const partnerLinks = [
  {
    name: 'LogiSpot',
    description: 'Cloud Hotspot çözümü ile misafir ağı ve internet erişim yönetimi.',
  },
  {
    name: 'LogiFeeds',
    description:
      "USOM, ESB ve BTK'nın ilettiği engelleme ve yasaklanması gereken kararları otomatik olarak uygulayan engelleme sistemi.",
  },
  {
    name: 'MikroTik Danışmanlık',
    description: 'LogiSafe MikroTik network danışmanlık hizmetleri ile ISP planlama.',
  },
  {
    name: 'DDoS Danışmanlık',
    description: 'LogiSafe DDoS koruma danışmanlık ve mitigasyon çözümleri.',
  },
]

export default function App() {
  const [endpoint, setEndpoint] = useState('')
  const [listenPort, setListenPort] = useState(51820)
  const [serverInterfaceName, setServerInterfaceName] = useState('wireguard1')
  const [serverAddress, setServerAddress] = useState('10.10.0.1')
  const [serverCidr, setServerCidr] = useState(24)
  const [mtu, setMtu] = useState(1420)
  const [dns, setDns] = useState('1.1.1.1, 1.0.0.1')
  const [allowedIPs, setAllowedIPs] = useState('0.0.0.0/0')
  const [persistentKeepalive, setPersistentKeepalive] = useState(25)
  const [usePresharedKey, setUsePresharedKey] = useState(true)
  const [clientCount, setClientCount] = useState(1)

  const [error, setError] = useState('')
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [outputTab, setOutputTab] = useState<OutputTab>('mikrotik-server')
  const [activeClientIndex, setActiveClientIndex] = useState(0)

  function handleGenerate() {
    if (!endpoint.trim()) {
      setError('Server endpoint (public IP veya hostname) zorunludur.')
      return
    }
    if (!isValidIPv4(serverAddress)) {
      setError('Server tünel IP adresi geçersiz.')
      return
    }
    if (clientCount < 1 || clientCount > 250) {
      setError('Client sayısı 1 ile 250 arasında olmalıdır.')
      return
    }
    setError('')

    const settings: ServerSettings = {
      endpoint: endpoint.trim(),
      listenPort,
      serverInterfaceName: serverInterfaceName.trim() || 'wireguard1',
      serverAddress,
      serverCidr,
      mtu,
      dns: dns.trim(),
      allowedIPs: allowedIPs.trim() || '0.0.0.0/0',
      persistentKeepalive,
      usePresharedKey,
    }

    const serverKeys = generateKeyPair()
    const keys: KeySet = {
      serverPrivateKey: serverKeys.privateKey,
      serverPublicKey: serverKeys.publicKey,
    }

    const clients: ClientEntry[] = Array.from({ length: clientCount }, (_, i) => {
      const pair = generateKeyPair()
      return {
        name: `Client-${i + 1}`,
        address: addOffset(serverAddress, i + 1),
        privateKey: pair.privateKey,
        publicKey: pair.publicKey,
        presharedKey: usePresharedKey ? generatePresharedKey() : '',
      }
    })

    setResult({ settings, keys, clients })
    setActiveClientIndex(0)
    setOutputTab('mikrotik-server')
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] px-4 py-12 text-slate-200">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
          WireGuard Config Generator
        </h1>
        <p className="mt-3 text-center text-slate-400">
          MikroTik server, MikroTik client ve Windows / Mobil client konfigürasyonlarını tek
          formdan oluşturun.
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-[#0d1018] p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Server Endpoint (Public IP / Hostname)">
              <input
                className={inputClass}
                placeholder="örn. vpn.firmaniz.com veya 1.2.3.4"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </Field>
            <Field label="Dinleme Portu (Listen Port)">
              <input
                type="number"
                className={inputClass}
                value={listenPort}
                onChange={(e) => setListenPort(Number(e.target.value))}
              />
            </Field>

            <Field label="Server Arayüz Adı (MikroTik interface)">
              <input
                className={inputClass}
                value={serverInterfaceName}
                onChange={(e) => setServerInterfaceName(e.target.value)}
              />
            </Field>
            <Field label="Server Tünel IP Adresi">
              <input
                className={inputClass}
                placeholder="örn. 10.10.0.1"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
              />
            </Field>

            <Field label="Subnet (CIDR)">
              <input
                type="number"
                className={inputClass}
                value={serverCidr}
                onChange={(e) => setServerCidr(Number(e.target.value))}
              />
            </Field>
            <Field label="MTU">
              <input
                type="number"
                className={inputClass}
                value={mtu}
                onChange={(e) => setMtu(Number(e.target.value))}
              />
            </Field>

            <Field label="Client DNS">
              <input
                className={inputClass}
                value={dns}
                onChange={(e) => setDns(e.target.value)}
              />
            </Field>
            <Field label="Client Allowed IPs (tünelden geçecek trafik)">
              <input
                className={inputClass}
                value={allowedIPs}
                onChange={(e) => setAllowedIPs(e.target.value)}
              />
            </Field>

            <Field label="Persistent Keepalive (sn)">
              <input
                type="number"
                className={inputClass}
                value={persistentKeepalive}
                onChange={(e) => setPersistentKeepalive(Number(e.target.value))}
              />
            </Field>
            <Field label="Kaç client için config üretilecek?">
              <input
                type="number"
                min={1}
                max={250}
                className={inputClass}
                value={clientCount}
                onChange={(e) => setClientCount(Number(e.target.value))}
              />
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={usePresharedKey}
              onChange={(e) => setUsePresharedKey(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-[#11141c] accent-emerald-500"
            />
            Preshared key kullan (ek güvenlik katmanı)
          </label>

          {error && (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              Oluştur
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#0d1018] p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
              {[
                { id: 'mikrotik-server', label: 'MikroTik Server' },
                { id: 'mikrotik-client', label: 'MikroTik Client' },
                { id: 'client-conf', label: 'Windows / Mobil Client' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOutputTab(tab.id as OutputTab)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    outputTab === tab.id
                      ? 'bg-emerald-500 text-emerald-950'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {outputTab === 'mikrotik-server' && (
              <OutputPanel
                title="MikroTik Server (RouterOS) Komutları"
                text={mikrotikServerConfig(result.settings, result.keys, result.clients)}
                filename="mikrotik-server.rsc"
              />
            )}

            {outputTab !== 'mikrotik-server' && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-400">Client seç:</span>
                {result.clients.map((c, i) => (
                  <button
                    key={c.name}
                    onClick={() => setActiveClientIndex(i)}
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      activeClientIndex === i
                        ? 'bg-emerald-500 text-emerald-950'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {outputTab === 'mikrotik-client' && (
              <OutputPanel
                title={`MikroTik Client (RouterOS) — ${result.clients[activeClientIndex].name}`}
                text={mikrotikClientConfig(
                  result.settings,
                  result.keys,
                  result.clients[activeClientIndex],
                )}
                filename={`mikrotik-${result.clients[activeClientIndex].name}.rsc`}
              />
            )}

            {outputTab === 'client-conf' && (
              <ClientConfPanel
                title={`Windows / Mobil Client — ${result.clients[activeClientIndex].name}`}
                text={wgQuickClientConfig(
                  result.settings,
                  result.keys,
                  result.clients[activeClientIndex],
                )}
                filename={`${result.clients[activeClientIndex].name}.conf`}
              />
            )}
          </div>
        )}

        <h2 className="mt-16 text-center text-2xl font-semibold text-slate-100">
          LogiSafe Çözümleri
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {partnerLinks.map((p) => (
            <div
              key={p.name}
              className="rounded-xl border border-white/10 bg-[#0d1018] p-5"
            >
              <p className="font-semibold text-blue-400">{p.name}</p>
              <p className="mt-2 text-sm text-slate-400">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OutputPanel({
  title,
  text,
  filename,
}: {
  title: string
  text: string
  filename: string
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-300">{title}</h3>
        <div className="flex gap-2">
          <CopyButton text={text} />
          <DownloadButton text={text} filename={filename} />
        </div>
      </div>
      <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-white/10 bg-[#11141c] p-4 text-left text-sm text-emerald-300">
        {text}
      </pre>
    </div>
  )
}

function ClientConfPanel({
  title,
  text,
  filename,
}: {
  title: string
  text: string
  filename: string
}) {
  return (
    <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_auto]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-slate-300">{title}</h3>
          <div className="flex gap-2">
            <CopyButton text={text} />
            <DownloadButton text={text} filename={filename} />
          </div>
        </div>
        <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg border border-white/10 bg-[#11141c] p-4 text-left text-sm text-emerald-300">
          {text}
        </pre>
      </div>
      <div className="flex flex-col items-center gap-2 justify-self-center">
        <QrCode text={text} />
        <span className="text-xs text-slate-500">WireGuard mobil app ile tara</span>
      </div>
    </div>
  )
}
