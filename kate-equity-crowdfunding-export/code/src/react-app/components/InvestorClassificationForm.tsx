import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Shield, TrendingUp, Loader2, ChevronRight, ChevronLeft } from "lucide-react";

interface ClassificationData {
  income_range: string;
  net_worth: string;
  investment_experience: string;
  risk_tolerance: string;
  investment_horizon: string;
  previous_startup_investments: string;
  investor_classification: string | null;
  investor_classification_at: string | null;
}

const INCOME_OPTIONS = [
  { value: "until_5k", label: "Até R$ 5.000/mês", points: 1 },
  { value: "5k_10k", label: "R$ 5.000 a R$ 10.000/mês", points: 2 },
  { value: "10k_20k", label: "R$ 10.000 a R$ 20.000/mês", points: 3 },
  { value: "20k_50k", label: "R$ 20.000 a R$ 50.000/mês", points: 4 },
  { value: "above_50k", label: "Acima de R$ 50.000/mês", points: 5 },
];

const NET_WORTH_OPTIONS = [
  { value: "until_100k", label: "Até R$ 100.000", points: 1 },
  { value: "100k_500k", label: "R$ 100.000 a R$ 500.000", points: 2 },
  { value: "500k_1m", label: "R$ 500.000 a R$ 1 milhão", points: 3 },
  { value: "1m_5m", label: "R$ 1 milhão a R$ 5 milhões", points: 4 },
  { value: "above_5m", label: "Acima de R$ 5 milhões", points: 5 },
];

const EXPERIENCE_OPTIONS = [
  { value: "none", label: "Nenhuma - Nunca investi", points: 1 },
  { value: "basic", label: "Básica - Poupança, CDB, Tesouro Direto", points: 2 },
  { value: "intermediate", label: "Intermediária - Ações, Fundos de Investimento", points: 3 },
  { value: "advanced", label: "Avançada - Derivativos, Opções, Criptomoedas", points: 4 },
  { value: "professional", label: "Profissional - Trabalho no mercado financeiro", points: 5 },
];

const RISK_OPTIONS = [
  { value: "very_low", label: "Muito baixa - Prefiro não perder nada", points: 1 },
  { value: "low", label: "Baixa - Aceito pequenas perdas por retornos moderados", points: 2 },
  { value: "medium", label: "Média - Aceito perdas moderadas por bons retornos", points: 3 },
  { value: "high", label: "Alta - Aceito perdas significativas por altos retornos", points: 4 },
  { value: "very_high", label: "Muito alta - Aceito perder tudo pelo máximo retorno", points: 5 },
];

const HORIZON_OPTIONS = [
  { value: "short", label: "Curto prazo - Até 1 ano", points: 1 },
  { value: "medium_short", label: "Médio-curto prazo - 1 a 3 anos", points: 2 },
  { value: "medium", label: "Médio prazo - 3 a 5 anos", points: 3 },
  { value: "medium_long", label: "Médio-longo prazo - 5 a 10 anos", points: 4 },
  { value: "long", label: "Longo prazo - Mais de 10 anos", points: 5 },
];

const STARTUP_OPTIONS = [
  { value: "none", label: "Nenhum", points: 1 },
  { value: "1_2", label: "1 a 2 investimentos", points: 2 },
  { value: "3_5", label: "3 a 5 investimentos", points: 3 },
  { value: "6_10", label: "6 a 10 investimentos", points: 4 },
  { value: "above_10", label: "Mais de 10 investimentos", points: 5 },
];

function calculateClassification(data: ClassificationData): { classification: string; points: number } {
  const getPoints = (value: string, options: { value: string; points: number }[]) => {
    return options.find(o => o.value === value)?.points || 0;
  };

  const totalPoints = 
    getPoints(data.income_range, INCOME_OPTIONS) +
    getPoints(data.net_worth, NET_WORTH_OPTIONS) +
    getPoints(data.investment_experience, EXPERIENCE_OPTIONS) +
    getPoints(data.risk_tolerance, RISK_OPTIONS) +
    getPoints(data.investment_horizon, HORIZON_OPTIONS) +
    getPoints(data.previous_startup_investments, STARTUP_OPTIONS);

  if (totalPoints <= 12) return { classification: "conservador", points: totalPoints };
  if (totalPoints <= 20) return { classification: "moderado", points: totalPoints };
  return { classification: "arrojado", points: totalPoints };
}

const CLASSIFICATION_INFO = {
  conservador: {
    label: "Conservador",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Shield,
    description: "Você prefere segurança e preservação do capital. Recomendamos investimentos com menor risco e retornos mais previsíveis.",
    recommendations: [
      "Limite seus investimentos em startups a até 10% do patrimônio",
      "Prefira empresas em estágios mais avançados",
      "Diversifique entre diferentes setores",
    ],
  },
  moderado: {
    label: "Moderado",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: TrendingUp,
    description: "Você aceita algum risco em busca de retornos melhores. Pode investir em startups com equilíbrio entre risco e retorno.",
    recommendations: [
      "Investimentos em startups podem representar até 20% do patrimônio",
      "Diversifique entre early-stage e empresas mais maduras",
      "Acompanhe de perto seus investimentos",
    ],
  },
  arrojado: {
    label: "Arrojado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: TrendingUp,
    description: "Você busca altos retornos e está disposto a assumir riscos significativos. Investimentos em startups se adequam ao seu perfil.",
    recommendations: [
      "Pode alocar até 30% do patrimônio em startups",
      "Considere investimentos em early-stage para maior potencial",
      "Mantenha reserva de emergência separada",
    ],
  },
};

