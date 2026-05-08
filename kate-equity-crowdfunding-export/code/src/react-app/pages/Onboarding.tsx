import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";
import { 
  User, 
  Building2, 
  TrendingUp, 
  Briefcase,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";

type Role = "investidor" | "capitador" | null;
type DocumentType = "cpf" | "cnpj" | null;

interface FormData {
  role: Role;
  document_type: DocumentType;
  document_number: string;
  company_name: string;
  phone: string;
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function Onboarding() {
  const { user, isPending } = useAuth();
  const [step, setStep] = useState(1);
  const [hasExistingRole, setHasExistingRole] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    role: null,
    document_type: null,
    document_number: "",
    company_name: "",
    phone: ""
  });

  // Check if user already has a profile
  useEffect(() => {
    if (user) {
      checkExistingProfile();
    }
  }, [user]);

  const checkExistingProfile = async () => {
    try {
      const res = await fetch("/api/user-profile", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.profile?.is_onboarding_complete) {
          // Already completed onboarding, redirect to dashboard
          window.location.href = "/app";
          return;
        }
        // If role already exists (from signup), skip step 1
        if (data.profile?.role) {
          setFormData(prev => ({ ...prev, role: data.profile.role }));
          setHasExistingRole(true);
          setStep(2);
        }
      }
    } catch (e) {
      console.error("Error checking profile:", e);
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setFormData(prev => ({ ...prev, role }));
    setStep(2);
  };

  const handleDocumentTypeSelect = (type: DocumentType) => {
    setFormData(prev => ({ 
      ...prev, 
      document_type: type,
      document_number: "" // Reset number when type changes
    }));
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formData.document_type === "cpf" 
      ? formatCPF(value) 
      : formatCNPJ(value);
    setFormData(prev => ({ ...prev, document_number: formatted }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, phone: formatPhone(value) }));
  };

  const validateDocument = (): boolean => {
    const digits = formData.document_number.replace(/\D/g, "");
    if (formData.document_type === "cpf" && digits.length !== 11) {
      setError("CPF deve ter 11 dígitos");
      return false;
    }
    if (formData.document_type === "cnpj" && digits.length !== 14) {
      setError("CNPJ deve ter 14 dígitos");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.document_type || !formData.document_number) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    if (!validateDocument()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: formData.role,
          document_type: formData.document_type,
          document_number: formData.document_number.replace(/\D/g, ""),
          company_name: formData.company_name || null,
          phone: formData.phone.replace(/\D/g, "") || null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar perfil");
      }

      // Redirect to dashboard
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending || isCheckingProfile) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-deep mb-2">Faça login para continuar</h2>
          <p className="text-gray-600 mb-6">Você precisa estar logado para completar o cadastro.</p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-semibold rounded-xl transition-colors"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy to-navy-light flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Progress indicator - only show 2 steps if role wasn't set at signup */}
        {!hasExistingRole ? (
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              step >= 1 ? "bg-gold text-navy-deep" : "bg-white/10 text-white/50"
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <div className={`w-12 h-1 rounded-full transition-colors ${
              step >= 2 ? "bg-gold" : "bg-white/10"
            }`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              step >= 2 ? "bg-gold text-navy-deep" : "bg-white/10 text-white/50"
            }`}>
              2
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center mb-8">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gold text-navy-deep">
              1
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-navy-deep px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center">
                <span className="text-navy-deep font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold text-white">Kate</span>
            </div>
            <p className="text-white/70 text-sm">
              {step === 1 
                ? "Olá! Como você quer usar a Kate?" 
                : hasExistingRole 
                  ? "Complete seu cadastro para continuar"
                  : "Agora precisamos de alguns dados"}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {step === 1 ? (
              /* Step 1: Choose role */
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-navy-deep mb-6">
                  Escolha seu perfil
                </h2>

                <button
                  onClick={() => handleRoleSelect("investidor")}
                  className="w-full p-6 rounded-2xl border-2 border-kate-border hover:border-gold bg-white hover:bg-gold/5 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <TrendingUp className="w-7 h-7 text-gold-hover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-navy-deep mb-1">Sou Investidor</h3>
                      <p className="text-gray-600 text-sm">
                        Quero investir em projetos e diversificar meu portfólio
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gold mt-4" />
                  </div>
                </button>

                <button
                  onClick={() => handleRoleSelect("capitador")}
                  className="w-full p-6 rounded-2xl border-2 border-kate-border hover:border-gold bg-white hover:bg-gold/5 transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-navy/10 flex items-center justify-center group-hover:bg-navy/20 transition-colors">
                      <Briefcase className="w-7 h-7 text-navy" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-navy-deep mb-1">Quero Captar</h3>
                      <p className="text-gray-600 text-sm">
                        Tenho um projeto e quero captar recursos de investidores
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gold mt-4" />
                  </div>
                </button>
              </div>
            ) : (
              /* Step 2: Document info */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-navy-deep">
                    {formData.role === "investidor" ? "Dados do Investidor" : "Dados do Emissor"}
                  </h2>
                  {!hasExistingRole && (
                    <button
                      onClick={() => setStep(1)}
                      className="text-sm text-gold-hover hover:underline"
                    >
                      Voltar
                    </button>
                  )}
                </div>

                {/* Document type selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de cadastro *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDocumentTypeSelect("cpf")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        formData.document_type === "cpf"
                          ? "border-gold bg-gold/5"
                          : "border-kate-border hover:border-gold/50"
                      }`}
                    >
                      <User className={`w-5 h-5 ${formData.document_type === "cpf" ? "text-gold-hover" : "text-gray-400"}`} />
                      <div className="text-left">
                        <p className={`font-medium ${formData.document_type === "cpf" ? "text-navy-deep" : "text-gray-700"}`}>
                          CPF
                        </p>
                        <p className="text-xs text-gray-500">Pessoa Física</p>
                      </div>
                      {formData.document_type === "cpf" && (
                        <Check className="w-5 h-5 text-gold ml-auto" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocumentTypeSelect("cnpj")}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        formData.document_type === "cnpj"
                          ? "border-gold bg-gold/5"
                          : "border-kate-border hover:border-gold/50"
                      }`}
                    >
                      <Building2 className={`w-5 h-5 ${formData.document_type === "cnpj" ? "text-gold-hover" : "text-gray-400"}`} />
                      <div className="text-left">
                        <p className={`font-medium ${formData.document_type === "cnpj" ? "text-navy-deep" : "text-gray-700"}`}>
                          CNPJ
                        </p>
                        <p className="text-xs text-gray-500">Pessoa Jurídica</p>
                      </div>
                      {formData.document_type === "cnpj" && (
                        <Check className="w-5 h-5 text-gold ml-auto" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Document number */}
                {formData.document_type && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.document_type === "cpf" ? "CPF" : "CNPJ"} *
                    </label>
                    <input
                      type="text"
                      value={formData.document_number}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      placeholder={formData.document_type === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                      className="w-full px-4 py-3 rounded-xl border border-kate-border focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Company name (for CNPJ) */}
                {formData.document_type === "cnpj" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                      placeholder="Nome da empresa"
                      className="w-full px-4 py-3 rounded-xl border border-kate-border focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                    />
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 rounded-xl border border-kate-border focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.document_type || !formData.document_number}
                  className="w-full py-4 bg-gold hover:bg-gold-hover disabled:bg-gray-300 disabled:cursor-not-allowed text-navy-deep font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Continuar
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8">
            <p className="text-center text-xs text-gray-500">
              Ao continuar, você concorda com nossos{" "}
              <a href="/termos" className="text-gold-hover hover:underline">Termos de Uso</a>
              {" "}e{" "}
              <a href="/privacidade" className="text-gold-hover hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
