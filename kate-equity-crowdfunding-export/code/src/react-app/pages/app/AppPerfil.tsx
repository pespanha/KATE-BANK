import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";
import { fetchWithRetry } from "@/react-app/hooks/useApi";
import {
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Shield,
  LogOut,
  Edit,
  Check,
  X,
  Loader2,
  TrendingUp,
  Briefcase,
  Wallet,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router";

interface UserProfile {
  id: number;
  user_id: string;
  role: "investidor" | "capitador";
  document_type: "cpf" | "cnpj";
  document_number: string;
  company_name: string | null;
  phone: string | null;
  is_onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalInvested: number;
  totalInvestments: number;
  tokensHeld: number;
  totalProjects: number;
}

interface HathorAddress {
  hathor_address: string;
  status: "active" | "pending" | "failed";
}

export default function AppPerfil() {
  const { user, logout, isPending } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalInvested: 0,
    totalInvestments: 0,
    tokensHeld: 0,
    totalProjects: 0
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "wallet">("profile");
  const [formData, setFormData] = useState({
    phone: "",
    company_name: ""
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [hathorAddress, setHathorAddress] = useState<HathorAddress | null>(null);
  const [hathorLoading, setHathorLoading] = useState(false);
  const [hathorCopied, setHathorCopied] = useState(false);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isPending && user) {
      fetchProfile();
      fetchStats();
      fetchHathorAddress();
    }
  }, [isPending, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithRetry("/api/user-profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            phone: data.profile.phone || "",
            company_name: data.profile.company_name || ""
          });
        }
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHathorAddress = async () => {
    try {
      const res = await fetchWithRetry("/api/hathor/address/my");
      if (res.ok) {
        const data = await res.json();
        if (data.address) {
          setHathorAddress({
            hathor_address: data.address,
            status: data.status || "active"
          });
        }
      }
    } catch (e) {
      console.error("Error fetching Hathor address:", e);
    }
  };

  const generateHathorAddress = async () => {
    setHathorLoading(true);
    try {
      const res = await fetch("/api/hathor/address/assign", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();
      if (data.address) {
        setHathorAddress({
          hathor_address: data.address,
          status: "active"
        });
        showSuccess("Endereço Hathor gerado com sucesso!");
      }
    } catch (e) {
      console.error("Error generating Hathor address:", e);
      showError("Erro ao gerar endereço. Tente novamente.");
    } finally {
      setHathorLoading(false);
    }
  };

  const copyHathorAddress = async () => {
    if (hathorAddress?.hathor_address) {
      await navigator.clipboard.writeText(hathorAddress.hathor_address);
      setHathorCopied(true);
      setTimeout(() => setHathorCopied(false), 2000);
    }
  };

  const fetchStats = async () => {
    try {
      const [investmentsRes, walletRes, projectsRes] = await Promise.all([
        fetchWithRetry("/api/user/investments"),
        fetchWithRetry("/api/user/wallet"),
        fetchWithRetry("/api/user/projects")
      ]);

      let totalInvested = 0;
      let totalInvestments = 0;
      let tokensHeld = 0;
      let totalProjects = 0;

      if (investmentsRes.ok) {
        const data = await investmentsRes.json();
        const investments = data.investments || [];
        totalInvested = investments.reduce((sum: number, inv: any) => sum + inv.amount, 0);
        totalInvestments = investments.length;
      }

      if (walletRes.ok) {
        const data = await walletRes.json();
        tokensHeld = data.summary?.total_tokens || 0;
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        totalProjects = data.projects?.length || 0;
      }

      setStats({ totalInvested, totalInvestments, tokensHeld, totalProjects });
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage("");
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: profile.role,
          document_type: profile.document_type,
          document_number: profile.document_number,
          phone: formData.phone,
          company_name: formData.company_name
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setEditing(false);
        showSuccess("Perfil atualizado com sucesso!");
      } else {
        showError("Erro ao salvar. Tente novamente.");
      }
    } catch (e) {
      console.error("Error saving profile:", e);
      showError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError("As senhas não coincidem");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      showError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        showSuccess("Senha alterada com sucesso!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        showError(data.error || "Erro ao alterar senha");
      }
    } catch (e) {
      console.error("Error changing password:", e);
      showError("Erro de conexão. Tente novamente.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDocument = (type: string, number: string) => {
    if (!number) return null;
    if (type === "cpf") {
      return number.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return number.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // Loading skeleton
  if (loading || isPending) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gray-200 animate-pulse" />
            <div className="flex-1">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-kate-border p-4">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const googleData = user?.google_user_data;
  const userEmail = user?.email || "";
  const userName = googleData?.name || userEmail.split("@")[0] || "Usuário";
  const userInitial = userName[0]?.toUpperCase() || "U";

  return (
    <div className="space-y-6">
      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Profile Header - Compact */}
      <div className="bg-white rounded-2xl border border-kate-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          {googleData?.picture ? (
            <img
              src={googleData.picture}
              alt={userName}
              className="w-20 h-20 rounded-xl object-cover border-2 border-kate-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gold to-gold-hover flex items-center justify-center">
              <span className="text-2xl font-bold text-navy-deep">{userInitial}</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-navy-deep truncate">{userName}</h1>
            <p className="text-gray-500 truncate">{userEmail}</p>
            
            <div className="flex items-center gap-2 mt-2">
              {profile?.role === "investidor" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                  <TrendingUp className="w-3 h-3" />
                  Investidor
                </span>
              )}
              {profile?.role === "capitador" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  <Briefcase className="w-3 h-3" />
                  Emissor
                </span>
              )}
              {!profile?.role && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  <User className="w-3 h-3" />
                  Usuário
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 sm:self-start">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-kate-border hover:border-navy/30 text-navy-deep text-sm font-medium rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      phone: profile?.phone || "",
                      company_name: profile?.company_name || ""
                    });
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-kate-border text-gray-600 text-sm font-medium rounded-xl transition-colors hover:border-red-300"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold-hover text-navy-deep text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Investido"
          value={formatCurrency(stats.totalInvested)}
          icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <StatCard
          label="Investimentos"
          value={stats.totalInvestments.toString()}
          icon={<Briefcase className="w-4 h-4 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          label="Tokens"
          value={stats.tokensHeld.toLocaleString("pt-BR")}
          icon={<Wallet className="w-4 h-4 text-gold-hover" />}
          bgColor="bg-gold/10"
        />
        <StatCard
          label="Projetos"
          value={stats.totalProjects.toString()}
          icon={<FileText className="w-4 h-4 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { key: "profile", label: "Dados", icon: User },
          { key: "security", label: "Segurança", icon: Shield },
          { key: "wallet", label: "Carteira", icon: Wallet }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-navy text-white"
                  : "bg-white border border-kate-border text-gray-600 hover:border-navy/30"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-5">Informações Pessoais</h3>
          
          <div className="space-y-4">
            {/* Email */}
            <InfoField
              label="Email"
              icon={<Mail className="w-4 h-4" />}
              value={userEmail}
              badge="Verificado"
            />

            {/* Document */}
            {profile?.document_number && (
              <InfoField
                label={profile.document_type === "cpf" ? "CPF" : "CNPJ"}
                icon={<FileText className="w-4 h-4" />}
                value={formatDocument(profile.document_type, profile.document_number) || "Não informado"}
              />
            )}

            {/* Phone */}
            {editing ? (
              <EditableField
                label="Telefone"
                icon={<Phone className="w-4 h-4" />}
                value={formData.phone}
                onChange={(v) => setFormData({ ...formData, phone: v })}
                placeholder="(11) 99999-9999"
              />
            ) : (
              <InfoField
                label="Telefone"
                icon={<Phone className="w-4 h-4" />}
                value={profile?.phone || null}
              />
            )}

            {/* Company Name (CNPJ only) */}
            {profile?.document_type === "cnpj" && (
              editing ? (
                <EditableField
                  label="Razão Social"
                  icon={<Building2 className="w-4 h-4" />}
                  value={formData.company_name}
                  onChange={(v) => setFormData({ ...formData, company_name: v })}
                  placeholder="Nome da empresa"
                />
              ) : (
                <InfoField
                  label="Razão Social"
                  icon={<Building2 className="w-4 h-4" />}
                  value={profile?.company_name || null}
                />
              )
            )}
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-4">
          {/* Password Change */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <h3 className="font-semibold text-navy-deep mb-5 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Alterar Senha
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <PasswordField
                label="Senha atual"
                value={passwordData.currentPassword}
                onChange={(v) => setPasswordData({ ...passwordData, currentPassword: v })}
                show={showPasswords.current}
                onToggleShow={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              />
              
              <PasswordField
                label="Nova senha"
                value={passwordData.newPassword}
                onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })}
                show={showPasswords.new}
                onToggleShow={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              />
              
              <PasswordField
                label="Confirmar nova senha"
                value={passwordData.confirmPassword}
                onChange={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
                show={showPasswords.confirm}
                onToggleShow={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              />
              
              <button
                type="submit"
                disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Salvar nova senha
              </button>
            </form>
          </div>

          {/* Logout */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <h3 className="font-semibold text-navy-deep mb-4">Sessão</h3>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-4 border border-kate-border rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors group"
            >
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              <span className="font-medium text-gray-700 group-hover:text-red-600">Sair da conta</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 ml-auto" />
            </button>
          </div>
        </div>
      )}

      {activeTab === "wallet" && (
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <h3 className="font-semibold text-navy-deep mb-2 flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Minha Carteira Hathor
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Este endereço é único para você e usado para receber tokens de investimentos na rede Hathor.
          </p>
          
          {hathorAddress?.status === "active" && hathorAddress.hathor_address ? (
            <div className="space-y-4">
              {/* Address display */}
              <div className="p-4 bg-kate-bg rounded-xl">
                <label className="block text-xs font-medium text-gray-500 mb-2">Endereço Hathor</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-navy-deep font-mono break-all bg-white px-3 py-2 rounded-lg border border-kate-border">
                    {hathorAddress.hathor_address}
                  </code>
                  <button
                    onClick={copyHathorAddress}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white border border-kate-border rounded-lg hover:border-gold transition-colors"
                  >
                    {hathorCopied ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 font-medium">Status: Ativo</span>
              </div>
              
              {/* Link to carteira */}
              <Link
                to="/app/carteira"
                className="inline-flex items-center gap-2 text-sm text-navy-deep hover:text-gold transition-colors"
              >
                Ver detalhes da carteira
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ) : hathorAddress?.status === "pending" ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                  <span className="text-yellow-700">Gerando seu endereço…</span>
                </div>
                <button
                  onClick={generateHathorAddress}
                  disabled={hathorLoading}
                  className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : hathorAddress?.status === "failed" ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700">Erro ao gerar endereço</span>
                </div>
                <button
                  onClick={generateHathorAddress}
                  disabled={hathorLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {hathorLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gerar Endereço
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-kate-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-4">Você ainda não tem um endereço Hathor</p>
              <button
                onClick={generateHathorAddress}
                disabled={hathorLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {hathorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                Gerar Endereço Hathor
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ 
  label, 
  value, 
  icon, 
  bgColor 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  bgColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-kate-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-lg font-bold text-navy-deep">{value}</p>
    </div>
  );
}

function InfoField({
  label,
  icon,
  value,
  badge
}: {
  label: string;
  icon: React.ReactNode;
  value: string | null;
  badge?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-3 p-3 bg-kate-bg rounded-xl">
        <span className="text-gray-400">{icon}</span>
        <span className={value ? "text-navy-deep" : "text-gray-400"}>
          {value || "Não informado"}
        </span>
        {badge && (
          <span className="ml-auto text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function EditableField({
  label,
  icon,
  value,
  onChange,
  placeholder
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-3 border border-kate-border rounded-xl p-1 focus-within:border-gold transition-colors">
        <span className="text-gray-400 ml-2">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 p-2 bg-transparent outline-none text-navy-deep placeholder-gray-400"
        />
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 border border-kate-border rounded-xl p-1 focus-within:border-gold transition-colors">
        <Lock className="w-4 h-4 text-gray-400 ml-2" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-2 bg-transparent outline-none text-navy-deep"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
