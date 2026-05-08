'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Wallet, ChevronDown, BarChart2 } from 'lucide-react'
import { KateLogo } from './KateLogo'

const navLinks = [
  { href: '/offers',    label: 'Oportunidades' },
  { href: '/secondary', label: 'Mercado Secundário' },
  { href: '/captar',    label: 'Captar Recursos' },
  { href: '/about',     label: 'Sobre' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-kate-dark/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <KateLogo width={32} />
            <span className="font-bold text-lg tracking-tight text-white">
              Kate <span className="text-kate-yellow">Equity</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/70 hover:text-kate-yellow transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-white/70 hover:text-kate-yellow transition-colors px-3 py-2"
            >
              <BarChart2 size={16} />
              Dashboard
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-4 py-2 transition-all"
            >
              Entrar
            </Link>
            <Link
              href="/auth/cadastro"
              className="text-sm font-bold bg-kate-yellow text-kate-dark-blue rounded-lg px-4 py-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-kate-yellow/25 transition-all"
            >
              Criar Conta
            </Link>
          </div>

          {/* Mobile Burger */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-kate-dark-blue/95 backdrop-blur-md px-4 py-4 flex flex-col gap-2 animate-fade-in">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-white/80 hover:text-kate-yellow py-2.5 px-3 rounded-lg hover:bg-white/5 transition-all"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-3 mt-1 flex flex-col gap-2">
            <Link href="/auth/login"   onClick={() => setMobileOpen(false)}
              className="text-center py-2.5 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-all">
              Entrar
            </Link>
            <Link href="/auth/cadastro" onClick={() => setMobileOpen(false)}
              className="text-center py-2.5 bg-kate-yellow text-kate-dark-blue rounded-lg text-sm font-bold hover:brightness-110 transition-all">
              Criar Conta
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
