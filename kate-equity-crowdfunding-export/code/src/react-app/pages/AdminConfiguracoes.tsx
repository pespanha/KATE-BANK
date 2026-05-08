import { useState, useEffect } from "react";
import AdminLayout from "@/react-app/components/AdminLayout";
import {
  Settings,
  Save,
  Loader2,
  DollarSign,
  Clock,
  Shield,
  Bell,
  CheckCircle,
  AlertCircle,
  Users,
  Building2,
  CreditCard,
  Copy,
  Phone
} from "lucide-react";

interface AppConfig {
  min_investment: number;
  max_investment: number;
  platform_fee_percent: number;
  pix_expiration_hours: number;
  admin_emails: string;
  require_document_verification: boolean;
  allow_secondary_market: boolean;
  email_notifications_enabled: boolean;
  maintenance_mode: boolean;
  // Bank settings
  pix_key: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  bank_account_holder: string;
  bank_cnpj: string;
  payment_whatsapp: string;
}

export default function AdminConfiguracoes() {
  const [config, setConfig] = useState<AppConfig>({
    min_investment: 1000,
    max_investment: 1000000,
    platform_fee_percent: 5,
    pix_expiration_hours: 24,
    admin_emails: "teste@mannah.io",
    require_document_verification: true,
    allow_secondary_market: false,
    email_notifications_enabled: true,
    maintenance_mode: false,
    // Bank settings
    pix_key: "",
    bank_name: "",
    bank_agency: "",
    bank_account: "",
    bank_account_holder: "",
    bank_cnpj: "",
    payment_whatsapp: ""
  });
  const [copiedPix, setCopiedPix] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_investors: 0,
    total_issuers: 0,
    total_projects: 0,
    total_offers: 0
  });

  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } catch (e) {
      console.error("Error fetching config:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/config/stats", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao salvar configurações");
      }
    } catch (e) {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configurações" subtitle="Configurações da plataforma">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Configurações" subtitle="Configurações da plataforma">
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 border border-kate-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Usuários
            </div>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_users}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-kate-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Users className="w-4 h-4" />
              Investidores
            </div>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_investors}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-kate-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Building2 className="w-4 h-4" />
              Emissores
            </div>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_issuers}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-kate-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <Settings className="w-4 h-4" />
              Projetos
            </div>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_projects}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-kate-border">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
              <DollarSign className="w-4 h-4" />
              Ofertas
            </div>
            <p className="text-2xl font-bold text-navy-deep">{stats.total_offers}</p>
          </div>
        </div>

        {/* Configuration Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investimentos */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-deep">Investimentos</h3>
                <p className="text-sm text-gray-500">Limites e taxas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investimento mínimo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={config.min_investment}
                    onChange={(e) => setConfig({ ...config, min_investment: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investimento máximo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    value={config.max_investment}
                    onChange={(e) => setConfig({ ...config, max_investment: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa da plataforma
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={config.platform_fee_percent}
                    onChange={(e) => setConfig({ ...config, platform_fee_percent: Number(e.target.value) })}
                    className="w-full pl-4 pr-12 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pagamentos */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-deep">Pagamentos</h3>
                <p className="text-sm text-gray-500">Configurações de PIX</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiração do PIX (horas)
                </label>
                <input
                  type="number"
                  value={config.pix_expiration_hours}
                  onChange={(e) => setConfig({ ...config, pix_expiration_hours: Number(e.target.value) })}
                  className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Tempo até o código PIX expirar</p>
              </div>
            </div>
          </div>

          {/* Administração */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-deep">Administração</h3>
                <p className="text-sm text-gray-500">Acesso e segurança</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emails de administradores
                </label>
                <textarea
                  value={config.admin_emails}
                  onChange={(e) => setConfig({ ...config, admin_emails: e.target.value })}
                  rows={3}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                  className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Separe múltiplos emails por vírgula</p>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-kate-border">
                <div>
                  <p className="font-medium text-navy-deep">Verificação de documentos</p>
                  <p className="text-sm text-gray-500">Exigir documentos antes de investir</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, require_document_verification: !config.require_document_verification })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.require_document_verification ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.require_document_verification ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Funcionalidades */}
          <div className="bg-white rounded-2xl border border-kate-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy-deep">Funcionalidades</h3>
                <p className="text-sm text-gray-500">Recursos da plataforma</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-kate-border">
                <div>
                  <p className="font-medium text-navy-deep">Mercado secundário</p>
                  <p className="text-sm text-gray-500">Permitir venda de tokens entre usuários</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, allow_secondary_market: !config.allow_secondary_market })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.allow_secondary_market ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.allow_secondary_market ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-kate-border">
                <div>
                  <p className="font-medium text-navy-deep">Notificações por email</p>
                  <p className="text-sm text-gray-500">Enviar emails sobre eventos importantes</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, email_notifications_enabled: !config.email_notifications_enabled })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.email_notifications_enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.email_notifications_enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-red-600">Modo manutenção</p>
                  <p className="text-sm text-gray-500">Bloquear acesso à plataforma</p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, maintenance_mode: !config.maintenance_mode })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${config.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config.maintenance_mode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Settings Section */}
        <div className="bg-white rounded-2xl border border-kate-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-navy-deep">Dados Bancários Kate</h3>
              <p className="text-sm text-gray-500">Informações para recebimento de investimentos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIX Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.pix_key}
                  onChange={(e) => setConfig({ ...config, pix_key: e.target.value })}
                  placeholder="CNPJ, email, telefone ou chave aleatória"
                  className="w-full px-4 py-3 pr-12 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
                />
                {config.pix_key && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(config.pix_key);
                      setCopiedPix(true);
                      setTimeout(() => setCopiedPix(false), 2000);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Copiar PIX"
                  >
                    {copiedPix ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banco
              </label>
              <input
                type="text"
                value={config.bank_name}
                onChange={(e) => setConfig({ ...config, bank_name: e.target.value })}
                placeholder="Ex: Banco do Brasil"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
            </div>

            {/* Agency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agência
              </label>
              <input
                type="text"
                value={config.bank_agency}
                onChange={(e) => setConfig({ ...config, bank_agency: e.target.value })}
                placeholder="0000"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
            </div>

            {/* Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta
              </label>
              <input
                type="text"
                value={config.bank_account}
                onChange={(e) => setConfig({ ...config, bank_account: e.target.value })}
                placeholder="00000-0"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
            </div>

            {/* Account Holder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorecido
              </label>
              <input
                type="text"
                value={config.bank_account_holder}
                onChange={(e) => setConfig({ ...config, bank_account_holder: e.target.value })}
                placeholder="Nome da empresa ou pessoa"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CNPJ
              </label>
              <input
                type="text"
                value={config.bank_cnpj}
                onChange={(e) => setConfig({ ...config, bank_cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
            </div>

            {/* WhatsApp */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                WhatsApp para Comprovantes
              </label>
              <input
                type="text"
                value={config.payment_whatsapp}
                onChange={(e) => setConfig({ ...config, payment_whatsapp: e.target.value })}
                placeholder="(00) 00000-0000"
                className="w-full px-4 py-3 border border-kate-border rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Número para investidores enviarem comprovantes de pagamento</p>
            </div>
          </div>

          {/* Preview */}
          {config.pix_key && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-kate-border">
              <p className="text-sm font-medium text-gray-700 mb-2">Pré-visualização para investidores:</p>
              <div className="text-sm text-gray-600 space-y-1">
                {config.pix_key && <p><strong>PIX:</strong> {config.pix_key}</p>}
                {config.bank_name && <p><strong>Banco:</strong> {config.bank_name}</p>}
                {config.bank_agency && config.bank_account && (
                  <p><strong>Ag:</strong> {config.bank_agency} | <strong>Conta:</strong> {config.bank_account}</p>
                )}
                {config.bank_account_holder && <p><strong>Favorecido:</strong> {config.bank_account_holder}</p>}
                {config.bank_cnpj && <p><strong>CNPJ:</strong> {config.bank_cnpj}</p>}
                {config.payment_whatsapp && <p><strong>WhatsApp:</strong> {config.payment_whatsapp}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-kate-border p-4">
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Configurações salvas!</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gold text-navy-deep font-semibold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Salvar Configurações
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
