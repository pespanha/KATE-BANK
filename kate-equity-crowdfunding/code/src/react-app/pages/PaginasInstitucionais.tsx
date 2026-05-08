import { Link } from "react-router";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Building2,
  Coins,
  Scale,
  Lock,
  Mail,
  ChevronRight,
  Target,
  Rocket,
  Heart,
  Phone,
  MapPin,
  Clock,
  XCircle,
  DollarSign,
  Percent,
  BadgeCheck,
  Gavel
} from "lucide-react";

// Como Funciona Page
export function ComoFunciona() {
  const steps = [
    {
      number: "01",
      title: "Cadastre-se na plataforma",
      description: "Crie sua conta gratuita, complete seu perfil de investidor e responda ao questionário de suitability para entender seu perfil de risco.",
      icon: Users
    },
    {
      number: "02", 
      title: "Explore as oportunidades",
      description: "Navegue pelas ofertas disponíveis, analise os projetos, leia a documentação e tire suas dúvidas com os empreendedores.",
      icon: Target
    },
    {
      number: "03",
      title: "Invista no seu favorito",
      description: "Escolha quanto deseja investir (respeitando seu limite), confirme os termos e realize o pagamento via PIX ou transferência.",
      icon: Coins
    },
    {
      number: "04",
      title: "Acompanhe seu investimento",
      description: "Monitore o progresso da captação, receba atualizações do projeto e, após o sucesso, seus tokens serão emitidos na blockchain.",
      icon: TrendingUp
    }
  ];

  const forInvestors = [
    "Acesso a investimentos antes restritos a grandes investidores",
    "Diversificação de portfólio com valores acessíveis",
    "Transparência total via tokenização blockchain",
    "Acompanhamento em tempo real dos projetos",
    "Suporte dedicado da equipe Kate"
  ];

  const forCompanies = [
    "Captação de recursos sem burocracia bancária",
    "Acesso a uma base de investidores qualificados",
    "Visibilidade e marketing para seu projeto",
    "Processo 100% digital e transparente",
    "Suporte na estruturação da oferta"
  ];

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Como Funciona
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Investir em startups e empresas em crescimento nunca foi tão simples e acessível.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-6 border border-kate-border h-full">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-gold" />
                </div>
                <span className="text-5xl font-bold text-gold/20">{step.number}</span>
                <h3 className="text-xl font-bold text-navy-deep mt-2 mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <ChevronRight className="hidden lg:block absolute top-1/2 -right-4 w-8 h-8 text-gray-300 transform -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* For Investors & Companies */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-navy-deep to-navy p-8 rounded-2xl text-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-gold" />
                Para Investidores
              </h2>
              <ul className="space-y-4">
                {forInvestors.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth/cadastro" className="inline-flex items-center gap-2 mt-8 bg-gold text-navy-deep px-6 py-3 rounded-lg font-semibold hover:bg-gold-light transition">
                Começar a Investir
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="bg-gradient-to-br from-gold to-gold-light p-8 rounded-2xl text-navy-deep">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                Para Empresas
              </h2>
              <ul className="space-y-4">
                {forCompanies.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/captar" className="inline-flex items-center gap-2 mt-8 bg-navy-deep text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy transition">
                Submeter Projeto
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-navy-deep mb-4">Pronto para começar?</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Junte-se a milhares de investidores que já estão participando do futuro da economia brasileira.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/oportunidades" className="bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
            Ver Oportunidades
          </Link>
          <Link to="/faq" className="border border-navy-deep text-navy-deep px-8 py-3 rounded-lg font-semibold hover:bg-navy-deep/5 transition">
            Perguntas Frequentes
          </Link>
        </div>
      </section>
    </div>
  );
}

// Sobre Page
export function Sobre() {
  const values = [
    {
      icon: Shield,
      title: "Transparência",
      description: "Todas as informações são claras e acessíveis. Sem letras miúdas ou surpresas."
    },
    {
      icon: Users,
      title: "Democratização",
      description: "Investimentos de qualidade para todos, não apenas para grandes investidores."
    },
    {
      icon: Lock,
      title: "Segurança",
      description: "Tecnologia blockchain e processos rigorosos para proteger seu patrimônio."
    },
    {
      icon: Heart,
      title: "Impacto",
      description: "Conectamos capital a empresas que geram valor para a sociedade."
    }
  ];

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Sobre a Kate
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Democratizando o acesso a investimentos de qualidade através da tecnologia.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-3xl font-bold text-navy-deep mb-6">Nossa Missão</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            A Kate nasceu com o propósito de democratizar o acesso a investimentos em empresas privadas. 
            Acreditamos que todos devem ter a oportunidade de participar do crescimento de negócios 
            inovadores e impactantes, não apenas investidores institucionais ou pessoas de alta renda.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy-deep text-center mb-12">Nossos Valores</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-bold text-navy-deep mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulation */}
      <section className="py-20 container mx-auto px-4">
        <div className="bg-gradient-to-br from-navy-deep to-navy rounded-2xl p-8 md:p-12 text-white">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scale className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Regulamentação e Conformidade</h2>
              <p className="text-white/80 mb-4">
                A Kate opera em conformidade com a Resolução CVM 88, que regulamenta o crowdfunding de 
                investimento no Brasil. Todas as ofertas publicadas em nossa plataforma passam por análise 
                rigorosa de documentação e são registradas junto à CVM.
              </p>
              <p className="text-white/80">
                Nosso compromisso é garantir que investidores e empresas tenham um ambiente seguro, 
                transparente e regulamentado para realizar suas transações.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-navy-deep mb-6">Entre em Contato</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Tem dúvidas ou sugestões? Nossa equipe está pronta para ajudar.
          </p>
          <a href="mailto:contato@kateequity.com" className="inline-flex items-center gap-2 bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
            <Mail className="w-5 h-5" />
            contato@kateequity.com
          </a>
        </div>
      </section>
    </div>
  );
}

