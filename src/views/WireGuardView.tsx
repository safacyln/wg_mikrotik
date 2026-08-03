import { useState } from 'react'
import { Field, inputClass } from '../components/Field'
import { RackCardHeader } from '../components/RackCardHeader'
import { TermOutput } from '../components/TermOutput'
import { CrossStrip } from '../components/CrossStrip'
import { QrCode } from '../components/QrCode'
import { generateKeyPair, generatePresharedKey } from '../lib/wireguard'
import { addOffset, isValidIPv4 } from '../lib/ip'
import {
  mikrotikServerConfig,
  mikrotikClientConfig,
  wgQuickClientConfig,
  type ServerSettings,
  type ClientEntry,
  type KeySet,
} from '../lib/configs'

type OutputTab = 'mikrotik-server' | 'mikrotik-client' | 'client-conf'

interface GeneratedResult {
  settings: ServerSettings
  keys: KeySet
  clients: ClientEntry[]
}

export function WireGuardView() {
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
    <>
      <div className="mb-[30px] max-w-[640px]">
        <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] tracking-widest text-amber uppercase before:h-px before:w-4 before:bg-amber before:opacity-60">
          Config Generator
        </p>
        <h1 className="mb-2.5 text-[27px] font-semibold tracking-tight text-text">
          WireGuard Config Generator
        </h1>
        <p className="text-[14.5px] leading-relaxed text-text-muted">
          MikroTik server, MikroTik client ve Windows / mobil client konfigürasyonlarını tek
          formdan üretin. Anahtarlar tarayıcınızda üretilir, hiçbir yere gönderilmez.
        </p>
      </div>

      <div className="rack-card mb-[22px] rounded-[3px] border border-border bg-surface py-[26px] pr-7">
        <RackCardHeader unitTag="1U — Sunucu & Tünel Ayarları" ready={!!result} />

        <div className="grid grid-cols-1 gap-x-[22px] gap-y-[18px] sm:grid-cols-2">
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
            <input className={inputClass} value={dns} onChange={(e) => setDns(e.target.value)} />
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

        <label className="mt-4 flex items-center gap-[9px] text-[13px] text-text-muted">
          <input
            type="checkbox"
            checked={usePresharedKey}
            onChange={(e) => setUsePresharedKey(e.target.checked)}
            className="h-[15px] w-[15px] accent-amber"
          />
          Preshared key kullan (ek güvenlik katmanı)
        </label>

        {error && (
          <p className="mt-4 rounded-[3px] border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-[22px] flex justify-end gap-2.5">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-2.5 rounded-[3px] bg-amber px-5 py-[11px] text-[13.5px] font-semibold text-[#17110a] transition hover:shadow-[0_0_0_3px_rgba(255,138,61,0.18)] active:translate-y-px"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
            </svg>
            Oluştur
          </button>
        </div>
      </div>

      {result && (
        <>
          <div className="mb-[22px] flex flex-wrap gap-2">
            {(
              [
                { id: 'mikrotik-server', label: 'MikroTik Server' },
                { id: 'mikrotik-client', label: 'MikroTik Client' },
                { id: 'client-conf', label: 'Windows / Mobil Client' },
              ] as { id: OutputTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setOutputTab(tab.id)}
                className={`rounded-[3px] border px-3.5 py-2 font-mono text-[12px] transition ${
                  outputTab === tab.id
                    ? 'border-amber-dim bg-surface-raised text-amber'
                    : 'border-border text-text-muted hover:border-text-dim hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {outputTab !== 'mikrotik-server' && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11.5px] text-text-dim">Client seç:</span>
              {result.clients.map((c, i) => (
                <button
                  key={c.name}
                  onClick={() => setActiveClientIndex(i)}
                  className={`rounded-[3px] border px-2.5 py-1 font-mono text-[11.5px] transition ${
                    activeClientIndex === i
                      ? 'border-teal-dim text-teal'
                      : 'border-border text-text-muted hover:text-text'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {outputTab === 'mikrotik-server' && (
            <TermOutput
              prompt="/interface/wireguard export"
              text={mikrotikServerConfig(result.settings, result.keys, result.clients)}
              filename="mikrotik-server.rsc"
            />
          )}

          {outputTab === 'mikrotik-client' && (
            <TermOutput
              prompt={`/interface/wireguard export — ${result.clients[activeClientIndex].name}`}
              text={mikrotikClientConfig(
                result.settings,
                result.keys,
                result.clients[activeClientIndex],
              )}
              filename={`mikrotik-${result.clients[activeClientIndex].name}.rsc`}
            />
          )}

          {outputTab === 'client-conf' && (
            <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
              <TermOutput
                prompt={`wg-quick — ${result.clients[activeClientIndex].name}.conf`}
                text={wgQuickClientConfig(
                  result.settings,
                  result.keys,
                  result.clients[activeClientIndex],
                )}
                filename={`${result.clients[activeClientIndex].name}.conf`}
              />
              <div className="flex flex-col items-center justify-self-center">
                <QrCode
                  text={wgQuickClientConfig(
                    result.settings,
                    result.keys,
                    result.clients[activeClientIndex],
                  )}
                />
                <span className="mt-2 font-mono text-[11px] text-text-dim">
                  WireGuard mobil app ile tara
                </span>
              </div>
            </div>
          )}
        </>
      )}

      <CrossStrip />
    </>
  )
}
