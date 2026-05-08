import { Link, useLocation } from "react-router";
import { FileText, User, LogOut, LayoutDashboard, Loader2, Menu, X, Briefcase, TrendingUp, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";

export default function Header() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isPending, logout } = useAuth();

  // Close menus when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobileMenu]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const isHomePage = location.pathname === "/";

  return (
    <>
      <header className={`sticky top-0 z-50 ${isHomePage ? "bg-navy-deep/95" : "bg-white"} backdrop-blur-xl border-b ${isHomePage ? "border-white/10" : "border-kate-border"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src="https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/Kate-Equity-Crowdfunding.png"
                alt="Kate Equity Crowdfunding"
                className="h-10 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/oportunidades"
                className={`text-sm font-medium transition-colors ${
                  isHomePage 
                    ? "text-white/80 hover:text-white" 
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Oportunidades
              </Link>
              <Link
                to="/como-funciona"
                className={`text-sm font-medium transition-colors ${
                  isHomePage 
                    ? "text-white/80 hover:text-white" 
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Como funciona
              </Link>
              <Link
                to="/sobre"
                className={`text-sm font-medium transition-colors ${
                  isHomePage 
                    ? "text-white/80 hover:text-white" 
                    : "text-gray-600 hover:text-navy"
                }`}
              >
                Sobre
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/submeter-projeto"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isHomePage
                    ? "text-white/80 hover:text-white hover:bg-white/10"
                    : "text-gray-600 hover:text-navy hover:bg-gray-50"
                }`}
              >
                <FileText className="w-4 h-4" />
                Submeter projeto
              </Link>

              {/* User Menu - Desktop */}
              {isPending ? (
                <div className="p-2">
                  <Loader2 className={`w-5 h-5 animate-spin ${isHomePage ? "text-white/50" : "text-gray-400"}`} />
                </div>
              ) : user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      isHomePage ? "hover:bg-white/10" : "hover:bg-gray-50"
                    }`}
                  >
                    {user.google_user_data?.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt={user.google_user_data?.name || "User"}
                        className="w-8 h-8 rounded-full object-cover border-2 border-gold"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
                        <span className="text-navy-deep font-bold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className={`text-sm font-medium ${isHomePage ? "text-white" : "text-navy-deep"}`}>
                      {user.google_user_data?.name?.split(" ")[0] || "Conta"}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-kate-border py-2 z-50">
                      <div className="px-4 py-3 border-b border-kate-border">
                        <p className="font-medium text-navy-deep truncate">
                          {user.google_user_data?.name || user.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/app"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Meu Dashboard
                      </Link>
                      <Link
                        to="/app/investimentos"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Meus Investimentos
                      </Link>
                      <Link
                        to="/app/projetos"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Briefcase className="w-4 h-4" />
                        Meus Projetos
                      </Link>
                      <div className="border-t border-kate-border mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth/login"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isHomePage
                        ? "text-white hover:bg-white/10"
                        : "text-navy hover:bg-gray-50"
                    }`}
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/auth/cadastro"
                    className="px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Criar conta
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              {user && (
                <Link
                  to="/app"
                  className={`p-2.5 rounded-lg transition-all ${
                    isHomePage ? "text-white hover:bg-white/10" : "text-navy hover:bg-gray-50"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={() => setShowMobileMenu(true)}
                className={`p-2.5 rounded-lg transition-all ${
                  isHomePage ? "text-white hover:bg-white/10" : "text-navy hover:bg-gray-50"
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-kate-border bg-navy-deep">
                <div className="flex items-center">
                  <img
                    src="https://019c104a-6f56-7035-a238-879c29552414.mochausercontent.com/Kate-Equity-Crowdfunding.png"
                    alt="Kate"
                    className="h-8 w-auto"
                  />
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Section */}
              {isPending ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : user ? (
                <div className="p-4 border-b border-kate-border bg-kate-bg">
                  <div className="flex items-center gap-3">
                    {user.google_user_data?.picture ? (
                      <img
                        src={user.google_user_data.picture}
                        alt={user.google_user_data?.name || "User"}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gold"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center">
                        <span className="text-navy-deep font-bold text-lg">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-deep truncate">
                        {user.google_user_data?.name || "Usuário"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b border-kate-border">
                  <Link
                    to="/auth/login"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Entrar na sua conta
                  </Link>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <Link
                  to="/oportunidades"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  Oportunidades
                </Link>
                <Link
                  to="/como-funciona"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                >
                  <Shield className="w-5 h-5" />
                  Como funciona
                </Link>
                <Link
                  to="/submeter-projeto"
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Submeter projeto
                </Link>
                
                {user && (
                  <>
                    <div className="pt-4 pb-2">
                      <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Minha conta</p>
                    </div>
                    <Link
                      to="/app"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <Link
                      to="/app/investimentos"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                    >
                      <TrendingUp className="w-5 h-5" />
                      Meus Investimentos
                    </Link>
                    <Link
                      to="/app/projetos"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gold/10 hover:text-navy-deep rounded-xl transition-colors"
                    >
                      <Briefcase className="w-5 h-5" />
                      Meus Projetos
                    </Link>
                  </>
                )}
              </nav>

              {/* Footer */}
              {user ? (
                <div className="p-4 border-t border-kate-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sair da conta
                  </button>
                </div>
              ) : (
                <div className="p-4 border-t border-kate-border">
                  <Link
                    to="/auth/cadastro"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-navy-deep hover:bg-navy text-white font-semibold rounded-xl transition-colors"
                  >
                    Criar conta gratuita
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
