export interface Campaign {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  creatorName: string;
  creatorAvatar: string;
  goalAmount: number;
  currentAmount: number;
  backersCount: number;
  daysLeft: number;
  category: string;
  featured: boolean;
}

export const stubCampaigns: Campaign[] = [
  {
    id: "1",
    title: "EcoBottle: Garrafa que Purifica Água Naturalmente",
    description: "Uma garrafa revolucionária com sistema de filtragem natural que transforma qualquer água em água potável pura.",
    shortDescription: "Garrafa com filtração natural para água pura em qualquer lugar.",
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=600&fit=crop",
    creatorName: "Marina Santos",
    creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    goalAmount: 50000,
    currentAmount: 38500,
    backersCount: 412,
    daysLeft: 18,
    category: "Sustentabilidade",
    featured: true,
  },
  {
    id: "2",
    title: "Livro Ilustrado: Lendas do Brasil",
    description: "Uma coleção de histórias do folclore brasileiro com ilustrações originais de artistas locais.",
    shortDescription: "Folclore brasileiro ilustrado por artistas locais.",
    imageUrl: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
    creatorName: "Pedro Oliveira",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    goalAmount: 25000,
    currentAmount: 28750,
    backersCount: 523,
    daysLeft: 5,
    category: "Arte & Cultura",
    featured: true,
  },
  {
    id: "3",
    title: "App de Meditação para Crianças",
    description: "Um aplicativo gamificado que ensina técnicas de mindfulness e meditação para crianças de 5 a 12 anos.",
    shortDescription: "Meditação divertida e acessível para crianças.",
    imageUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop",
    creatorName: "Carla Mendes",
    creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    goalAmount: 80000,
    currentAmount: 45200,
    backersCount: 287,
    daysLeft: 32,
    category: "Tecnologia",
    featured: false,
  },
  {
    id: "4",
    title: "Documentário: Música das Favelas",
    description: "Um documentário que conta a história da evolução musical nas comunidades do Rio de Janeiro.",
    shortDescription: "A história da música nascida nas comunidades cariocas.",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
    creatorName: "Lucas Silva",
    creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    goalAmount: 120000,
    currentAmount: 67800,
    backersCount: 198,
    daysLeft: 45,
    category: "Cinema",
    featured: true,
  },
  {
    id: "5",
    title: "Horta Vertical Automatizada",
    description: "Sistema inteligente de horta vertical com irrigação automática e monitoramento via app.",
    shortDescription: "Cultive seus alimentos em casa com tecnologia.",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
    creatorName: "Ana Ferreira",
    creatorAvatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    goalAmount: 35000,
    currentAmount: 12400,
    backersCount: 89,
    daysLeft: 28,
    category: "Sustentabilidade",
    featured: false,
  },
  {
    id: "6",
    title: "Jogo de Tabuleiro: Império Tupi",
    description: "Um jogo estratégico que explora a história e cultura dos povos Tupi antes da colonização.",
    shortDescription: "Estratégia e história indígena em um board game único.",
    imageUrl: "https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=800&h=600&fit=crop",
    creatorName: "Roberto Lima",
    creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    goalAmount: 60000,
    currentAmount: 58200,
    backersCount: 634,
    daysLeft: 3,
    category: "Jogos",
    featured: false,
  },
];

export const categories = [
  "Todos",
  "Sustentabilidade",
  "Arte & Cultura",
  "Tecnologia",
  "Cinema",
  "Jogos",
  "Música",
  "Design",
  "Educação",
];
