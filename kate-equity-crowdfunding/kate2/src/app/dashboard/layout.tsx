import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--kate-dark-blue)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }}>
        <h2 style={{ color: 'var(--kate-yellow)', marginBottom: '2rem' }}>Meu Painel</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link href="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Visão Geral</Link>
          <Link href="/dashboard/reservations" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Minhas Reservas</Link>
          <Link href="/dashboard/portfolio" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Portfólio</Link>
          <Link href="/dashboard/settings" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Configurações</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
