import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";
import { fetchWithRetry } from "@/react-app/hooks/useApi";
import KycForm from "@/react-app/components/KycForm";
import InvestorClassificationForm from "@/react-app/components/InvestorClassificationForm";
import {
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  Shield,
  MapPin,
  Bell,
  TrendingUp,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  ChevronRight,
  Briefcase,
  Calendar,
  Globe,
  Heart,
  Settings,
  BadgeCheck
} from "lucide-react";

interface UserProfile {
  id: number;
  user_id: string;
  role: "investidor" | "capitador";
  document_type: "cpf" | "cnpj";
  document_number: string;
  company_name: string | null;
  phone: string | null;
  name: string | null;
  email: string | null;
  is_onboarding_complete: boolean;
  welcome_seen: number;
  // Address
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  // Personal
  birth_date: string | null;
  nationality: string | null;
  marital_status: string | null;
  occupation: string | null;
  // Investor profile
  income_range: string | null;
  investment_experience: string | null;
  risk_profile: string | null;
  // Notifications
  notification_email: number;
  notification_push: number;
  notification_whatsapp: number;
}

type TabKey = "personal" | "address" | "kyc" | "security" | "preferences" | "investor";

export default function AppConfiguracoes() {
  const { user, logout, isPending } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Form data
  const [personalData, setPersonalData] = useState({
    phone: "",
    birth_date: "",
    nationality: "Brasileira",
    marital_status: "",
    occupation: "",
    company_name: ""
  });

  const [addressData, setAddressData] = useState({
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: ""
  });

  const [notificationData, setNotificationData] = useState({
    email: true,
    push: true,
    whatsapp: false
  });

  // Password
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
  const [lookingUpCep, setLookingUpCep] = useState(false);

  useEffect(() => {
    if (!isPending && user) {
      fetchProfile();
    }
  }, [isPending, user]);

  const fetchProfile = async () => {
    try {
      const res = await fetchWithRetry("/api/user-profile");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const p = data.profile as UserProfile;
          setProfile(p);
          setPersonalData({
            phone: p.phone || "",
            birth_date: p.birth_date || "",
            nationality: p.nationality || "Brasileira",
            marital_status: p.marital_status || "",
            occupation: p.occupation || "",
            company_name: p.company_name || ""
          });
          setAddressData({
            cep: p.address_cep || "",
            street: p.address_street || "",
            number: p.address_number || "",
            complement: p.address_complement || "",
            neighborhood: p.address_neighborhood || "",
            city: p.address_city || "",
            state: p.address_state || ""
          });
          setNotificationData({
            email: p.notification_email === 1,
            push: p.notification_push === 1,
            whatsapp: p.notification_whatsapp === 1
          });
        }
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
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

  const lookupCep = async () => {
    const cep = addressData.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      showError("CEP deve ter 8 dígitos");
      return;
    }

    setLookingUpCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) {
        showError("CEP não encontrado");
      } else {
        setAddressData({
          ...addressData,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || ""
        });
      }
    } catch (e) {
      showError("Erro ao buscar CEP");
    } finally {
      setLookingUpCep(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user-profile/extended", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: "personal",
          data: personalData
        })
      });

      if (res.ok) {
        showSuccess("Dados pessoais atualizados!");
        fetchProfile();
      } else {
        const data = await res.json();
        showError(data.error || "Erro ao salvar");
      }
    } catch (e) {
      showError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user-profile/extended", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: "address",
          data: addressData
        })
      });

      if (res.ok) {
        showSuccess("Endereço atualizado!");
        fetchProfile();
      } else {
        const data = await res.json();
        showError(data.error || "Erro ao salvar");
      }
    } catch (e) {
      showError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user-profile/extended", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          section: "notifications",
          data: notificationData
        })
      });

      if (res.ok) {
        showSuccess("Preferências de notificação atualizadas!");
        fetchProfile();
      } else {
        const data = await res.json();
        showError(data.error || "Erro ao salvar");
      }
    } catch (e) {
      showError("Erro de conexão");
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
      showError("Erro de conexão");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const formatDocument = (type: string, number: string) => {
    if (!number) return "Não informado";
    if (type === "cpf") {
      return number.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return number.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!profile) return 0;
    let filled = 0;
    let total = 10;
    
    if (profile.phone) filled++;
    if (profile.document_number) filled++;
    if (profile.birth_date) filled++;
    if (profile.address_cep) filled++;
    if (profile.address_city) filled++;
    if (profile.occupation) filled++;
    if (profile.income_range) filled++;
    if (profile.investment_experience) filled++;
    if (profile.risk_profile) filled++;
    if (profile.notification_email !== null) filled++;
    
    return Math.round((filled / total) * 100);
  };

  const completionPct = calculateCompletion();

  if (loading || isPending) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-3 bg-white rounded-2xl border border-kate-border p-6">
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const googleData = user?.google_user_data;
  const userEmail = user?.email || "";
  const userName = googleData?.name || userEmail.split("@")[0] || "Usuário";

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: "personal", label: "Dados Pessoais", icon: User },
    { key: "address", label: "Endereço", icon: MapPin },
    { key: "kyc", label: "Documentos / KYC", icon: BadgeCheck },
    { key: "security", label: "Segurança", icon: Shield },
    { key: "preferences", label: "Notificações", icon: Bell },
    ...(profile?.role === "investidor" ? [{ key: "investor" as TabKey, label: "Perfil Investidor", icon: TrendingUp }] : [])
  ];

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

      {/* Header */}
      <div className="bg-white rounded-2xl border border-kate-border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy to-navy-deep flex items-center justify-center">
            <Settings className="w-6 h-6 text-gold" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-navy-deep">Configurações</h1>
            <p className="text-gray-500">Gerencie suas informações e preferências</p>
          </div>

          {/* Completion indicator */}
          <div className="flex items-center gap-3 px-4 py-2 bg-kate-bg rounded-xl">
            <div className="flex-1 min-w-[100px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Cadastro</span>
                <span className="text-xs font-medium text-navy-deep">{completionPct}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    completionPct === 100 ? "bg-green-500" : completionPct >= 70 ? "bg-gold" : "bg-orange-400"
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            {completionPct === 100 ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-400" />
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl border border-kate-border p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.key
                      ? "bg-navy text-white"
                      : "text-gray-600 hover:bg-kate-bg"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto ${activeTab === tab.key ? "text-gold" : "text-gray-400"}`} />
                </button>
              );
            })}
          </nav>

          {/* Quick info */}
          <div className="mt-6 pt-6 border-t border-kate-border">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 truncate">{userEmail}</span>
              </div>
              {profile?.role && (
                <div className="flex items-center gap-2 text-sm">
                  {profile.role === "investidor" ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Investidor</span>
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-700">Emissor</span>
                    </>
                  )}
                </div>
              )}
              {profile?.document_number && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{formatDocument(profile.document_type, profile.document_number)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-kate-border p-6">
          {/* Personal Data Tab */}
          {activeTab === "personal" && (
            <div>
              <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </h2>

              <div className="space-y-5">
                {/* Read-only fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nome" icon={<User className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={userName}
                      disabled
                      className="w-full p-3 bg-gray-50 border border-kate-border rounded-xl text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Vinculado à sua conta</p>
                  </FormField>

                  <FormField label="Email" icon={<Mail className="w-4 h-4" />}>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full p-3 bg-gray-50 border border-kate-border rounded-xl text-gray-500"
                    />
                  </FormField>
                </div>

                {/* Document (read-only) */}
                <FormField label={profile?.document_type === "cpf" ? "CPF" : "CNPJ"} icon={<FileText className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={profile?.document_number ? formatDocument(profile.document_type, profile.document_number) : "Não informado"}
                    disabled
                    className="w-full p-3 bg-gray-50 border border-kate-border rounded-xl text-gray-500"
                  />
                </FormField>

                {/* Editable fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Telefone" icon={<Phone className="w-4 h-4" />}>
                    <input
                      type="tel"
                      value={personalData.phone}
                      onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                      placeholder="(11) 99999-9999"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>

                  <FormField label="Data de Nascimento" icon={<Calendar className="w-4 h-4" />}>
                    <input
                      type="date"
                      value={personalData.birth_date}
                      onChange={(e) => setPersonalData({ ...personalData, birth_date: e.target.value })}
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Nacionalidade" icon={<Globe className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={personalData.nationality}
                      onChange={(e) => setPersonalData({ ...personalData, nationality: e.target.value })}
                      placeholder="Brasileira"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>

                  <FormField label="Estado Civil" icon={<Heart className="w-4 h-4" />}>
                    <select
                      value={personalData.marital_status}
                      onChange={(e) => setPersonalData({ ...personalData, marital_status: e.target.value })}
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors bg-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="solteiro">Solteiro(a)</option>
                      <option value="casado">Casado(a)</option>
                      <option value="divorciado">Divorciado(a)</option>
                      <option value="viuvo">Viúvo(a)</option>
                      <option value="uniao_estavel">União Estável</option>
                    </select>
                  </FormField>
                </div>

                <FormField label="Profissão" icon={<Briefcase className="w-4 h-4" />}>
                  <input
                    type="text"
                    value={personalData.occupation}
                    onChange={(e) => setPersonalData({ ...personalData, occupation: e.target.value })}
                    placeholder="Ex: Engenheiro, Médico, Empresário..."
                    className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                  />
                </FormField>

                {profile?.document_type === "cnpj" && (
                  <FormField label="Razão Social" icon={<Building2 className="w-4 h-4" />}>
                    <input
                      type="text"
                      value={personalData.company_name}
                      onChange={(e) => setPersonalData({ ...personalData, company_name: e.target.value })}
                      placeholder="Nome da empresa"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleSavePersonal}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar Dados Pessoais
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Address Tab */}
          {activeTab === "address" && (
            <div>
              <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </h2>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="CEP" icon={<MapPin className="w-4 h-4" />}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={addressData.cep}
                        onChange={(e) => setAddressData({ ...addressData, cep: e.target.value.replace(/\D/g, "").slice(0, 8) })}
                        placeholder="00000-000"
                        className="flex-1 p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                      />
                      <button
                        onClick={lookupCep}
                        disabled={lookingUpCep || addressData.cep.length < 8}
                        className="px-4 py-2 bg-kate-bg text-navy-deep font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {lookingUpCep ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                      </button>
                    </div>
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField label="Rua">
                      <input
                        type="text"
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        placeholder="Nome da rua"
                        className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                      />
                    </FormField>
                  </div>
                  <FormField label="Número">
                    <input
                      type="text"
                      value={addressData.number}
                      onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                      placeholder="123"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Complemento">
                    <input
                      type="text"
                      value={addressData.complement}
                      onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                      placeholder="Apto, bloco, etc."
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                  <FormField label="Bairro">
                    <input
                      type="text"
                      value={addressData.neighborhood}
                      onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                      placeholder="Bairro"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Cidade">
                    <input
                      type="text"
                      value={addressData.city}
                      onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                      placeholder="Cidade"
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
                    />
                  </FormField>
                  <FormField label="Estado">
                    <select
                      value={addressData.state}
                      onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                      className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors bg-white"
                    >
                      <option value="">Selecione...</option>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSaveAddress}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar Endereço
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KYC Tab */}
          {activeTab === "kyc" && (
            <div>
              <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5" />
                Documentos e Verificação (KYC)
              </h2>
              <KycForm />
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </h2>

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
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Alterar Senha
                  </button>
                </form>
              </div>

              <div className="border-t border-kate-border pt-6">
                <h3 className="font-semibold text-navy-deep mb-4">Sessão</h3>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full max-w-md p-4 border border-kate-border rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-gray-700 group-hover:text-red-600 block">Sair da conta</span>
                    <span className="text-sm text-gray-500">Encerrar sessão em todos os dispositivos</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 ml-auto" />
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "preferences" && (
            <div>
              <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Preferências de Notificação
              </h2>

              <div className="space-y-4 max-w-lg">
                <ToggleField
                  label="Notificações por Email"
                  description="Receba atualizações sobre seus investimentos e ofertas"
                  checked={notificationData.email}
                  onChange={(v) => setNotificationData({ ...notificationData, email: v })}
                  icon={<Mail className="w-5 h-5" />}
                />

                <ToggleField
                  label="Notificações Push"
                  description="Alertas em tempo real no navegador"
                  checked={notificationData.push}
                  onChange={(v) => setNotificationData({ ...notificationData, push: v })}
                  icon={<Bell className="w-5 h-5" />}
                />

                <ToggleField
                  label="Notificações WhatsApp"
                  description="Receba mensagens importantes via WhatsApp"
                  checked={notificationData.whatsapp}
                  onChange={(v) => setNotificationData({ ...notificationData, whatsapp: v })}
                  icon={<Phone className="w-5 h-5" />}
                />

                <div className="pt-4">
                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Salvar Preferências
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Investor Profile Tab */}
          {activeTab === "investor" && profile?.role === "investidor" && (
            <div>
              <h2 className="text-lg font-semibold text-navy-deep mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Classificação de Investidor (CVM 88)
              </h2>
              <InvestorClassificationForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function FormField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
        {icon && <span className="text-gray-400">{icon}</span>}
        {label}
      </label>
      {children}
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
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center border border-kate-border rounded-xl focus-within:border-gold focus-within:ring-1 focus-within:ring-gold transition-colors">
        <Lock className="w-4 h-4 text-gray-400 ml-3" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 bg-transparent outline-none text-navy-deep"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="p-3 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
  icon
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-kate-border rounded-xl hover:border-gold/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-kate-bg rounded-lg flex items-center justify-center text-gray-500">
          {icon}
        </div>
        <div>
          <p className="font-medium text-navy-deep">{label}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          checked ? "bg-gold" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
