import { Flame, Rocket, Star, Trophy, TrendingUp, Zap } from "lucide-react";

interface ProgressTrackerProps {
  currentAmount: number;
  goalAmount: number;
  backersCount: number;
  daysLeft: number;
  createdAt?: string;
}

interface Milestone {
  percent: number;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  message: string;
}

const MILESTONES: Milestone[] = [
  { 
    percent: 25, 
    label: "25%", 
    icon: Zap, 
    color: "text-amber-500",
    bgColor: "bg-amber-100",
    message: "Início promissor!"
  },
  { 
    percent: 50, 
    label: "50%", 
    icon: Flame, 
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    message: "Metade do caminho!"
  },
  { 
    percent: 75, 
    label: "75%", 
    icon: Star, 
    color: "text-violet-500",
    bgColor: "bg-violet-100",
    message: "Quase lá!"
  },
  { 
    percent: 100, 
    label: "100%", 
    icon: Trophy, 
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
    message: "Meta atingida!"
  },
];

export default function ProgressTracker({
  currentAmount,
  goalAmount,
  backersCount,
  daysLeft,
  createdAt,
}: ProgressTrackerProps) {
  const progressPercent = Math.min((currentAmount / goalAmount) * 100, 100);
  const isFullyFunded = currentAmount >= goalAmount;
  const overFundedPercent = currentAmount > goalAmount 
    ? Math.round((currentAmount / goalAmount) * 100) 
    : null;
  
  // Calculate average pledge
  const avgPledge = backersCount > 0 ? currentAmount / backersCount : 0;
  
  // Calculate daily rate if we have created date
  const dailyRate = createdAt 
    ? (() => {
        const daysSinceCreated = Math.max(1, Math.ceil(
          (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
        ));
        return currentAmount / daysSinceCreated;
      })()
    : null;
  
  // Projected total if daily rate continues
  const projectedTotal = dailyRate && daysLeft > 0
    ? currentAmount + (dailyRate * daysLeft)
    : null;
  
  // Find current milestone
  const currentMilestone = MILESTONES.filter(m => progressPercent >= m.percent).pop();
  const nextMilestone = MILESTONES.find(m => progressPercent < m.percent);
  
  // Amount needed for next milestone
  const amountForNextMilestone = nextMilestone
    ? (goalAmount * nextMilestone.percent / 100) - currentAmount
    : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Main Progress Display */}
      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-2xl p-6 border border-violet-100">
        {/* Current Status Banner */}
        {currentMilestone && (
          <div className={`flex items-center gap-3 mb-4 p-3 rounded-xl ${currentMilestone.bgColor}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentMilestone.bgColor}`}>
              <currentMilestone.icon className={`w-5 h-5 ${currentMilestone.color}`} />
            </div>
            <div>
              <p className={`font-semibold ${currentMilestone.color}`}>
                {currentMilestone.message}
              </p>
              {overFundedPercent && overFundedPercent > 100 && (
                <p className="text-sm text-emerald-600">
                  {overFundedPercent}% da meta atingida!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Amount Display */}
        <div className="text-center mb-6">
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(currentAmount)}
          </p>
          <p className="text-gray-500 mt-1">
            arrecadados de {formatCurrency(goalAmount)}
          </p>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="relative mb-8">
          {/* Track */}
          <div className="h-4 bg-white/80 rounded-full shadow-inner overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isFullyFunded
                  ? "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
              }`}
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          
          {/* Milestone Markers */}
          <div className="absolute -top-1 left-0 right-0 flex justify-between px-0">
            {MILESTONES.map((milestone) => {
              const isReached = progressPercent >= milestone.percent;
              const Icon = milestone.icon;
              return (
                <div
                  key={milestone.percent}
                  className="relative flex flex-col items-center"
                  style={{ 
                    left: `${milestone.percent}%`, 
                    transform: "translateX(-50%)",
                    position: "absolute"
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isReached
                        ? `${milestone.bgColor} ring-2 ring-white shadow-lg`
                        : "bg-white/80 text-gray-300"
                    }`}
                  >
                    {isReached ? (
                      <Icon className={`w-3 h-3 ${milestone.color}`} />
                    ) : (
                      <span className="text-[10px] font-medium text-gray-400">
                        {milestone.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Percentage */}
        <div className="text-center">
          <span className={`text-3xl font-bold ${isFullyFunded ? "text-emerald-500" : "text-violet-600"}`}>
            {Math.round(progressPercent)}%
          </span>
          <span className="text-gray-500 ml-2">financiado</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <p className="text-sm text-gray-500">Apoio Médio</p>
          <p className="font-bold text-gray-900">{formatCurrency(avgPledge)}</p>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Rocket className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-500">Falta para Meta</p>
          <p className="font-bold text-gray-900">
            {isFullyFunded ? "Atingida!" : formatCurrency(goalAmount - currentAmount)}
          </p>
        </div>
      </div>

      {/* Next Milestone Progress */}
      {nextMilestone && amountForNextMilestone && amountForNextMilestone > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <nextMilestone.icon className={`w-4 h-4 ${nextMilestone.color}`} />
              <span className="text-sm font-medium text-gray-700">
                Próximo marco: {nextMilestone.label}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              faltam {formatCurrency(amountForNextMilestone)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${nextMilestone.bgColor.replace("bg-", "bg-opacity-50 bg-")}`}
              style={{ 
                width: `${((progressPercent % 25) / 25) * 100}%`,
                backgroundColor: nextMilestone.color.includes("amber") ? "#fbbf24" 
                  : nextMilestone.color.includes("orange") ? "#f97316"
                  : nextMilestone.color.includes("violet") ? "#8b5cf6"
                  : "#10b981"
              }}
            />
          </div>
        </div>
      )}

      {/* Projection (if we have data) */}
      {projectedTotal && projectedTotal > currentAmount && daysLeft > 0 && !isFullyFunded && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-700 font-medium mb-1">📈 Projeção</p>
          <p className="text-gray-700">
            Se o ritmo atual continuar, a campanha pode arrecadar{" "}
            <span className="font-bold text-blue-700">{formatCurrency(projectedTotal)}</span>
            {projectedTotal >= goalAmount && (
              <span className="text-emerald-600 font-medium"> — meta será atingida! 🎉</span>
            )}
          </p>
        </div>
      )}

      {/* Urgency Message */}
      {daysLeft <= 7 && daysLeft > 0 && !isFullyFunded && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <p className="text-amber-800 font-medium flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            {daysLeft === 1 
              ? "Último dia! Sua contribuição faz toda a diferença."
              : `Restam apenas ${daysLeft} dias! Ajude a campanha a atingir a meta.`
            }
          </p>
        </div>
      )}

      {/* Success Message */}
      {isFullyFunded && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-emerald-800 font-medium flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-500" />
            Meta atingida! Contribuições adicionais ajudam a expandir o projeto.
          </p>
        </div>
      )}
    </div>
  );
}
