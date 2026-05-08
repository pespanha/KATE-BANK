import { useState, useEffect } from "react";
import { Upload, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, Camera, FileText, CreditCard, Building2, Trash2 } from "lucide-react";

interface KycData {
  kyc_status: string | null;
  kyc_rejection_reason: string | null;
  document_type: string | null;
  document_number: string | null;
  document_front_url: string | null;
  document_back_url: string | null;
  selfie_url: string | null;
  proof_of_address_url: string | null;
  bank_code: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  bank_pix_key: string | null;
  bank_pix_key_type: string | null;
}

const STATUS_CONFIG = {
  pending: { label: "Pendente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  submitted: { label: "Em análise", icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  approved: { label: "Verificado", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
  rejected: { label: "Rejeitado", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const DOCUMENT_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "rg", label: "RG" },
  { value: "cnh", label: "CNH" },
  { value: "passport", label: "Passaporte" },
];

const BANK_ACCOUNT_TYPES = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
];

const PIX_KEY_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatória" },
];

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "260", name: "Nubank" },
  { code: "077", name: "Inter" },
  { code: "212", name: "Banco Original" },
  { code: "336", name: "C6 Bank" },
  { code: "290", name: "PagBank" },
  { code: "380", name: "PicPay" },
  { code: "323", name: "Mercado Pago" },
];

