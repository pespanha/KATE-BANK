import { useState, useEffect } from "react";
import { Link } from "react-router";
import { 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  Users, 
  Zap,
  FileText,
  CheckCircle2,
  Clock,
  Building2,
  Coins,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Handshake,
  Eye
} from "lucide-react";

interface Offer {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  image_url: string;
  category: string;
  min_goal: number;
  max_goal: number;
  current_amount: number;
  investors_count: number;
  min_investment: number;
  end_date: string;
  company_name?: string;
}

const FAQ_ITEMS = [
  {
    question: "O que é equity crowdfunding?",
    answer: "Equity crowdfunding é uma forma de investimento coletivo onde várias pessoas podem investir em empresas ou projetos em troca de participação societária (equity). Na Kate, conectamos investidores a oportunidades selecionadas e aprovadas pela CVM."
  },
  {
    question: "Qual o valor mínimo para investir?",
    answer: "O valor mínimo varia de acordo com cada oferta, mas geralmente começa a partir de R$ 500. Isso democratiza o acesso a investimentos que antes eram restritos a grandes investidores."
  },
  {
    question: "Como funciona a tokenização das cotas?",
    answer: "Suas cotas podem ser representadas digitalmente através de tokens na blockchain. Isso traz mais transparência e facilita futuras negociações. Os tokens só são emitidos após a oferta atingir sua meta de captação."
  },
  {
    question: "E se a oferta não atingir a meta?",
    answer: "Se a meta não for atingida dentro do prazo, todos os valores investidos são devolvidos integralmente aos investidores. Nenhum token é emitido e nenhuma cota é alocada."
  },
  {
    question: "Como posso captar recursos para meu projeto?",
    answer: "Você pode submeter seu projeto através da plataforma. Nossa equipe irá analisar a documentação, viabilidade e adequação às normas da CVM. Após aprovação, sua captação é publicada para investidores."
  }
];

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    setIsLoaded(true);
    
    // Fetch real offers from API
    fetch("/api/offers?status=active&limit=3")
      .then(res => res.json())
      .then(data => {
        if (data.offers && data.offers.length > 0) {
          setOffers(data.offers);
        }
      })
      .catch(() => {
        // Silently fail - will show "coming soon" section
      })
      .finally(() => setLoadingOffers(false));
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-deep via-navy to-navy-light overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-light rounded-full blur-3xl" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className={`max-w-3xl transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-gold text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Plataforma regulada pela CVM
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Invista em projetos reais.
              <span className="text-gold"> Transforme o futuro.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl">
              A Kate conecta investidores a oportunidades selecionadas de equity crowdfunding. 
              Participe de projetos em energia, imobiliário, PMEs e mais — com cotas tokenizadas e total transparência.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/oportunidades"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all duration-200 shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40"
              >
                Ver oportunidades
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/submeter-projeto"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200"
              >
                Submeter projeto
                <FileText className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          {/* Stats */}
          <div className={`mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-700 delay-200 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            {[
              { value: "R$ 45M+", label: "Captados", icon: TrendingUp },
              { value: "12", label: "Ofertas concluídas", icon: CheckCircle2 },
              { value: "3.200+", label: "Investidores", icon: Users },
              { value: "98%", label: "Ofertas bem-sucedidas", icon: Target }
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <stat.icon className="w-8 h-8 text-gold mb-3" />
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que é Equity Crowdfunding */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-6">
            O que é Equity Crowdfunding?
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Crowdfunding é o resultado da fusão entre <span className="font-semibold text-navy">Crowd</span> (multidão) e <span className="font-semibold text-navy">Funding</span> (financiamento), é uma forma de arrecadação financeira a partir da colaboração de um grupo de pessoas que investem seus recursos em algum projeto.
          </p>
        </div>
      </section>

      {/* Vantagens */}
      <section className="py-20 lg:py-28 bg-kate-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-4">
              Vantagens
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descubra os benefícios de investir através do equity crowdfunding
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-kate-border hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-gold-hover" />
              </div>
              <h3 className="text-xl font-bold text-navy-deep mb-3">Rentabilidade</h3>
              <p className="text-gray-600 text-sm">
                A partir de R$ 1.000 investido é possível se tornar sócio de uma empresa promissora e obter ganhos exponenciais ao longo do tempo.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-kate-border hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-gold-hover" />
              </div>
              <h3 className="text-xl font-bold text-navy-deep mb-3">Simplicidade</h3>
              <p className="text-gray-600 text-sm">
                Com alguns cliques é possível analisar as informações e todos os indicadores do projeto e escolher o que mais tem fit com seu perfil.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-kate-border hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-gold-hover" />
              </div>
              <h3 className="text-xl font-bold text-navy-deep mb-3">Democratização</h3>
              <p className="text-gray-600 text-sm">
                Empresas que necessitam de recursos e investidores que buscam rentabilidades acima da média com investimentos alternativos, buscamos unir as duas pontas, tudo isso de forma acessível.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-kate-border hover:shadow-lg transition-shadow duration-300 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-gold-hover" />
              </div>
              <h3 className="text-xl font-bold text-navy-deep mb-3">Segurança</h3>
              <p className="text-gray-600 text-sm">
                Seguimos as melhores normas de compliance, estamos sempre alinhados com as diretrizes da Comissão de Valores Mobiliários, garantindo assim segurança em todo o processo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-4">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Investir ou captar recursos na Kate é simples, seguro e transparente
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Users,
                title: "Cadastre-se",
                description: "Crie sua conta como investidor ou capitador. Complete seu perfil e verificação de identidade."
              },
              {
                step: "02",
                icon: Eye,
                title: "Explore oportunidades",
                description: "Analise as ofertas disponíveis, documentos, equipe e projeções. Tire suas dúvidas com os emissores."
              },
              {
                step: "03",
                icon: Coins,
                title: "Invista e acompanhe",
                description: "Escolha quanto investir e acompanhe seu portfólio. Receba tokens quando a oferta for bem-sucedida."
              }
            ].map((item, index) => (
              <div key={index} className="relative bg-white rounded-2xl p-8 shadow-sm border border-kate-border hover:shadow-lg transition-shadow duration-300">
                <span className="absolute -top-4 left-8 bg-gold text-navy-deep text-sm font-bold px-3 py-1 rounded-full">
                  {item.step}
                </span>
                <div className="w-14 h-14 bg-navy/10 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-7 h-7 text-navy" />
                </div>
                <h3 className="text-xl font-bold text-navy-deep mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Por que Kate */}
      <section className="py-20 lg:py-28 bg-kate-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-6">
                Por que escolher a Kate?
              </h2>
              <p className="text-lg text-gray-600 mb-10">
                Somos mais que uma plataforma de investimentos. Somos parceiros no crescimento do seu patrimônio e dos empreendimentos brasileiros.
              </p>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Handshake,
                    title: "Parceria verdadeira",
                    description: "Acompanhamos cada projeto do início ao fim, garantindo suporte tanto para investidores quanto para emissores."
                  },
                  {
                    icon: Zap,
                    title: "Eficiência e agilidade",
                    description: "Processo de análise estruturado e tecnologia que simplifica investimentos e captações."
                  },
                  {
                    icon: Users,
                    title: "Smart money",
                    description: "Rede de investidores que agrega não só capital, mas conhecimento e conexões aos projetos."
                  },
                  {
                    icon: Shield,
                    title: "Transparência total",
                    description: "Todos os documentos, contratos e atualizações disponíveis. Blockchain para rastreabilidade."
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-gold-hover" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-deep mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-navy-deep to-navy rounded-3xl p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <Coins className="w-8 h-8 text-gold" />
                  <h3 className="text-xl font-bold text-white">Tokenização das cotas</h3>
                </div>
                <p className="text-white/80 mb-6">
                  Suas cotas de investimento podem ser representadas digitalmente através de tokens na blockchain Hathor.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5" />
                    <p className="text-white/90 text-sm">Registro imutável e transparente de propriedade</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5" />
                    <p className="text-white/90 text-sm">Facilita futuras negociações no mercado secundário</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold mt-0.5" />
                    <p className="text-white/90 text-sm">Tokens só são emitidos se a oferta atingir a meta</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gold mt-0.5" />
                    <p className="text-white/90 text-sm">Meta não atingida = devolução integral do investimento</p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    * Integração com blockchain Hathor em desenvolvimento. Funcionalidade será ativada em breve.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Oportunidades em Destaque */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-2">
                Oportunidades em destaque
              </h2>
              <p className="text-gray-600">Projetos selecionados e aprovados pela Kate</p>
            </div>
            {offers.length > 0 && (
              <Link
                to="/oportunidades"
                className="inline-flex items-center gap-2 text-navy font-semibold hover:text-gold-hover transition-colors"
              >
                Ver todas
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          
          {loadingOffers ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : offers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {offers.map((offer) => {
                const progress = (offer.current_amount / offer.min_goal) * 100;
                const endDate = new Date(offer.end_date);
                const now = new Date();
                const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                
                return (
                  <Link
                    key={offer.id}
                    to={`/oferta/${offer.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-kate-border hover:shadow-xl transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={offer.image_url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600"}
                        alt={offer.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-navy-deep/90 text-white text-xs font-medium rounded-full">
                          {offer.category}
                        </span>
                      </div>
                      {daysLeft <= 15 && daysLeft > 0 && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-gold text-navy-deep text-xs font-bold rounded-full">
                            Últimos dias!
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      {offer.company_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">{offer.company_name}</span>
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-navy-deep mb-2 group-hover:text-navy transition-colors">
                        {offer.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {offer.short_description}
                      </p>
                      
                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold text-navy-deep">{formatCurrency(offer.current_amount)}</span>
                          <span className="text-gray-500">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Meta: {formatCurrency(offer.min_goal)}</span>
                          <span>{offer.investors_count} investidores</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-kate-border">
                        <div>
                          <p className="text-xs text-gray-500">Mínimo</p>
                          <p className="font-semibold text-navy-deep">{formatCurrency(offer.min_investment)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Encerra em</p>
                          <p className="font-semibold text-navy-deep">{daysLeft} dias</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Coming Soon State */
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep via-navy to-navy-light p-12 lg:p-16">
              {/* Background decorations */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-gold rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-gold-light rounded-full blur-3xl" />
              </div>
              
              <div className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gold/20 rounded-2xl mb-6">
                  <Sparkles className="w-10 h-10 text-gold" />
                </div>
                
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Novas oportunidades em breve
                </h3>
                <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
                  Estamos finalizando a curadoria de projetos incríveis para você investir. 
                  Cadastre-se para ser notificado quando as primeiras ofertas estiverem disponíveis.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/cadastro"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all duration-200 shadow-lg shadow-gold/30"
                  >
                    Cadastrar para ser avisado
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/submeter-projeto"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200"
                  >
                    Submeter meu projeto
                    <FileText className="w-5 h-5" />
                  </Link>
                </div>
                
                <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gold mb-1">3+</div>
                    <div className="text-white/60 text-sm">Projetos em análise</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gold mb-1">R$ 5M</div>
                    <div className="text-white/60 text-sm">Em captação prevista</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gold mb-1">Em breve</div>
                    <div className="text-white/60 text-sm">Primeira oferta</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28 bg-kate-bg">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-deep mb-4">
              Perguntas frequentes
            </h2>
            <p className="text-gray-600">
              Tire suas dúvidas sobre investir e captar na Kate
            </p>
          </div>
          
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-kate-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-navy-deep pr-4">{item.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Avisos */}
      <section className="py-12 bg-navy-deep">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="w-10 h-10 text-gold mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-4">Avisos importantes</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Investimentos em equity crowdfunding envolvem riscos, incluindo a possibilidade de perda total do capital investido. 
              Rentabilidade passada não é garantia de resultados futuros. Leia atentamente os materiais da oferta e os fatores de risco antes de investir. 
              A Kate atua como plataforma eletrônica de investimento participativo, devidamente registrada na CVM sob nº XXXXX.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-navy to-navy-deep">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Junte-se a milhares de investidores que estão diversificando seu portfólio e apoiando o crescimento de empresas brasileiras.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/cadastro"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-all duration-200 shadow-lg shadow-gold/30"
            >
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/como-funciona"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-200"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
