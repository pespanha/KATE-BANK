export interface CampaignDetail {
  id: string;
  fullDescription: string;
  images: string[];
  updates: {
    date: string;
    title: string;
    content: string;
  }[];
  faqs: {
    question: string;
    answer: string;
  }[];
  risks: string;
}

export const stubCampaignDetails: Record<string, CampaignDetail> = {
  "1": {
    id: "1",
    fullDescription: `
## O Problema

Milhões de pessoas ao redor do mundo não têm acesso a água potável limpa. Mesmo em áreas urbanas, a qualidade da água pode ser questionável, e garrafas plásticas descartáveis estão destruindo nosso planeta.

## Nossa Solução

A **EcoBottle** é uma garrafa inovadora que utiliza tecnologia de filtragem por carvão ativado de coco e UV-C para purificar qualquer água em segundos. 

### Como funciona:

1. **Filtragem física** - Remove partículas e sedimentos
2. **Carvão ativado** - Elimina cloro, metais pesados e compostos orgânicos
3. **UV-C** - Mata 99.99% das bactérias e vírus

## Por que apoiar?

- 🌍 **Sustentável** - Elimine garrafas plásticas da sua vida
- 💧 **Água pura** - Em qualquer lugar do mundo
- 🔋 **Autossuficiente** - Bateria recarregável via USB-C que dura 30 dias
- ♻️ **Filtros recicláveis** - Programa de devolução com desconto

## Especificações

| Característica | Detalhe |
|----------------|---------|
| Capacidade | 500ml |
| Peso | 320g |
| Material | Aço inox 304 |
| Vida do filtro | 300L |
| Bateria | 2000mAh |

Junte-se a nós nessa missão de tornar água limpa acessível para todos!
    `,
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1536939459926-301728717817?w=800&h=600&fit=crop",
    ],
    updates: [
      {
        date: "15 Jan 2025",
        title: "Protótipo finalizado!",
        content: "Finalizamos o protótipo funcional e os testes foram um sucesso. A qualidade da água filtrada superou todas as expectativas!",
      },
      {
        date: "8 Jan 2025",
        title: "50% da meta atingida",
        content: "Incrível! Já passamos da metade da meta. Obrigado a todos os apoiadores!",
      },
    ],
    faqs: [
      {
        question: "A garrafa funciona com água do mar?",
        answer: "Não, a EcoBottle não dessaliniza água. Ela é projetada para purificar água doce de fontes naturais, torneiras ou poços.",
      },
      {
        question: "Com que frequência devo trocar o filtro?",
        answer: "O filtro dura aproximadamente 300 litros, o que equivale a cerca de 6 meses de uso normal.",
      },
      {
        question: "Vocês entregam internacionalmente?",
        answer: "Sim! Entregamos para todo o Brasil e também para países da América do Sul. Outras regiões sob consulta.",
      },
    ],
    risks: "Como todo projeto de crowdfunding, existem riscos. Os principais são atrasos na produção e variações cambiais que podem afetar custos. Temos experiência prévia em manufatura e parcerias estabelecidas para minimizar esses riscos.",
  },
  "2": {
    id: "2",
    fullDescription: `
## Sobre o Projeto

**Lendas do Brasil** é uma coleção ilustrada que traz à vida as histórias mais fascinantes do nosso folclore. Do Saci-Pererê à Iara, do Curupira ao Boto Rosa, cada lenda é contada com respeito às tradições e ilustrada por artistas brasileiros talentosos.

## Por que esse livro?

Nossas lendas estão sendo esquecidas. As novas gerações conhecem mais sobre mitologia grega do que sobre o rico folclore brasileiro. Este livro quer mudar isso.

### O que você vai encontrar:

- 📖 **20 lendas** cuidadosamente selecionadas de todas as regiões
- 🎨 **40+ ilustrações** originais em cores vibrantes
- 📝 **Contexto histórico** de cada lenda
- 🗺️ **Mapa ilustrado** mostrando a origem de cada história

## Os Artistas

Reunimos 10 ilustradores de diferentes estados brasileiros, cada um trazendo sua perspectiva única para as lendas de sua região.

## Especificações do Livro

- **Páginas:** 180
- **Formato:** 21x28cm
- **Papel:** Couché fosco 150g
- **Capa:** Dura, com acabamento soft-touch

Vamos juntos preservar e celebrar a cultura brasileira!
    `,
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=600&fit=crop",
    ],
    updates: [
      {
        date: "12 Jan 2025",
        title: "META BATIDA! 🎉",
        content: "Conseguimos! Ultrapassamos a meta e o livro vai acontecer. Agora cada apoio extra nos permite melhorar ainda mais a qualidade da impressão!",
      },
    ],
    faqs: [
      {
        question: "O livro é indicado para que idade?",
        answer: "O livro foi pensado para todas as idades. As histórias foram adaptadas para serem acessíveis a crianças a partir de 8 anos, mas adultos também vão adorar.",
      },
      {
        question: "Quando será a entrega?",
        answer: "A previsão é março de 2025 para as recompensas físicas e janeiro de 2025 para o e-book.",
      },
    ],
    risks: "O maior risco é o aumento no custo de papel e impressão. Temos cotações fixadas com a gráfica parceira para minimizar esse risco.",
  },
};

export function getCampaignDetail(id: string): CampaignDetail | undefined {
  return stubCampaignDetails[id];
}