export default function KycForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [kycData, setKycData] = useState<KycData>({
    kyc_status: null,
    kyc_rejection_reason: null,
    document_type: null,
    document_number: null,
    document_front_url: null,
    document_back_url: null,
    selfie_url: null,
    proof_of_address_url: null,
    bank_code: null,
    bank_name: null,
    bank_agency: null,
    bank_account: null,
    bank_account_type: null,
    bank_pix_key: null,
    bank_pix_key_type: null,
  });

  useEffect(() => {
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      const res = await fetch("/api/user-profile/kyc", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setKycData(data);
      }
    } catch (error) {
      console.error("Error fetching KYC data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (field: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Arquivo muito grande. Máximo 5MB." });
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Formato inválido. Use JPG, PNG, WebP ou PDF." });
      return;
    }

    setUploadingField(field);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      const res = await fetch("/api/user-profile/kyc/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao enviar arquivo");
      }

      const data = await res.json();
      setKycData(prev => ({ ...prev, [field]: data.url }));
      setMessage({ type: "success", text: "Arquivo enviado com sucesso!" });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao enviar arquivo" });
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user-profile/kyc", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kycData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao salvar");
      }

      setMessage({ type: "success", text: "Dados salvos com sucesso!" });
      fetchKycData();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!kycData.document_type || !kycData.document_number || !kycData.document_front_url || !kycData.selfie_url) {
      setMessage({ type: "error", text: "Preencha todos os campos obrigatórios antes de enviar para análise." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user-profile/kyc/submit", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao enviar");
      }

      setMessage({ type: "success", text: "Documentos enviados para análise!" });
      fetchKycData();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Erro ao enviar" });
    } finally {
      setSaving(false);
    }
  };

  const removeFile = async (field: string) => {
    setKycData(prev => ({ ...prev, [field]: null }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const status = kycData.kyc_status || "pending";
  const statusConfig = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const isEditable = status === "pending" || status === "rejected";

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`p-4 rounded-xl ${statusConfig.bg} ${statusConfig.border} border`}>
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <div>
            <p className={`font-medium ${statusConfig.color}`}>
              Status: {statusConfig.label}
            </p>
            {status === "rejected" && kycData.kyc_rejection_reason && (
              <p className="text-sm text-red-600 mt-1">
                Motivo: {kycData.kyc_rejection_reason}
              </p>
            )}
            {status === "submitted" && (
              <p className="text-sm text-blue-600 mt-1">
                Seus documentos estão sendo analisados. Você será notificado quando a análise for concluída.
              </p>
            )}
            {status === "approved" && (
              <p className="text-sm text-green-600 mt-1">
                Sua identidade foi verificada com sucesso!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      {/* Document Section */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
        <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-gold" />
          Documento de Identificação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Documento *</label>
            <select
              value={kycData.document_type || ""}
              onChange={(e) => setKycData({ ...kycData, document_type: e.target.value })}
              disabled={!isEditable}
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Selecione...</option>
              {DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número do Documento *</label>
            <input
              type="text"
              value={kycData.document_number || ""}
              onChange={(e) => setKycData({ ...kycData, document_number: e.target.value })}
              disabled={!isEditable}
              placeholder="000.000.000-00"
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileUploadBox
            label="Frente do Documento *"
            field="document_front_url"
            url={kycData.document_front_url}
            uploading={uploadingField === "document_front_url"}
            disabled={!isEditable}
            onUpload={handleFileUpload}
            onRemove={removeFile}
          />
          <FileUploadBox
            label="Verso do Documento"
            field="document_back_url"
            url={kycData.document_back_url}
            uploading={uploadingField === "document_back_url"}
            disabled={!isEditable}
            onUpload={handleFileUpload}
            onRemove={removeFile}
          />
        </div>
      </div>

      {/* Selfie Section */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
        <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-gold" />
          Selfie com Documento
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Tire uma foto sua segurando o documento ao lado do rosto. A foto deve mostrar claramente seu rosto e o documento.
        </p>
        <FileUploadBox
          label="Selfie com documento *"
          field="selfie_url"
          url={kycData.selfie_url}
          uploading={uploadingField === "selfie_url"}
          disabled={!isEditable}
          onUpload={handleFileUpload}
          onRemove={removeFile}
        />
      </div>

      {/* Proof of Address */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
        <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold" />
          Comprovante de Endereço
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Envie um comprovante de endereço recente (últimos 3 meses): conta de luz, água, telefone, gás ou extrato bancário.
        </p>
        <FileUploadBox
          label="Comprovante de endereço"
          field="proof_of_address_url"
          url={kycData.proof_of_address_url}
          uploading={uploadingField === "proof_of_address_url"}
          disabled={!isEditable}
          onUpload={handleFileUpload}
          onRemove={removeFile}
        />
      </div>

      {/* Bank Data */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
        <h3 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          Dados Bancários
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Informe sua conta bancária para receber dividendos e outros rendimentos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banco</label>
            <select
              value={kycData.bank_code || ""}
              onChange={(e) => {
                const bank = BANKS.find(b => b.code === e.target.value);
                setKycData({ ...kycData, bank_code: e.target.value, bank_name: bank?.name || null });
              }}
              disabled={!isEditable}
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Selecione...</option>
              {BANKS.map(bank => (
                <option key={bank.code} value={bank.code}>{bank.code} - {bank.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Conta</label>
            <select
              value={kycData.bank_account_type || ""}
              onChange={(e) => setKycData({ ...kycData, bank_account_type: e.target.value })}
              disabled={!isEditable}
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Selecione...</option>
              {BANK_ACCOUNT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agência</label>
            <input
              type="text"
              value={kycData.bank_agency || ""}
              onChange={(e) => setKycData({ ...kycData, bank_agency: e.target.value.replace(/\D/g, "") })}
              disabled={!isEditable}
              placeholder="0000"
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
            <input
              type="text"
              value={kycData.bank_account || ""}
              onChange={(e) => setKycData({ ...kycData, bank_account: e.target.value.replace(/[^0-9-]/g, "") })}
              disabled={!isEditable}
              placeholder="00000-0"
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Chave PIX</label>
            <select
              value={kycData.bank_pix_key_type || ""}
              onChange={(e) => setKycData({ ...kycData, bank_pix_key_type: e.target.value })}
              disabled={!isEditable}
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            >
              <option value="">Selecione...</option>
              {PIX_KEY_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chave PIX</label>
            <input
              type="text"
              value={kycData.bank_pix_key || ""}
              onChange={(e) => setKycData({ ...kycData, bank_pix_key: e.target.value })}
              disabled={!isEditable}
              placeholder="Sua chave PIX"
              className="w-full p-3 border border-kate-border rounded-xl focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEditable && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 px-6 bg-kate-bg text-navy-deep font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Salvar Rascunho
          </button>
          <button
            onClick={handleSubmitForReview}
            disabled={saving || !kycData.document_type || !kycData.document_number || !kycData.document_front_url || !kycData.selfie_url}
            className="flex-1 py-3 px-6 bg-gold text-navy-deep font-semibold rounded-xl hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Enviar para Análise
          </button>
        </div>
      )}

      {/* Info Alert */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Por que precisamos desses documentos?</p>
            <p>
              A verificação de identidade (KYC) é exigida pela legislação brasileira para investimentos. 
              Seus dados são criptografados e armazenados com segurança, seguindo a LGPD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface FileUploadBoxProps {
  label: string;
  field: string;
  url: string | null;
  uploading: boolean;
  disabled: boolean;
  onUpload: (field: string, file: File) => void;
  onRemove: (field: string) => void;
}

function FileUploadBox({ label, field, url, uploading, disabled, onUpload, onRemove }: FileUploadBoxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(field, file);
    }
  };

  if (url) {
    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative border-2 border-green-200 bg-green-50 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700">Arquivo enviado</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 hover:underline truncate block"
              >
                Ver arquivo
              </a>
            </div>
            {!disabled && (
              <button
                onClick={() => onRemove(field)}
                className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${disabled ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-kate-border hover:border-gold hover:bg-gold/5"}`}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
            <span className="text-sm text-gray-600">Enviando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-600">
              Clique para enviar
            </span>
            <span className="text-xs text-gray-400">
              JPG, PNG, WebP ou PDF (máx. 5MB)
            </span>
          </div>
        )}
      </label>
    </div>
  );
}