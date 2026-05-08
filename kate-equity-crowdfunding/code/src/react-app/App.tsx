// Main app router
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthProvider";
import Header from "@/react-app/components/Header";
import Footer from "@/react-app/components/Footer";
import LegacyRedirect from "@/react-app/components/LegacyRedirect";
import HomePage from "@/react-app/pages/Home";
import Onboarding from "@/react-app/pages/Onboarding";
import AuthCallback from "@/react-app/pages/AuthCallback";
import AuthLogin from "@/react-app/pages/AuthLogin";
import AuthCadastro from "@/react-app/pages/AuthCadastro";
import AuthEsqueciSenha from "@/react-app/pages/AuthEsqueciSenha";
import AuthVerificarEmail from "@/react-app/pages/AuthVerificarEmail";
import Captar from "@/react-app/pages/Captar";

import Oportunidades from "@/react-app/pages/Oportunidades";
import OfertaDetalhe from "@/react-app/pages/OfertaDetalhe";
import AdminDashboard from "@/react-app/pages/AdminDashboard";
import AdminProjetos from "@/react-app/pages/AdminProjetos";
import AdminProjetoDetalhe from "@/react-app/pages/AdminProjetoDetalhe";
import AdminOfertas from "@/react-app/pages/AdminOfertas";
import AdminOfertaCriar from "@/react-app/pages/AdminOfertaCriar";
import AdminTokens from "@/react-app/pages/AdminTokens";
import AdminKPIs from "@/react-app/pages/AdminKPIs";
import AdminInvestidores from "@/react-app/pages/AdminInvestidores";
import AdminEmissores from "@/react-app/pages/AdminEmissores";
import AdminPagamentos from "@/react-app/pages/AdminPagamentos";
import AdminInvestimentosPendentes from "@/react-app/pages/AdminInvestimentosPendentes";
import AdminInvestimentoDetalhe from "@/react-app/pages/AdminInvestimentoDetalhe";
import AdminConfiguracoes from "@/react-app/pages/AdminConfiguracoes";
import AdminHathor from "@/react-app/pages/AdminHathor";
import AdminKyc from "@/react-app/pages/AdminKyc";
import { Navigate } from "react-router";
import AdminLogin from "@/react-app/pages/AdminLogin";
import AppDashboard from "@/react-app/pages/AppDashboard";
import AppOportunidades from "@/react-app/pages/app/AppOportunidades";
import AppInvestimentos from "@/react-app/pages/app/AppInvestimentos";
import AppCarteira from "@/react-app/pages/app/AppCarteira";
import AppProjetos from "@/react-app/pages/app/AppProjetos";
import AppProjetoDetalhe from "@/react-app/pages/app/AppProjetoDetalhe";
import AppPerfil from "@/react-app/pages/app/AppPerfil";
import AppMensagens from "@/react-app/pages/app/AppMensagens";
import AppInvestimentoDetalhe from "@/react-app/pages/app/AppInvestimentoDetalhe";
import AppDocumentos from "@/react-app/pages/app/AppDocumentos";
import AppProjetoNovo from "@/react-app/pages/app/AppProjetoNovo";
import AppNotificacoes from "@/react-app/pages/app/AppNotificacoes";
import AppConfiguracoes from "@/react-app/pages/app/AppConfiguracoes";
import AppVerificacao from "@/react-app/pages/app/AppVerificacao";
import { ComoFunciona, Sobre, FAQ, Riscos, Termos, Privacidade, Criterios, Taxas, Contato, Regulamento } from "@/react-app/pages/PaginasInstitucionais";

import AppLayout from "@/react-app/components/AppLayout";

