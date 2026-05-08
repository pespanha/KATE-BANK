import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import { useState, useEffect } from "react";
import { fetchWithRetry, isOnAuthPage } from "@/react-app/hooks/useApi";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Coins,
  FolderOpen,
  MessageSquare,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
  Plus,
  Home,
  RefreshCw,
  AlertTriangle,
  Bell,
  Check
} from "lucide-react";

interface UserProfile {
  id: number;
  user_id: string;
  role: "investidor" | "capitador";
  document_type: string;
  document_number: string;
  company_name: string | null;
  phone: string | null;
  is_onboarding_complete: number;
  welcome_seen: number;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const NAV_ITEMS = [
  { path: "/app", label: "Visão Geral", icon: LayoutDashboard, exact: true },
  { path: "/app/oportunidades", label: "Oportunidades", icon: TrendingUp },
  { path: "/app/investimentos", label: "Investimentos", icon: Briefcase },
  { path: "/app/carteira", label: "Carteira", icon: Coins },
  { path: "/app/projetos", label: "Projetos", icon: FolderOpen },
  { path: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
  { path: "/app/documentos", label: "Documentos", icon: FileText },
];

const BOTTOM_NAV = [
  { path: "/app/perfil", label: "Perfil", icon: User },
];

export default function AppLayout({ children, title, subtitle, actions }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isPending, authState, authError, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Handle auth state changes - redirect if unauthenticated
  useEffect(() => {
    if (authState === "unauthenticated" && !isOnAuthPage()) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;
      navigate(redirectUrl, { replace: true });
    }
  }, [authState, location.pathname, location.search, navigate]);

  // Fetch profile when authenticated
  useEffect(() => {
    if (authState === "authenticated" && user) {
      fetchProfile();
      fetchUnreadMessages();
    }
  }, [authState, user]);

  // Refresh unread count periodically and on navigation
  useEffect(() => {
    if (authState === "authenticated") {
      fetchUnreadMessages();
      fetchUnreadNotificationsCount();
      const interval = setInterval(() => {
        fetchUnreadMessages();
        fetchUnreadNotificationsCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [authState, location.pathname]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNotifications]);

  const fetchUnreadMessages = async () => {
    try {
      const res = await fetchWithRetry("/api/user/unread-messages");
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.unread_count || 0);
      }
    } catch (e) {
      console.error("Error fetching unread messages:", e);
    }
  };

  const fetchUnreadNotificationsCount = async () => {
    try {
      const res = await fetchWithRetry("/api/user/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadNotifications(data.unread_count || 0);
      }
    } catch (e) {
      console.error("Error fetching unread notifications:", e);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetchWithRetry("/api/user/notifications?limit=10");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleToggleNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showNotifications) {
      await fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await fetchWithRetry(`/api/user/notifications/${notificationId}/read`, {
        method: "PUT"
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadNotifications(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchWithRetry("/api/user/notifications/read-all", {
        method: "PUT"
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadNotifications(0);
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.is_read === 0) {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      setShowNotifications(false);
      navigate(notification.link);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetchWithRetry("/api/user-profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        
        // If no profile or no role, redirect to onboarding for role selection
        if (!data.profile?.role) {
          navigate("/onboarding");
          return;
        }
        
        // If profile exists but onboarding not complete, redirect to complete it
        if (!data.profile?.is_onboarding_complete) {
          navigate("/onboarding");
          return;
        }
        
        // Show welcome modal if not seen yet
        if (data.profile?.welcome_seen === 0) {
          setShowWelcomeModal(true);
        }
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleDismissWelcome = async (goToSettings: boolean) => {
    try {
      await fetchWithRetry("/api/user-profile/welcome-seen", {
        method: "PUT"
      });
      setShowWelcomeModal(false);
      if (goToSettings) {
        navigate("/app/configuracoes");
      }
    } catch (e) {
      console.error("Error marking welcome as seen:", e);
      setShowWelcomeModal(false);
    }
  };

  const handleRetry = () => {
    refreshUser();
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // LOADING STATE - Show skeleton, never blank
  if (isPending || authState === "loading") {
    return (
      <div className="min-h-screen bg-kate-bg flex">
        {/* Skeleton Sidebar */}
        <aside className="hidden lg:block w-72 bg-navy-deep">
          <div className="p-6 border-b border-white/10">
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </aside>
        
        {/* Skeleton Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Skeleton Header */}
          <header className="bg-white border-b border-kate-border px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="lg:hidden w-10 h-10 bg-gray-200 rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-7 w-48 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </header>
          
          {/* Loading message */}
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-navy-deep">Carregando sua conta…</p>
              <p className="text-sm text-gray-500 mt-1">Aguarde um momento</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ERROR STATE - Show retry options, never blank
  if (authState === "error") {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-navy-deep mb-2">Não conseguimos carregar sua sessão</h2>
          <p className="text-gray-600 mb-6">{authError || "Ocorreu um erro. Por favor, tente novamente."}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar novamente
            </button>
            <Link
              to="/auth/login"
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-navy-deep text-navy-deep font-semibold rounded-xl hover:bg-navy-deep hover:text-white transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // UNAUTHENTICATED STATE - Redirecting (show message while redirect happens)
  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecionando para login…</p>
        </div>
      </div>
    );
  }

  // AUTHENTICATED STATE - Render the actual content
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
        <SidebarContent
          user={user}
          profile={profile}
          currentPath={location.pathname}
          isActive={isActive}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          unreadMessages={unreadMessages}
          isMobile={sidebarOpen}
        />
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
            {actions && <div className="flex-shrink-0">{actions}</div>}
            
            {/* Notifications Bell */}
            <div className="relative notifications-dropdown">
              <button
                onClick={handleToggleNotifications}
                className="relative p-2 text-gray-600 hover:text-navy-deep hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full text-center">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-kate-border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-kate-border flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-navy-deep">Notificações</h3>
                    {unreadNotifications > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-gold hover:text-gold-hover font-medium flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma notificação</p>
                      </div>
                    ) : (
                      <ul>
                        {notifications.map((notification) => (
                          <li key={notification.id}>
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                                notification.is_read === 0 ? "bg-gold/5" : ""
                              }`}
                            >
                              <div className="flex gap-3">
                                {notification.is_read === 0 && (
                                  <span className="w-2 h-2 bg-gold rounded-full mt-2 flex-shrink-0" />
                                )}
                                <div className={notification.is_read === 0 ? "" : "pl-5"}>
                                  <p className={`text-sm ${notification.is_read === 0 ? "font-semibold text-navy-deep" : "text-gray-700"}`}>
                                    {notification.title}
                                  </p>
                                  {notification.message && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                      {notification.message}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.created_at).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <Link
                    to="/app/notificacoes"
                    onClick={() => setShowNotifications(false)}
                    className="block px-4 py-3 text-center text-sm font-medium text-gold hover:text-gold-hover border-t border-kate-border bg-gray-50"
                  >
                    Ver todas as notificações
                  </Link>
                </div>
              )}
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
          <div className="max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Confetti effect (CSS-based) */}
            <div className="relative h-32 bg-gradient-to-br from-gold via-gold-hover to-amber-500 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">🎉</div>
              </div>
              {/* Decorative dots */}
              <div className="absolute top-4 left-4 w-3 h-3 rounded-full bg-white/30 animate-pulse" />
              <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-white/40 animate-pulse delay-100" />
              <div className="absolute bottom-6 left-12 w-2 h-2 rounded-full bg-white/30 animate-pulse delay-200" />
              <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white/20 animate-pulse delay-300" />
              <div className="absolute top-12 left-1/3 w-2 h-2 rounded-full bg-white/50 animate-pulse delay-150" />
            </div>
            
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold text-navy-deep mb-2">
                Bem-vindo à Kate! 🚀
              </h2>
              <p className="text-gray-600 mb-6">
                Sua conta foi criada com sucesso. Estamos felizes em tê-lo conosco na 
                plataforma de investimentos em startups mais transparente do Brasil.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleDismissWelcome(false)}
                  className="w-full px-6 py-3 bg-navy-deep text-white font-semibold rounded-xl hover:bg-navy-deep/90 transition-colors"
                >
                  Ir para Dashboard
                </button>
                <button
                  onClick={() => handleDismissWelcome(true)}
                  className="w-full px-6 py-3 border-2 border-gold text-gold font-semibold rounded-xl hover:bg-gold/10 transition-colors"
                >
                  Completar cadastro agora
                </button>
              </div>
              
              <p className="mt-4 text-xs text-gray-400">
                Você pode completar seu cadastro a qualquer momento nas configurações
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SidebarContentProps {
  user: any;
  profile: UserProfile | null;
  currentPath: string;
  isActive: (path: string, exact?: boolean) => boolean;
  onLogout: () => void;
  onClose?: () => void;
  unreadMessages: number;
  isMobile?: boolean;
}

function SidebarContent({ 
  user, 
  profile, 
  isActive, 
  onLogout, 
  onClose, 
  unreadMessages,
  isMobile 
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <Link to="/app" className="flex items-center gap-3">
          <img 
            src="https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/Kate-Equity-Crowdfunding.png" 
            alt="Kate" 
            className="h-10 w-auto"
          />
        </Link>
        {isMobile && onClose && (
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {user?.google_user_data?.picture ? (
            <img
              src={user.google_user_data.picture}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
              <span className="text-navy-deep font-bold">
                {user?.email?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.google_user_data?.name || user?.email || "Usuário"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {profile?.role === "capitador" && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/70">
                  Emissor
                </span>
              )}
              {profile?.role === "investidor" && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gold/20 text-gold">
                  Investidor
                </span>
              )}
              {!profile?.role && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/50">
                  Usuário
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="p-4 border-b border-white/10">
        <Link
          to="/app/projetos/novo"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Projeto
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path, item.exact);
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    active
                      ? "bg-gold text-navy-deep font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.path === "/app/mensagens" && unreadMessages > 0 && (
                    <span className={`min-w-[20px] px-1.5 py-0.5 text-xs font-bold rounded-full text-center ${
                      active ? "bg-navy-deep text-white" : "bg-red-500 text-white"
                    }`}>
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom navigation */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Ir para o site</span>
        </Link>
        {BOTTOM_NAV.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                active
                  ? "bg-gold text-navy-deep font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
