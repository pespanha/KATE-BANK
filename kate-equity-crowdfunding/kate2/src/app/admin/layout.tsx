import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import prisma            from '@/lib/prisma'
import Link              from 'next/link'
import { LayoutDashboard, ListOrdered, Users, Building2, CreditCard, Coins, FileCheck, BarChart3, Settings, LogOut, ChevronRight } from 'lucide-react'

const adminNavItems = [
  { href: '/admin',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/admin/ofertas',       label: 'Ofertas',       icon: ListOrdered },
  { href: '/admin/investimentos', label: 'Investimentos', icon: CreditCard },
  { href: '/admin/tokens',        label: 'Tokens Stellar', icon: Coins },
  { href: '/admin/investidores',  label: 'Investidores',  icon: Users },
  { href: '/admin/emissores',     label: 'Emissores',     icon: Building2 },
  { href: '/admin/kyc',           label: 'KYC',           icon: FileCheck },
  { href: '/admin/kpis',          label: 'KPIs',          icon: BarChart3 },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dbUser = await prisma.user.findUnique({
    where:  { id: user.id },
    select: { role: true, full_name: true, email: true },
  }).catch(() => null)

  if (dbUser?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-kate-dark">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-kate-dark-blue border-r border-white/10 flex flex-col">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-kate-yellow flex items-center justify-center">
              <span className="text-kate-dark-blue font-black text-xs">K</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Kate Admin</p>
              <p className="text-white/40 text-xs">Painel Administrativo</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {adminNavItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all group"
            >
              <item.icon size={16} className="shrink-0 group-hover:text-kate-yellow transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-white/80 text-sm font-medium truncate">{dbUser?.full_name || user.email}</p>
            <p className="text-white/40 text-xs">Administrador</p>
          </div>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all">
            <LogOut size={14} />
            Voltar ao Site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