// FAQ Page
export function FAQ() {
  const faqs = [
    {
      category: "Geral",
      questions: [
        {
          q: "O que é a Kate?",
          a: "A Kate é uma plataforma de equity crowdfunding que conecta investidores a empresas em crescimento. Através da nossa plataforma, você pode investir em projetos selecionados e se tornar sócio de empresas inovadoras."
        },
        {
          q: "O que é equity crowdfunding?",
          a: "Equity crowdfunding é uma modalidade de investimento coletivo onde várias pessoas podem investir em uma empresa em troca de participação societária (equity). É regulamentado pela CVM no Brasil através da Resolução 88."
        },
        {
          q: "A Kate é regulamentada?",
          a: "Sim, a Kate opera em conformidade com a Resolução CVM 88, que regulamenta o crowdfunding de investimento no Brasil. Todas as ofertas são analisadas e registradas junto à CVM."
        }
      ]
    },
    {
      category: "Investimentos",
      questions: [
        {
          q: "Qual o valor mínimo para investir?",
          a: "O valor mínimo varia de acordo com cada oferta, mas geralmente começa a partir de R$ 500. Cada projeto define seu valor mínimo de investimento."
        },
        {
          q: "Existe um limite máximo de investimento?",
          a: "Sim, a CVM estabelece limites de investimento baseados na renda e patrimônio do investidor. Durante o cadastro, você responderá a perguntas para determinar seu limite."
        },
        {
          q: "Como funciona o pagamento?",
          a: "Após confirmar seu investimento, você receberá instruções para pagamento via PIX ou transferência bancária. O valor fica em custódia até a oferta atingir sua meta mínima."
        },
        {
          q: "E se a oferta não atingir a meta?",
          a: "Se a meta mínima não for atingida dentro do prazo, todos os valores investidos são devolvidos integralmente aos investidores. Nenhuma taxa é cobrada nesse caso."
        }
      ]
    },
    {
      category: "Tokenização",
      questions: [
        {
          q: "O que é tokenização?",
          a: "Tokenização é o processo de representar sua participação societária através de tokens digitais na blockchain. Isso traz mais transparência, segurança e facilita futuras negociações."
        },
        {
          q: "Quando recebo meus tokens?",
          a: "Os tokens são emitidos após a oferta atingir sua meta e ser concluída com sucesso. Você receberá uma notificação e poderá visualizar seus tokens na sua carteira digital."
        },
        {
          q: "Posso vender meus tokens?",
          a: "A possibilidade de negociação de tokens depende das regras de cada oferta e da regulamentação vigente. Consulte os termos específicos de cada investimento."
        }
      ]
    },
    {
      category: "Para Empresas",
      questions: [
        {
          q: "Como posso captar recursos para meu projeto?",
          a: "Você pode submeter seu projeto através da plataforma clicando em 'Captar Recursos'. Nossa equipe irá analisar a documentação e viabilidade do projeto."
        },
        {
          q: "Quais são os custos para captar?",
          a: "A Kate cobra uma taxa de sucesso sobre o valor captado. Os custos variam de acordo com o tamanho e complexidade da captação. Entre em contato para uma proposta personalizada."
        },
        {
          q: "Quanto tempo leva o processo de aprovação?",
          a: "O processo de análise e aprovação leva em média 30 a 60 dias, dependendo da complexidade do projeto e da completude da documentação enviada."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Perguntas Frequentes
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns sobre a Kate e investimentos.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqs.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-2xl font-bold text-navy-deep mb-6">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="bg-white rounded-xl border border-kate-border p-6">
                    <h3 className="font-semibold text-navy-deep mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy-deep mb-4">Ainda tem dúvidas?</h2>
          <p className="text-gray-600 mb-8">Nossa equipe está pronta para ajudar.</p>
          <a href="mailto:contato@kateequity.com" className="inline-flex items-center gap-2 bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
            <Mail className="w-5 h-5" />
            Fale Conosco
          </a>
        </div>
      </section>
    </div>
  );
}

// Riscos Page
export function Riscos() {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-600 via-red-700 to-red-800 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Aviso de Riscos
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Antes de investir, é fundamental entender os riscos envolvidos. Leia atentamente as informações abaixo.
          </p>
        </div>
      </section>

      {/* Warning Banner */}
      <section className="py-8 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 justify-center text-amber-800">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="font-medium text-center">
              Investir em empresas em estágio inicial envolve riscos significativos. Invista apenas o que você pode perder.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-kate-border p-8 md:p-12">
          <div className="prose prose-lg max-w-none text-gray-700">
            
            {/* Introdução */}
            <p className="text-gray-600 mb-8">
              Portanto, essas sociedades empresariais não estão sujeitas à fiscalização da CVM para distribuição de títulos mobiliários.
            </p>
            <p className="text-gray-600 mb-8">
              As sociedades empresárias de pequeno porte, aquelas que faturam até R$ 15.000.000/ano e as ofertas apresentadas nesta plataforma estão automaticamente dispensadas de registro pela comissão de valores mobiliários – CVM (RES. 88/2022).
            </p>
            <p className="text-gray-600 mb-8">
              As ofertas realizadas não implicam e nem serão fiscalizadas por parte da CVM a garantia da veracidade das informações prestadas, de adequação à legislação vigente ou julgamento sobre a qualidade da sociedade empresária de pequeno porte.
            </p>
            <p className="text-gray-600 mb-8">
              Caso realmente for realizar o aporte na rodada, leia todos os documentos presentes na RODADA DE ABERTURA DE INVESTIMENTO.
            </p>
            <p className="text-gray-600 mb-8">
              A CVM não analisa previamente as ofertas publicadas na plataforma.
            </p>
            <p className="text-gray-600 mb-8">
              Analisando o âmbito legal, a KATE EQUITY, seus funcionários, administradores e demais parceiros não terão qualquer tipo de responsabilidade de qualquer natureza perante terceiros, especialmente, mas não se limitando a perdas diretas ou indiretas, obrigações, custos, reclamações, despesas, prejuízos ou danos de qualquer espécie, relacionados aos investimentos realizados por meio da plataforma KATE EQUITY para os fins a que está se destina de fato e seguirão sempre o código de conduta pré-estabelecido na organização.
            </p>

            {/* 1. Risco de Liquidez */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">1. RISCO DE LIQUIDEZ</h2>
            <p className="text-gray-600 mb-4">
              Investimentos em empresas de pequeno porte, aquelas que faturam até R$ 15.000.000/ano não são altamente líquidos, isto pelo fato de ter um baixo grau de conversão da participação em ativo (dinheiro), sem perda substancial de seu valor de imediato.
            </p>
            <p className="text-gray-600 mb-4">
              O risco de liquidez ocorre diante da possibilidade de não conseguir negociar um ativo sem afetar o preço do mesmo. Em um investimento, esse risco pode ser manifestado pela baixa demanda do ativo, no caso participação em empresas: o detentor do ativo terá dificuldades para vendê-lo e provavelmente terá que reduzir o preço em uma negociação.
            </p>
            <p className="text-gray-600 mb-4">
              Pouco provável que ocorra possibilidade de um usuário investidor vender sua participação efetiva da cota valor e sair desse investimento antes que a Empresa Investida seja comprada, ou tenha um novo aporte de capital por outra empresa ou que a Empresa Investida tenha suas participações societárias admitidas à negociação em bolsa de valores ("IPO"). Existe a possibilidade de uma saída disponível do investimento no futuro, dificilmente isto ocorra nos primeiros anos subsequentes ao momento que você faz o investimento.
            </p>
            <p className="text-gray-600 mb-8">
              Classificamos qualquer Investimento na Plataforma KATE EQUITY como um aporte de risco e os ganhos sobre este aporte poderão vir da valorização de uma cota ou dividendos a longo prazo.
            </p>

            {/* 2. Perda de Capital */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">2. PERDA DE CAPITAL COM UM VALOR ALTO DE APORTE E NECESSIDADE DE DIVERSIFICAÇÃO DOS APORTES EM VÁRIAS EMPRESAS</h2>
            <p className="text-gray-600 mb-4">
              Ressaltamos que investimentos através da plataforma KATE EQUITY está atrelado diretamente a retorno x risco. Caso a Empresa Investida venha a ocorrer com falência, possibilita uma grande chance em que os valores investidos não retornem de fato, tendo como certo que a KATE EQUITY não terá qualquer tipo de responsabilidade neste sentido conforme resolução 88 da CVM.
            </p>

            {/* 3. Falta de Dividendos */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">3. FALTA DE DIVIDENDOS ORIGINADOS DOS LUCROS APURADOS</h2>
            <p className="text-gray-600 mb-8">
              Os dividendos em empresas de pequeno porte são pagamentos distribuídos a acionistas e cotistas originados dos lucros apurados de uma empresa. A EMPRESA obtendo lucro serão pagos os dividendos de acordo com a proporção estabelecida em ata, ou seja, % de retorno para empresa e % de distribuição aos acionistas conforme estipulado no processo societário. Importante ressaltar e analisar sobre o modelo de pagamentos dos dividendos em que a EMPRESA INVESTIDA está na RODADA DE INVESTIMENTO.
            </p>

            {/* 4. Demais Riscos de Valorização */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">4. DEMAIS RISCOS RELACIONADOS A VALORIZAÇÃO DA COTA E DISTRIBUIÇÃO DE DIVIDENDOS</h2>
            <p className="text-gray-600 mb-8">
              A lucratividade de uma Sociedade no passado não será garantia de resultados lucrativos no futuro. Verifique todos os documentos jurídicos da empresa e dos sócios, assim como suas projeções futuras.
            </p>

            {/* 5. Diluição */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">5. DILUIÇÃO DO INVESTIMENTO</h2>
            <p className="text-gray-600 mb-8">
              Importante ressaltar que qualquer investimento realizado na Plataforma KATE EQUITY pode estar atrelado à diluição no futuro. Significa que a porcentagem de participação da Empresa Investida que você tem direito por ter investido pode ser reduzida se a empresa decidir aumentar seu capital social, abrir uma nova rodada e emitir mais cotas, ações, contratos de opção, ou títulos similares para investidores no futuro e o investidor não adquira nova participação proporcional dessas novas cotas, ações ou títulos conversíveis. Quaisquer novas cotas ou ações lançadas poderá ser incluídas direitos de prioridade no recebimento de dividendos, dentre outras vantagens, e o exercício desses direitos poderia resultar em uma desvantagem para investidores anteriores. Importante examinar as regras e condições de cada Empresa Investida no que se refere à diluição do capital.
            </p>

            {/* 6. Outros Riscos */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">6. OUTROS RISCOS</h2>
            
            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.1 Verificação das Informações</h3>
            <p className="text-gray-600 mb-4">
              As informações fornecidas aos investidores na oferta de investimento, inclusive as informações jurídicas e comerciais da empresa, são fornecidas exclusivamente pela própria Empresa Investida e por seus sócios. A KATE EQUITY faz um processo de identificação, apuração, validação do score jurídico e financeiro para assegurar a veracidade dessas informações, mas esse processo nunca pode julgar com certeza a veracidade das informações fornecidas. Cabe ao próprio investidor realizar sua própria análise e investigação sobre os documentos apresentados pela Empresa Investida, e deverá consultar um profissional adequado, como consultores de investimentos, advogados e contadores para que o possível investidor tenha plena visualização das informações da empresa.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.2 Risco de Crédito</h3>
            <p className="text-gray-600 mb-4">
              O risco de crédito tem origem na possibilidade da contraparte não honrar suas obrigações. Nas hipóteses em que o investimento for representado por título representativo de dívida, que dê direito ao investidor a receber de volta a totalidade ou parte do valor investido em determinadas situações, há risco de os valores entregues à Empresa Investida NÃO SEREM DEVOLVIDOS, em razão da situação econômico-financeira da empresa. Trata-se de risco inerente aos investimentos em qualquer sociedade e que são potencializados no caso de investimentos em sociedades empresárias de pequeno porte, sendo certo que a KATE EQUITY não terá qualquer tipo de responsabilidade perante os investidores em caso de não devolução dos valores pela Empresa Investida.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.3 Sócio Minoritário e Estrutura do Sócio Controlador</h3>
            <p className="text-gray-600 mb-4">
              Ao investir em empresas na Plataforma KATE EQUITY, o investidor poderá adquirir uma posição minoritária na sociedade empresária, que não lhe fornecerá controle sobre as atividades da empresa, ou mesmo adquirir participações societárias sem direito de voto, porém a empresa poderá convidar sempre que se sentir confortável os investidores a participarem da rotina da empresa e de comitês de sociedade. A empresa investida deverá fornecer indicadores aos seus investidores. O seu investimento estará sujeito aos riscos associados dessa posição de sócio minoritário e sem controle. O investidor deve considerar a influência que os controladores majoritários da empresa possam vir a exercer em eventos corporativos como a emissão adicional de valores mobiliários, alienação do controle ou de ativos, e transações com partes relacionadas, ao decidir fazer seu investimento.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.4 Resolução 88 da CVM - Dispensa e Ausência de Fiscalização</h3>
            <p className="text-gray-600 mb-4">
              A Resolução 88 da CVM dispensa e ausência de Fiscalização da Empresa Investida pela CVM. A Empresa Investida, como sociedade empresária de pequeno porte, não é registrada na CVM e, apesar do compromisso contratual em relação à prestação de informações contínuas nos termos de investimento, ainda existe uma possibilidade de não haver prestação de informações contínuas pela sociedade após a realização da oferta. O não recebimento de destas informações pode dificultar o acompanhamento da Empresa Investida pelo investidor, bem como dificultar ou prevenir a transferência dos valores mobiliários aportados.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.5 Transformação em Sociedade Anônima e Conversibilidade das Notas Conversíveis</h3>
            <p className="text-gray-600 mb-4">
              Na Plataforma KATE EQUITY, as Notas Conversíveis ofertadas pelas Empresas Investidas dão direito, atendidas as condições previstas, ao possível recebimento futuro de ações de Sociedades Anônimas, não sendo possível a entrega, ao investidor, de quotas de outros tipos societários. O USUÁRIO INVESTIDOR deve estar ciente de que não existe qualquer obrigação, definida em lei ou regulamentação, da Empresa Investida transformar-se em Sociedade Anônima e poderá também fornecer o resgate da nota conversível em um determinado período estabelecido na informação de oferta pública. A obrigação de transformação decorre do Contrato relativo às Notas Conversíveis, celebrado entre as partes. Caso os sócios da Empresa Investida (não constituída desde a emissão das Notas Conversíveis de fato como Sociedade Anônima) não realizem os atos societários necessários, em conformidade com o contratado, para efetuar a transformação para este tipo de sociedade e emitir as ações a serem entregues ao investidor, o investidor poderá ser bloqueado de se tornar acionista da Empresa Investida e ser obrigado, às suas próprias expensas do que recorrer ao Judiciário para obter o cumprimento da obrigação contratual.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.6 Risco Econômico-Financeiro e Político</h3>
            <p className="text-gray-600 mb-4">
              O risco do cenário econômico-financeiro, risco político, pois o governo pode tomar medidas que geram impactos adverso nos investimentos, como alterar tributações ou mudar regulamentações estabelecidas.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.7 Risco de Sistema</h3>
            <p className="text-gray-600 mb-4">
              Em um sistema online de investimentos, você suportar riscos específicos como o de uma falha no funcionamento do hardware ou software. Esse tipo de problema do sistema pode resultar no seguinte: Seu pedido pode não ser realizado, e sua plataforma pode ficar sem efetuar aquele investimento.
            </p>

            <h3 className="text-xl font-semibold text-navy-deep mt-6 mb-3">6.8 Valuation</h3>
            <p className="text-gray-600 mb-8">
              Antes de publicar uma RODADA, você deve ter uma noção estabelecida do valor de investimento que procura captar para a sua empresa estabelecendo o valor de captação mínimo e o valor de captação máximo (observado o limite máximo estabelecido pela regulamentação da CVM - Resolução 88/2022). O Valuation de uma empresa é de total responsabilidade da mesma. Caso tenha dúvida sobre este, utilize nosso fórum eletrônico.
            </p>

            {/* 7. Limitação de Responsabilidade */}
            <h2 className="text-2xl font-bold text-navy-deep mt-10 mb-4">7. LIMITAÇÃO DE RESPONSABILIDADE E OBRIGAÇÕES DA PLATAFORMA</h2>
            <p className="text-gray-600 mb-4">
              Todas as informações descritas na plataforma KATE EQUITY, das rodadas de captação e principalmente neste aviso de risco não podem ser interpretadas e avaliadas como uma recomendação de investimento.
            </p>
            <p className="text-gray-600 mb-4">
              Você deve ler atentamente o Material Didático, e aceitar os Termos de Uso que estão no rodapé da plataforma eletrônica.
            </p>
            <p className="text-gray-600 mb-4">
              O investidor deve ter ampla visão e ciência de que a análise do investimento deverá ser feita apenas por ele e seus consultores particulares.
            </p>
            <p className="text-gray-600 mb-4">
              As oportunidades divulgadas pela KATE EQUITY não possuem garantia de retorno, nem qualquer proteção sobre o valor investido, tenha ciência de que empresas em fase de iniciação podem ter riscos.
            </p>
            <p className="text-gray-600 mb-4">
              As informações constantes na plataforma KATE EQUITY não podem ser interpretadas e nem analisadas como sugestão, recomendação de investimento, nem podem ser caracterizadas como pareceres ou assessoria jurídica, fiscal ou financeira.
            </p>
            <p className="text-gray-600 mb-8">
              As empresas podem ser sociedades limitadas, sem especificidade de regime tributário, que serão captadoras de investimento na plataforma KATE EQUITY e, portanto, essas sociedades empresariais não estão sujeitas à fiscalização da CVM para distribuição de títulos mobiliários.
            </p>

            {/* Declaração Final */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800">
                  <strong>Ao investir através da KATE EQUITY, você declara que leu, compreendeu e aceita todos os riscos descritos neste documento.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-4 text-center">
        <Link to="/oportunidades" className="inline-flex items-center gap-2 bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
          Ver Oportunidades
          <ChevronRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

// Termos Page
export function Termos() {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Termos de Uso
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Última atualização: Janeiro de 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-kate-border p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-navy-deep mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-600 mb-6">
              Ao acessar e usar a plataforma Kate ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve usar a Plataforma.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-600 mb-6">
              A Kate é uma plataforma de equity crowdfunding que conecta investidores a empresas em busca de captação de recursos. A Plataforma opera em conformidade com a Resolução CVM 88 e demais regulamentações aplicáveis.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">3. Cadastro e Conta</h2>
            <p className="text-gray-600 mb-6">
              Para utilizar os serviços da Plataforma, você deve criar uma conta fornecendo informações verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">4. Elegibilidade</h2>
            <p className="text-gray-600 mb-6">
              Para investir através da Plataforma, você deve: (a) ter pelo menos 18 anos de idade; (b) ser residente no Brasil ou possuir situação regular perante as autoridades brasileiras; (c) completar o processo de cadastro e verificação de identidade; (d) responder ao questionário de suitability.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">5. Riscos do Investimento</h2>
            <p className="text-gray-600 mb-6">
              Investimentos em empresas em estágio inicial envolvem alto grau de risco, incluindo a possibilidade de perda total do capital investido. Antes de investir, você deve ler atentamente o Aviso de Riscos disponível na Plataforma e a documentação específica de cada oferta.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">6. Limites de Investimento</h2>
            <p className="text-gray-600 mb-6">
              Em conformidade com a regulamentação da CVM, existem limites de investimento baseados em sua renda bruta anual e patrimônio financeiro. A Plataforma irá informá-lo sobre seus limites durante o processo de investimento.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">7. Propriedade Intelectual</h2>
            <p className="text-gray-600 mb-6">
              Todo o conteúdo da Plataforma, incluindo textos, gráficos, logos, ícones, imagens e software, é propriedade da Kate ou de seus licenciadores e está protegido por leis de propriedade intelectual.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">8. Privacidade</h2>
            <p className="text-gray-600 mb-6">
              O uso de suas informações pessoais é regido por nossa Política de Privacidade, que faz parte integrante destes Termos de Uso.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">9. Modificações</h2>
            <p className="text-gray-600 mb-6">
              A Kate reserva-se o direito de modificar estes Termos de Uso a qualquer momento. As alterações entrarão em vigor após a publicação na Plataforma. O uso continuado após as alterações constitui aceitação dos novos termos.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">10. Contato</h2>
            <p className="text-gray-600 mb-6">
              Para dúvidas sobre estes Termos de Uso, entre em contato através do e-mail: contato@kateequity.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Privacidade Page
export function Privacidade() {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Política de Privacidade
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Última atualização: Janeiro de 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-kate-border p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-navy-deep mb-4">1. Introdução</h2>
            <p className="text-gray-600 mb-6">
              A Kate ("nós", "nosso" ou "Plataforma") está comprometida em proteger sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações pessoais em conformidade com a Lei Geral de Proteção de Dados (LGPD).
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">2. Informações que Coletamos</h2>
            <p className="text-gray-600 mb-4">Coletamos as seguintes categorias de informações:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, CPF, data de nascimento, telefone, endereço</li>
              <li><strong>Dados financeiros:</strong> renda, patrimônio, dados bancários (para fins de investimento)</li>
              <li><strong>Documentos:</strong> documento de identidade, comprovante de residência, selfie para verificação</li>
              <li><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas</li>
              <li><strong>Dados de investimento:</strong> histórico de investimentos, preferências, perfil de risco</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">3. Como Usamos suas Informações</h2>
            <p className="text-gray-600 mb-4">Utilizamos suas informações para:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Criar e gerenciar sua conta na Plataforma</li>
              <li>Processar e gerenciar seus investimentos</li>
              <li>Verificar sua identidade e prevenir fraudes</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Enviar comunicações sobre a Plataforma e seus investimentos</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">4. Compartilhamento de Dados</h2>
            <p className="text-gray-600 mb-6">
              Podemos compartilhar suas informações com: (a) empresas que você investiu, na medida necessária para formalização do investimento; (b) prestadores de serviços que nos auxiliam na operação da Plataforma; (c) autoridades reguladoras e órgãos governamentais, quando exigido por lei; (d) em caso de fusão, aquisição ou venda de ativos da empresa.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-600 mb-6">
              Implementamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui criptografia de dados, controles de acesso e monitoramento contínuo de segurança.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">6. Seus Direitos</h2>
            <p className="text-gray-600 mb-4">Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Solicitar portabilidade dos dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">7. Retenção de Dados</h2>
            <p className="text-gray-600 mb-6">
              Mantemos suas informações pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política, além dos prazos legais de guarda exigidos pela regulamentação aplicável ao mercado de capitais.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">8. Cookies</h2>
            <p className="text-gray-600 mb-6">
              Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência na Plataforma, analisar o tráfego e personalizar conteúdo. Você pode configurar seu navegador para recusar cookies, mas isso pode afetar algumas funcionalidades da Plataforma.
            </p>

            <h2 className="text-2xl font-bold text-navy-deep mb-4">9. Contato</h2>
            <p className="text-gray-600 mb-6">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato com nosso Encarregado de Proteção de Dados através do e-mail: privacidade@kateequity.com
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Critérios de Seleção Page
export function Criterios() {
  const criterios = [
    {
      icon: Building2,
      title: "Estrutura Societária",
      description: "A empresa deve estar constituída como sociedade limitada ou anônima, com CNPJ ativo e situação regular perante a Receita Federal.",
      required: true
    },
    {
      icon: FileText,
      title: "Documentação Completa",
      description: "Contrato social atualizado, documentos dos sócios, demonstrações financeiras e plano de negócios detalhado.",
      required: true
    },
    {
      icon: TrendingUp,
      title: "Potencial de Crescimento",
      description: "Modelo de negócio escalável com potencial de crescimento demonstrável e mercado-alvo bem definido.",
      required: true
    },
    {
      icon: Users,
      title: "Equipe Qualificada",
      description: "Time fundador com experiência relevante no setor e capacidade de execução comprovada.",
      required: true
    },
    {
      icon: Coins,
      title: "Faturamento",
      description: "Receita bruta anual de até R$ 40 milhões, conforme limite estabelecido pela Resolução CVM 88.",
      required: true
    },
    {
      icon: Shield,
      title: "Governança",
      description: "Práticas de governança corporativa e transparência na gestão são fatores diferenciadores.",
      required: false
    }
  ];

  const etapas = [
    { step: "1", title: "Submissão", description: "Envie sua proposta através da plataforma" },
    { step: "2", title: "Análise Inicial", description: "Avaliação preliminar em até 5 dias úteis" },
    { step: "3", title: "Due Diligence", description: "Análise aprofundada da documentação" },
    { step: "4", title: "Comitê", description: "Aprovação pelo comitê de investimentos" },
    { step: "5", title: "Publicação", description: "Lançamento da oferta na plataforma" }
  ];

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BadgeCheck className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Critérios de Seleção
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Conheça os requisitos para ter seu projeto aprovado na Kate.
          </p>
        </div>
      </section>

      {/* Critérios */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-navy-deep text-center mb-12">Requisitos para Captação</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {criterios.map((criterio, index) => (
            <div key={index} className="bg-white rounded-xl border border-kate-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-navy-deep/10 rounded-xl flex items-center justify-center">
                  <criterio.icon className="w-6 h-6 text-navy-deep" />
                </div>
                {criterio.required ? (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Obrigatório</span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Diferencial</span>
                )}
              </div>
              <h3 className="text-lg font-bold text-navy-deep mb-2">{criterio.title}</h3>
              <p className="text-gray-600 text-sm">{criterio.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Processo */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-navy-deep text-center mb-12">Processo de Aprovação</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-4">
            {etapas.map((etapa, index) => (
              <div key={index} className="flex items-center">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center mb-2 mx-auto">
                    <span className="text-xl font-bold text-navy-deep">{etapa.step}</span>
                  </div>
                  <h3 className="font-semibold text-navy-deep">{etapa.title}</h3>
                  <p className="text-gray-500 text-sm max-w-[150px]">{etapa.description}</p>
                </div>
                {index < etapas.length - 1 && (
                  <ChevronRight className="hidden md:block w-8 h-8 text-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusões */}
      <section className="py-20 container mx-auto px-4">
        <h2 className="text-3xl font-bold text-navy-deep text-center mb-12">O que NÃO aceitamos</h2>
        <div className="max-w-2xl mx-auto grid gap-4">
          {[
            "Empresas sem CNPJ ativo ou com pendências fiscais",
            "Projetos de jogos de azar, apostas ou atividades ilegais",
            "Empresas com faturamento superior a R$ 40 milhões/ano",
            "Projetos sem documentação mínima exigida",
            "Fundadores com restrições legais graves"
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 bg-red-50 rounded-xl p-4">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-navy-deep to-navy text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para captar?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Se sua empresa atende aos critérios, submeta seu projeto e nossa equipe entrará em contato.
          </p>
          <Link to="/captar" className="inline-flex items-center gap-2 bg-gold text-navy-deep px-8 py-3 rounded-lg font-semibold hover:bg-gold-light transition">
            Submeter Projeto
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Taxas e Custos Page
export function Taxas() {
  const taxasInvestidor = [
    { item: "Cadastro na plataforma", valor: "Gratuito" },
    { item: "Acesso às ofertas", valor: "Gratuito" },
    { item: "Realização de investimentos", valor: "Gratuito" },
    { item: "Custódia de tokens", valor: "Gratuito" },
    { item: "Transferência de tokens*", valor: "Taxa de rede" }
  ];

  const taxasEmissor = [
    { item: "Análise de projeto", valor: "Gratuito", descricao: "Avaliação inicial sem compromisso" },
    { item: "Taxa de sucesso", valor: "5% a 8%", descricao: "Sobre o valor captado, cobrada apenas em caso de sucesso" },
    { item: "Setup da oferta", valor: "Sob consulta", descricao: "Estruturação jurídica e documentação" },
    { item: "Tokenização", valor: "Incluso", descricao: "Emissão de tokens na blockchain Hathor" }
  ];

  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <DollarSign className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Taxas e Custos
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Transparência total sobre os custos envolvidos.
          </p>
        </div>
      </section>

      {/* Para Investidores */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-navy-deep">Para Investidores</h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-kate-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-kate-bg">
                <tr>
                  <th className="text-left p-4 font-semibold text-navy-deep">Serviço</th>
                  <th className="text-right p-4 font-semibold text-navy-deep">Valor</th>
                </tr>
              </thead>
              <tbody>
                {taxasInvestidor.map((taxa, index) => (
                  <tr key={index} className="border-t border-kate-border">
                    <td className="p-4 text-gray-700">{taxa.item}</td>
                    <td className="p-4 text-right">
                      {taxa.valor === "Gratuito" ? (
                        <span className="text-green-600 font-semibold">{taxa.valor}</span>
                      ) : (
                        <span className="text-gray-600">{taxa.valor}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            * A transferência de tokens entre carteiras pode incorrer em taxas da rede blockchain, que são mínimas na Hathor Network.
          </p>
        </div>
      </section>

      {/* Para Emissores */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-gold" />
              </div>
              <h2 className="text-3xl font-bold text-navy-deep">Para Emissores</h2>
            </div>
            
            <div className="grid gap-4">
              {taxasEmissor.map((taxa, index) => (
                <div key={index} className="bg-kate-bg rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-navy-deep">{taxa.item}</h3>
                    <p className="text-gray-500 text-sm">{taxa.descricao}</p>
                  </div>
                  <div className="text-right">
                    {taxa.valor === "Gratuito" || taxa.valor === "Incluso" ? (
                      <span className="text-green-600 font-bold text-lg">{taxa.valor}</span>
                    ) : (
                      <span className="text-navy-deep font-bold text-lg">{taxa.valor}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-gold/10 rounded-xl">
              <div className="flex items-start gap-4">
                <Percent className="w-8 h-8 text-gold flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-navy-deep mb-2">Modelo Success Fee</h3>
                  <p className="text-gray-600">
                    A Kate trabalha com modelo de taxa de sucesso. Isso significa que você só paga se a captação for bem-sucedida. 
                    Se a meta mínima não for atingida, não há cobrança alguma.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-navy-deep mb-4">Quer saber mais?</h2>
        <p className="text-gray-600 mb-8">Entre em contato para uma proposta personalizada.</p>
        <Link to="/contato" className="inline-flex items-center gap-2 bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
          <Mail className="w-5 h-5" />
          Fale Conosco
        </Link>
      </section>
    </div>
  );
}

// Contato Page
export function Contato() {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Fale Conosco
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Estamos aqui para ajudar. Entre em contato com nossa equipe.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Info Cards */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-kate-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-deep">E-mail</h3>
                  <a href="mailto:contato@kate.capital" className="text-gold hover:underline">
                    contato@kate.capital
                  </a>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Respondemos em até 24 horas úteis.</p>
            </div>

            <div className="bg-white rounded-xl border border-kate-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-deep">Telefone / WhatsApp</h3>
                  <a href="tel:+5521987667852" className="text-gold hover:underline">
                    +55 21 98766-7852
                  </a>
                </div>
              </div>
              <p className="text-gray-500 text-sm">Segunda a sexta, das 9h às 18h.</p>
            </div>

            <div className="bg-white rounded-xl border border-kate-border p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-deep">Endereço</h3>
                  <p className="text-gray-600">
                    Rua Visconde de Inhaúma, 134<br />
                    Sala 2001 Parte, Centro<br />
                    Rio de Janeiro - RJ<br />
                    CEP: 20091-901
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-kate-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy-deep">Horário de Atendimento</h3>
                  <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-2xl font-bold text-navy-deep mb-6">Acesso Rápido</h2>
            <div className="space-y-4">
              <Link to="/faq" className="flex items-center justify-between bg-white rounded-xl border border-kate-border p-4 hover:border-gold transition">
                <span className="font-medium text-navy-deep">Perguntas Frequentes</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link to="/como-funciona" className="flex items-center justify-between bg-white rounded-xl border border-kate-border p-4 hover:border-gold transition">
                <span className="font-medium text-navy-deep">Como Funciona</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link to="/riscos" className="flex items-center justify-between bg-white rounded-xl border border-kate-border p-4 hover:border-gold transition">
                <span className="font-medium text-navy-deep">Aviso de Riscos</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              <Link to="/criterios" className="flex items-center justify-between bg-white rounded-xl border border-kate-border p-4 hover:border-gold transition">
                <span className="font-medium text-navy-deep">Critérios de Seleção</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>

            <div className="mt-8 p-6 bg-navy-deep rounded-xl text-white">
              <h3 className="font-semibold mb-2">Quer captar recursos?</h3>
              <p className="text-white/70 text-sm mb-4">
                Se você tem um projeto e quer captar através da Kate, submeta sua proposta.
              </p>
              <Link to="/captar" className="inline-flex items-center gap-2 bg-gold text-navy-deep px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gold-light transition">
                Submeter Projeto
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Regulamento Page
export function Regulamento() {
  return (
    <div className="min-h-screen bg-kate-bg">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-deep via-navy to-navy-light py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gavel className="w-8 h-8 text-gold" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Regulamento CVM
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Informações sobre a regulamentação do equity crowdfunding no Brasil.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-kate-border p-8 md:p-12">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-navy-deep mb-4">Resolução CVM 88</h2>
              <p className="text-gray-600 mb-6">
                A Kate opera em conformidade com a Resolução CVM nº 88, de 27 de abril de 2022, que regulamenta 
                o crowdfunding de investimento no Brasil. Esta resolução estabelece as regras para a oferta 
                pública de valores mobiliários de sociedades empresárias de pequeno porte.
              </p>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Limites de Captação</h2>
              <p className="text-gray-600 mb-6">
                De acordo com a regulamentação, cada empresa pode captar até R$ 15 milhões por ano através 
                de plataformas de crowdfunding. Empresas com receita bruta anual de até R$ 40 milhões são 
                elegíveis para realizar ofertas.
              </p>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Limites de Investimento</h2>
              <p className="text-gray-600 mb-4">A CVM estabelece limites de investimento para proteção dos investidores:</p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Investidor Comum:</strong> Até R$ 20.000 por ano ou 10% da renda bruta anual (o que for maior)</li>
                <li><strong>Investidor Qualificado:</strong> Sem limite, desde que declare possuir mais de R$ 1 milhão em investimentos</li>
              </ul>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Dispensa de Registro</h2>
              <p className="text-gray-600 mb-6">
                As ofertas realizadas através de plataformas autorizadas estão dispensadas de registro na CVM. 
                Isso não significa que a CVM tenha analisado ou aprovado as ofertas, mas sim que elas seguem 
                o procedimento simplificado previsto na regulamentação.
              </p>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Direitos do Investidor</h2>
              <p className="text-gray-600 mb-4">Como investidor, você tem direito a:</p>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li>Acesso a todas as informações essenciais da oferta antes de investir</li>
                <li>Período de reflexão de 5 dias para desistir do investimento após a confirmação</li>
                <li>Recebimento de relatórios periódicos sobre a empresa investida</li>
                <li>Proteção de dados pessoais conforme a LGPD</li>
              </ul>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Avisos Importantes</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium mb-2">
                      A CVM não garante a veracidade das informações prestadas pelas empresas.
                    </p>
                    <p className="text-amber-700 text-sm">
                      Antes de investir, leia atentamente toda a documentação da oferta, especialmente a 
                      seção de fatores de risco. Investimentos em empresas em estágio inicial envolvem 
                      riscos significativos, incluindo a possibilidade de perda total do capital investido.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-navy-deep mb-4">Links Úteis</h2>
              <ul className="space-y-2">
                <li>
                  <a href="https://www.gov.br/cvm/pt-br" target="_blank" rel="noopener noreferrer" 
                     className="text-gold hover:underline flex items-center gap-2">
                    Site oficial da CVM
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </li>
                <li>
                  <a href="https://conteudo.cvm.gov.br/legislacao/resolucoes/resol088.html" target="_blank" rel="noopener noreferrer" 
                     className="text-gold hover:underline flex items-center gap-2">
                    Texto completo da Resolução CVM 88
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-navy-deep mb-4">Tem dúvidas sobre a regulamentação?</h2>
          <p className="text-gray-600 mb-8">Nossa equipe pode esclarecer suas questões.</p>
          <Link to="/contato" className="inline-flex items-center gap-2 bg-navy-deep text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy transition">
            <Mail className="w-5 h-5" />
            Fale Conosco
          </Link>
        </div>
      </section>
    </div>
  );
}
