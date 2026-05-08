import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FileStack,
  Megaphone,
  Coins,
  Settings,
  CreditCard,
  LogOut,
  BarChart3,
  Users,
  Building2,
  ChevronRight,
  Menu,
  Shield,
  Loader2,
  Wallet,
  FileCheck,
  UserCheck
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface AdminUser {
  email: string;
  isAdmin: boolean;
}

const NAV_ITEMS = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/kpis", label: "KPIs", icon: BarChart3 },
  { path: "/admin/investidores", label: "Investidores", icon: Users },
  { path: "/admin/emissores", label: "Emissores", icon: Building2 },
  { path: "/admin/pagamentos", label: "Pagamentos PIX", icon: CreditCard },
  { path: "/admin/pendentes", label: "Pendentes", icon: FileCheck },
  { path: "/admin/kyc", label: "Verificação KYC", icon: UserCheck },
  { path: "/admin/projetos", label: "Projetos", icon: FileStack },
  { path: "/admin/ofertas", label: "Ofertas", icon: Megaphone },
  { path: "/admin/tokens", label: "Token Jobs", icon: Coins },
  { path: "/admin/hathor", label: "API Hathor", icon: Wallet },
  { path: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [newProjectsCount, setNewProjectsCount] = useState(0);

  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (adminUser) {
      fetchNewProjectsCount();
    }
  }, [adminUser]);

  const fetchNewProjectsCount = async () => {
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNewProjectsCount(data.new_projects_count || 0);
      }
    } catch (e) {
      console.error("Error fetching new projects count:", e);
    }
  };

  const checkAdminSession = async () => {
    try {
      const response = await fetch("/api/auth/admin/me", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAdminUser({ email: data.email, isAdmin: data.isAdmin });
        } else {
          navigate("/admin/login");
        }
      } else {
        navigate("/admin/login");
      }
    } catch (error) {
      console.error("Error checking admin session:", error);
      navigate("/admin/login");
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  const isActiveLink = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST", credentials: "include" });
      navigate("/admin/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-kate-bg flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-navy-deep transform transition-transform lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link to="/admin" className="flex items-center gap-3">
              <img 
                src="https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/Kate-Equity-Crowdfunding.png" 
                alt="Kate" 
                className="h-10 w-auto"
              />
              <span className="px-2 py-0.5 text-xs font-bold bg-gold text-navy-deep rounded">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveLink(item.path, item.exact);
                const showBadge = item.path === "/admin/projetos" && newProjectsCount > 0;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        active
                          ? "bg-gold text-navy-deep font-semibold"
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                          {newProjectsCount}
                        </span>
                      )}
                      {active && !showBadge && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <Shield className="w-5 h-5 text-navy-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Administrador
                </p>
                <p className="text-xs text-white/50 truncate">{adminUser.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-kate-border px-4 lg:px-8 py-4 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-navy-deep hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-navy-deep">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <Link
              to="/"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-navy-deep hover:bg-gray-100 rounded-lg transition-colors"
            >
              Ver site
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
