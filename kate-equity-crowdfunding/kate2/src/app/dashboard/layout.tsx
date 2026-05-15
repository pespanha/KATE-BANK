'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  CalendarCheck,
  Briefcase,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const sidebarLinks = [
  { href: '/dashboard',              label: 'Visão Geral',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/depositar',    label: 'Depositar BRZ',  icon: Wallet },
  { href: '/dashboard/reservations', label: 'Minhas Reservas', icon: CalendarCheck },
  { href: '/dashboard/portfolio',    label: 'Portfólio',      icon: Briefcase },
  { href: '/dashboard/settings',     label: 'Configurações',  icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  const sidebar = (
    <>
      {/* Logo/Title */}
      <div className="px-5 pt-6 pb-5 border-b border-white/[0.06]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-kate-orange flex items-center justify-center">
            <span className="text-kate-navy font-black text-sm">K</span>
          </div>
          Meu Painel
        </h2>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {sidebarLinks.map(link => {
          const active = isActive(link.href, link.exact)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-kate-orange/10 text-kate-yellow border border-kate-orange/20'
                  : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon size={18} className={active ? 'text-kate-yellow' : 'text-white/30'} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-white/20 leading-relaxed">
          Regulado pela CVM · Res. nº 88<br />
          Stellar Testnet
        </p>
      </div>
    </>
  )

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-kate-dark-blue border-r border-white/[0.06]">
        {sidebar}
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-40 bg-kate-dark-blue border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <LayoutDashboard size={16} className="text-kate-yellow" />
          Painel
        </h2>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/60 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay Sidebar */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-kate-dark-blue border-r border-white/[0.06] flex flex-col animate-fade-in">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 mt-12 lg:mt-0">
        {children}
      </main>
    </div>
  )
}
