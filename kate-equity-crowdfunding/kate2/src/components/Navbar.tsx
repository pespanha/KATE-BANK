'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, BarChart2, LogOut, User, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/offers',    label: 'Oportunidades' },
  { href: '/secondary', label: 'Mercado Secundário' },
  { href: '/captar',    label: 'Captar Recursos' },
  { href: '/about',     label: 'Sobre' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isLoggedIn = !!user

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-kate-navy backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-lg bg-kate-orange flex items-center justify-center shadow-md shadow-kate-orange/20 group-hover:shadow-kate-orange/40 transition-shadow">
              <span className="text-kate-navy font-black text-lg leading-none">K</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Kate <span className="text-kate-orange">Equity</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {!loading && isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
                >
                  <BarChart2 size={15} />
                  Dashboard
                </Link>
                <Link
                  href="/portfolio"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
                >
                  <Briefcase size={15} />
                  Portfólio
                </Link>
                <div className="w-px h-5 bg-white/10 mx-1" />
                <span className="text-xs text-white/40 max-w-[120px] truncate">
                  {user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-red-400/70 hover:text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-all"
                >
                  <BarChart2 size={15} />
                  Dashboard
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded-lg px-4 py-2 transition-all"
                >
                  Entrar
                </Link>
                <Link
                  href="/onboarding"
                  className="text-sm font-bold bg-kate-orange text-kate-navy rounded-lg px-4 py-2 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-kate-orange/25 transition-all"
                >
                  Criar Conta
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Burger */}
          <button
            className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-kate-navy px-4 py-4 flex flex-col gap-1 animate-fade-in">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-white/80 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all"
          >
            <BarChart2 size={15} /> Dashboard
          </Link>
          <div className="border-t border-white/[0.06] pt-3 mt-2 flex flex-col gap-2">
            {isLoggedIn ? (
              <>
                <Link href="/portfolio" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 text-center py-2.5 px-3 text-sm font-medium text-white hover:bg-white/[0.04] rounded-lg transition-all">
                  <Briefcase size={15} /> Portfólio
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout() }}
                  className="text-center py-2.5 border border-red-400/20 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Sair da conta
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 border border-white/15 rounded-lg text-sm font-medium text-white hover:bg-white/[0.04] transition-all">
                  Entrar
                </Link>
                <Link href="/onboarding" onClick={() => setMobileOpen(false)}
                  className="text-center py-2.5 bg-kate-orange text-kate-navy rounded-lg text-sm font-bold hover:brightness-110 transition-all">
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