export default function InvestorClassificationForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ClassificationData>({
    income_range: "",
    net_worth: "",
    investment_experience: "",
    risk_tolerance: "",
    investment_horizon: "",
    previous_startup_investments: "",
    investor_classification: null,
    investor_classification_at: null,
  });

  useEffect(() => {
    fetchClassification();
  }, []);

  const fetchClassification = async () => {
    try {
      const res = await fetch("/api/user-profile/classification", { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          if (json.data.investor_classification) {
            setStep(7); // Show result if already classified
          }
        }
      }
    } catch (error) {
      console.error("Error fetching classification:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const { classification } = calculateClassification(data);
    setSaving(true);

    try {
      const res = await fetch("/api/user-profile/classification", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          investor_classification: classification,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setStep(7);
      }
    } catch (error) {
      console.error("Error saving classification:", error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!data.income_range;
      case 2: return !!data.net_worth;
      case 3: return !!data.investment_experience;
      case 4: return !!data.risk_tolerance;
      case 5: return !!data.investment_horizon;
      case 6: return !!data.previous_startup_investments;
      default: return true;
    }
  };

  const RadioOption = ({ 
    value, 
    label, 
    selected, 
    onChange 
  }: { 
    value: string; 
    label: string; 
    selected: boolean;
    onChange: (v: string) => void;
  }) => (
    <label
      className={`
        flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
        ${selected 
          ? "border-gold bg-gold/10 text-navy-deep" 
          : "border-kate-border bg-white hover:border-gold/50"
        }
      `}
    >
      <input
        type="radio"
        className="sr-only"
        checked={selected}
        onChange={() => onChange(value)}
      />
      <div className={`
        w-5 h-5 rounded-full border-2 flex items-center justify-center
        ${selected ? "border-gold bg-gold" : "border-gray-300"}
      `}>
        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  // Step 7: Show result
  if (step === 7 && data.investor_classification) {
    const info = CLASSIFICATION_INFO[data.investor_classification as keyof typeof CLASSIFICATION_INFO];
    const Icon = info.icon;

    return (
      <div className="space-y-6">
        {/* Result Card */}
        <div className={`p-6 rounded-2xl border-2 ${info.color}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/50 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Perfil {info.label}</h3>
              <p className="text-sm opacity-80">
                Classificado em {new Date(data.investor_classification_at!).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <p className="mb-4">{info.description}</p>
        </div>

        {/* Recommendations */}
        <div className="bg-white border border-kate-border rounded-2xl p-6">
          <h4 className="font-semibold text-navy-deep mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Recomendações CVM 88
          </h4>
          <ul className="space-y-3">
            {info.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-kate-text-secondary">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Importante:</strong> Esta classificação é uma orientação baseada em suas respostas. 
            Investimentos em startups possuem alto risco e podem resultar em perda total do capital investido.
          </div>
        </div>

        {/* Redo button */}
        <button
          onClick={() => setStep(1)}
          className="text-sm text-kate-text-secondary hover:text-navy-deep transition-colors"
        >
          Refazer questionário
        </button>
      </div>
    );
  }

  // Questions
  const questions = [
    {
      step: 1,
      title: "Qual sua renda mensal?",
      description: "Considere todas as fontes de renda (salário, investimentos, aluguéis, etc.)",
      field: "income_range" as const,
      options: INCOME_OPTIONS,
    },
    {
      step: 2,
      title: "Qual seu patrimônio total?",
      description: "Inclua imóveis, investimentos, veículos e outros bens",
      field: "net_worth" as const,
      options: NET_WORTH_OPTIONS,
    },
    {
      step: 3,
      title: "Qual sua experiência com investimentos?",
      description: "Selecione a opção que melhor descreve seu histórico",
      field: "investment_experience" as const,
      options: EXPERIENCE_OPTIONS,
    },
    {
      step: 4,
      title: "Qual sua tolerância a risco?",
      description: "Como você lida com a possibilidade de perdas?",
      field: "risk_tolerance" as const,
      options: RISK_OPTIONS,
    },
    {
      step: 5,
      title: "Qual seu horizonte de investimento?",
      description: "Por quanto tempo pretende manter seus investimentos?",
      field: "investment_horizon" as const,
      options: HORIZON_OPTIONS,
    },
    {
      step: 6,
      title: "Quantos investimentos em startups você já fez?",
      description: "Considere investimentos anjo, crowdfunding ou venture capital",
      field: "previous_startup_investments" as const,
      options: STARTUP_OPTIONS,
    },
  ];

  const currentQuestion = questions[step - 1];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div
            key={s}
            className={`
              h-2 flex-1 rounded-full transition-colors
              ${s < step ? "bg-gold" : s === step ? "bg-gold/50" : "bg-gray-200"}
            `}
          />
        ))}
      </div>

      {/* Question Card */}
      <div className="bg-white border border-kate-border rounded-2xl p-6">
        <div className="mb-6">
          <span className="text-sm text-kate-text-secondary">Pergunta {step} de 6</span>
          <h3 className="text-lg font-semibold text-navy-deep mt-1">{currentQuestion.title}</h3>
          <p className="text-sm text-kate-text-secondary mt-1">{currentQuestion.description}</p>
        </div>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              selected={data[currentQuestion.field] === option.value}
              onChange={(v: string) => setData({ ...data, [currentQuestion.field]: v })}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 text-kate-text-secondary hover:text-navy-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={!canProceed() || saving}
            className="flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold-hover text-navy-deep font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Ver Resultado
              </>
            )}
          </button>
        )}
      </div>

      {/* CVM Notice */}
      <div className="text-xs text-kate-text-secondary text-center">
        Classificação conforme Instrução CVM 88/2022
      </div>
    </div>
  );
}
