export interface Reward {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  minAmount: number;
  estimatedDelivery: string;
  itemsIncluded: string[];
  limitedQuantity?: number;
  claimedCount: number;
}

export const stubRewards: Reward[] = [
  // Campaign 1 - EcoBottle
  {
    id: "r1-1",
    campaignId: "1",
    title: "Apoiador Inicial",
    description: "Seja um dos primeiros a apoiar o projeto e ganhe reconhecimento especial.",
    minAmount: 25,
    estimatedDelivery: "Março 2025",
    itemsIncluded: ["Nome na lista de apoiadores", "Wallpaper exclusivo"],
    claimedCount: 156,
  },
  {
    id: "r1-2",
    campaignId: "1",
    title: "EcoBottle Standard",
    description: "Uma EcoBottle completa com filtro que dura 6 meses de uso intenso.",
    minAmount: 89,
    estimatedDelivery: "Abril 2025",
    itemsIncluded: ["1x EcoBottle (500ml)", "1x Filtro reserva", "Bolsa de transporte"],
    limitedQuantity: 500,
    claimedCount: 198,
  },
  {
    id: "r1-3",
    campaignId: "1",
    title: "EcoBottle Family",
    description: "Kit completo para toda família com 4 garrafas em cores diferentes.",
    minAmount: 299,
    estimatedDelivery: "Abril 2025",
    itemsIncluded: ["4x EcoBottle (cores variadas)", "8x Filtros reserva", "4x Bolsas de transporte", "Caixa premium"],
    limitedQuantity: 100,
    claimedCount: 45,
  },
  {
    id: "r1-4",
    campaignId: "1",
    title: "Embaixador Eco",
    description: "Torne-se embaixador oficial do projeto com benefícios exclusivos.",
    minAmount: 500,
    estimatedDelivery: "Abril 2025",
    itemsIncluded: ["2x EcoBottle edição limitada", "10x Filtros", "Camiseta exclusiva", "Convite para evento de lançamento", "Nome gravado na garrafa"],
    limitedQuantity: 50,
    claimedCount: 13,
  },

  // Campaign 2 - Livro Ilustrado
  {
    id: "r2-1",
    campaignId: "2",
    title: "E-book",
    description: "Versão digital do livro em alta resolução.",
    minAmount: 35,
    estimatedDelivery: "Janeiro 2025",
    itemsIncluded: ["E-book em PDF", "Wallpapers das ilustrações"],
    claimedCount: 234,
  },
  {
    id: "r2-2",
    campaignId: "2",
    title: "Livro Físico",
    description: "Edição impressa em papel especial com acabamento premium.",
    minAmount: 89,
    estimatedDelivery: "Março 2025",
    itemsIncluded: ["Livro físico capa dura", "E-book", "Marcador de página exclusivo"],
    claimedCount: 189,
  },
  {
    id: "r2-3",
    campaignId: "2",
    title: "Edição Colecionador",
    description: "Edição especial numerada com extras exclusivos.",
    minAmount: 199,
    estimatedDelivery: "Março 2025",
    itemsIncluded: ["Livro edição numerada", "Prints das ilustrações (A4)", "E-book", "Agradecimento no livro"],
    limitedQuantity: 100,
    claimedCount: 78,
  },

  // Campaign 3 - App Meditação
  {
    id: "r3-1",
    campaignId: "3",
    title: "Acesso Vitalício",
    description: "Acesso completo ao app para sempre, sem mensalidades.",
    minAmount: 49,
    estimatedDelivery: "Junho 2025",
    itemsIncluded: ["Acesso vitalício ao app", "Todas atualizações futuras"],
    claimedCount: 156,
  },
  {
    id: "r3-2",
    campaignId: "3",
    title: "Família Zen",
    description: "Acesso para até 5 perfis de crianças na mesma conta.",
    minAmount: 99,
    estimatedDelivery: "Junho 2025",
    itemsIncluded: ["5 perfis de crianças", "Acesso vitalício", "Conteúdo premium"],
    claimedCount: 98,
  },

  // Campaign 4 - Documentário
  {
    id: "r4-1",
    campaignId: "4",
    title: "Acesso Digital",
    description: "Assista ao documentário completo quando lançar.",
    minAmount: 30,
    estimatedDelivery: "Dezembro 2025",
    itemsIncluded: ["Acesso digital ao documentário", "Making of exclusivo"],
    claimedCount: 89,
  },
  {
    id: "r4-2",
    campaignId: "4",
    title: "Produtor Associado",
    description: "Seu nome nos créditos como produtor associado.",
    minAmount: 150,
    estimatedDelivery: "Dezembro 2025",
    itemsIncluded: ["Crédito no filme", "Acesso digital", "Poster autografado", "Trilha sonora digital"],
    limitedQuantity: 50,
    claimedCount: 34,
  },

  // Campaign 5 - Horta Vertical
  {
    id: "r5-1",
    campaignId: "5",
    title: "Kit Iniciante",
    description: "Horta vertical compacta para começar.",
    minAmount: 199,
    estimatedDelivery: "Maio 2025",
    itemsIncluded: ["Estrutura 3 níveis", "Sistema de irrigação básico", "Kit de sementes"],
    claimedCount: 45,
  },
  {
    id: "r5-2",
    campaignId: "5",
    title: "Kit Smart",
    description: "Versão completa com sensores e app de monitoramento.",
    minAmount: 449,
    estimatedDelivery: "Maio 2025",
    itemsIncluded: ["Estrutura 5 níveis", "Irrigação automática", "Sensores de umidade", "App de monitoramento", "Kit premium de sementes"],
    limitedQuantity: 100,
    claimedCount: 32,
  },

  // Campaign 6 - Jogo de Tabuleiro
  {
    id: "r6-1",
    campaignId: "6",
    title: "Jogo Base",
    description: "O jogo completo com todos os componentes.",
    minAmount: 149,
    estimatedDelivery: "Fevereiro 2025",
    itemsIncluded: ["Tabuleiro", "150 cartas", "50 miniaturas", "Manual ilustrado"],
    claimedCount: 312,
  },
  {
    id: "r6-2",
    campaignId: "6",
    title: "Edição Deluxe",
    description: "Versão premium com miniaturas pintadas e extras.",
    minAmount: 299,
    estimatedDelivery: "Fevereiro 2025",
    itemsIncluded: ["Tabuleiro premium", "150 cartas", "50 miniaturas pintadas à mão", "Expansão exclusiva", "Caixa colecionador"],
    limitedQuantity: 200,
    claimedCount: 187,
  },
  {
    id: "r6-3",
    campaignId: "6",
    title: "Fundador",
    description: "Para os maiores apoiadores do projeto.",
    minAmount: 599,
    estimatedDelivery: "Fevereiro 2025",
    itemsIncluded: ["Edição Deluxe", "Seu nome como fundador no manual", "Playmat exclusivo", "Sleeves para todas as cartas", "Arte original assinada"],
    limitedQuantity: 50,
    claimedCount: 48,
  },
];

export function getRewardsByCampaign(campaignId: string): Reward[] {
  return stubRewards.filter((r) => r.campaignId === campaignId);
}
