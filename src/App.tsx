import { useState } from 'react'
import { WireGuardView } from './views/WireGuardView'
import { IpCalcView } from './views/IpCalcView'
import { CgnatView } from './views/CgnatView'

type View = 'wg' | 'ipcalc' | 'cgnat'

const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: 'wg',
    label: 'WireGuard Generator',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 flex-none opacity-85">
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    ),
  },
  {
    id: 'ipcalc',
    label: 'IP Adresi ve Subnet Hesaplayıcı',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 flex-none opacity-85">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'cgnat',
    label: 'CGNAT / RADIUS',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 flex-none opacity-85">
        <circle cx="5" cy="12" r="2.2" />
        <circle cx="19" cy="5" r="2.2" />
        <circle cx="19" cy="19" r="2.2" />
        <path d="M7 11l10-5M7 13l10 5" />
      </svg>
    ),
  },
]

export default function App() {
  const [view, setView] = useState<View>('wg')

  return (
    <div className="mx-auto grid min-h-screen max-w-[1240px] grid-cols-1 md:grid-cols-[240px_1fr]">
      <aside className="rack-rail relative border-b border-border-soft px-5 py-5 md:border-b-0 md:border-r md:px-0 md:py-7">
        <div className="flex items-center gap-2.5 px-0 pb-3.5 md:px-6 md:pb-[22px]">
          <div className="brand-mark" />
          <div>
            <div className="text-[14.5px] font-semibold tracking-tight text-text">LogiSafe</div>
            <span className="mt-px block font-mono text-[10.5px] tracking-wide text-text-dim">
              ÜCRETSİZ ARAÇLAR
            </span>
          </div>
        </div>

        <div className="hidden font-mono text-[11px] tracking-wide text-text-dim md:block md:px-6 md:pb-[18px]">
          [<span className="text-amber">admin</span>@logisafe] &gt; /tools/
          <span className="animate-[blink_1.1s_step-end_infinite] text-teal">_</span>
        </div>

        <nav className="flex gap-2 overflow-x-auto px-0 py-1 md:flex-col md:gap-0.5 md:overflow-visible md:px-3">
          {navItems.map((item) => {
            const active = view === item.id
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`relative flex items-center gap-[11px] whitespace-nowrap rounded-[3px] border px-3 py-[11px] text-left text-[13.5px] font-medium transition md:whitespace-normal ${
                  active
                    ? 'border-border bg-surface-raised text-text before:absolute before:top-1/2 before:-left-[13px] before:hidden before:h-4 before:w-[3px] before:-translate-y-1/2 before:rounded-full before:bg-amber md:before:block'
                    : 'border-transparent text-text-muted hover:bg-surface hover:text-text'
                }`}
              >
                {item.icon}
                {item.label}
                <span
                  className={`ml-auto h-[5px] w-[5px] flex-none rounded-full ${
                    active ? 'bg-teal shadow-[0_0_6px_#56e6c9]' : 'bg-text-dim'
                  }`}
                />
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="min-w-0 px-5 py-8 md:px-11 md:py-10">
        {view === 'wg' && <WireGuardView />}
        {view === 'ipcalc' && <IpCalcView />}
        {view === 'cgnat' && <CgnatView />}
      </main>
    </div>
  )
}