// Layout component for pages with header/footer
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth routes - no header/footer */}
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/auth/cadastro" element={<AuthCadastro />} />
          <Route path="/auth/verificar-email/:token" element={<AuthVerificarEmail />} />
          <Route path="/auth/esqueci-senha" element={<AuthEsqueciSenha />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Legacy /dashboard routes - redirect to /app */}
          <Route path="/dashboard" element={<LegacyRedirect />} />
          <Route path="/dashboard/*" element={<LegacyRedirect />} />
          
          {/* Main /app routes with AppLayout */}
          <Route path="/app" element={<AppDashboard />} />
          <Route path="/app/oportunidades" element={<AppLayout title="Oportunidades"><AppOportunidades /></AppLayout>} />
          <Route path="/app/investimentos" element={<AppLayout title="Meus Investimentos"><AppInvestimentos /></AppLayout>} />
          <Route path="/app/investimentos/:id" element={<AppLayout title="Detalhes do Investimento"><AppInvestimentoDetalhe /></AppLayout>} />
          <Route path="/app/carteira" element={<AppLayout title="Carteira" subtitle="Seus tokens e ativos digitais"><AppCarteira /></AppLayout>} />
          <Route path="/app/projetos" element={<AppLayout title="Meus Projetos"><AppProjetos /></AppLayout>} />
          <Route path="/app/projetos/novo" element={<AppProjetoNovo />} />
          <Route path="/app/projetos/:id" element={<AppLayout title="Detalhes do Projeto"><AppProjetoDetalhe /></AppLayout>} />
          <Route path="/app/mensagens" element={<AppLayout title="Mensagens"><AppMensagens /></AppLayout>} />
          <Route path="/app/documentos" element={<AppLayout title="Documentos"><AppDocumentos /></AppLayout>} />
          <Route path="/app/perfil" element={<AppLayout title="Meu Perfil"><AppPerfil /></AppLayout>} />
          <Route path="/app/notificacoes" element={<AppNotificacoes />} />
          <Route path="/app/configuracoes" element={<AppLayout title="Configurações"><AppConfiguracoes /></AppLayout>} />
          
          {/* Public verification page - must be outside /app to be accessible without login */}
          <Route path="/verificacao/:slug" element={<AppVerificacao />} />
          
          {/* Main routes with header/footer */}
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/oportunidades" element={<MainLayout><Oportunidades /></MainLayout>} />
          <Route path="/oferta/:id" element={<MainLayout><OfertaDetalhe /></MainLayout>} />
          <Route path="/como-funciona" element={<MainLayout><ComoFunciona /></MainLayout>} />
          <Route path="/sobre" element={<MainLayout><Sobre /></MainLayout>} />
          <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
          <Route path="/riscos" element={<MainLayout><Riscos /></MainLayout>} />
          <Route path="/termos" element={<MainLayout><Termos /></MainLayout>} />
          <Route path="/privacidade" element={<MainLayout><Privacidade /></MainLayout>} />
          <Route path="/criterios" element={<MainLayout><Criterios /></MainLayout>} />
          <Route path="/taxas" element={<MainLayout><Taxas /></MainLayout>} />
          <Route path="/contato" element={<MainLayout><Contato /></MainLayout>} />
          <Route path="/regulamento" element={<MainLayout><Regulamento /></MainLayout>} />
          <Route path="/submeter-projeto" element={<MainLayout><Captar /></MainLayout>} />
          <Route path="/captar" element={<MainLayout><Captar /></MainLayout>} />
          
          {/* Admin routes - has its own layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/kpis" element={<AdminKPIs />} />
          <Route path="/admin/investidores" element={<AdminInvestidores />} />
          <Route path="/admin/emissores" element={<AdminEmissores />} />
          <Route path="/admin/projetos" element={<AdminProjetos />} />
          <Route path="/admin/projetos/:id" element={<AdminProjetoDetalhe />} />
          <Route path="/admin/ofertas" element={<AdminOfertas />} />
          <Route path="/admin/ofertas/criar" element={<AdminOfertaCriar />} />
          <Route path="/admin/tokens" element={<AdminTokens />} />
          <Route path="/admin/pagamentos" element={<AdminPagamentos />} />
          <Route path="/admin/pendentes" element={<AdminInvestimentosPendentes />} />
          <Route path="/admin/investimentos/:id" element={<AdminInvestimentoDetalhe />} />
          <Route path="/admin/hathor" element={<AdminHathor />} />
          <Route path="/admin/configuracoes" element={<AdminConfiguracoes />} />
          <Route path="/admin/kyc" element={<AdminKyc />} />
          <Route path="/admin/blockchain-logs" element={<Navigate to="/admin/tokens" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
