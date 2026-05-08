import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";

/**
 * Component that redirects from legacy /dashboard/* routes to /app/*
 */
export default function LegacyRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Map legacy paths to new paths
    const pathMapping: Record<string, string> = {
      "/dashboard": "/app",
      "/dashboard/oportunidades": "/app/oportunidades",
      "/dashboard/investimentos": "/app/investimentos",
      "/dashboard/projetos": "/app/projetos",
      "/dashboard/carteira": "/app/carteira",
      "/dashboard/captar/submissao": "/app/projetos/novo",
      "/dashboard/configuracoes": "/app/perfil",
    };

    const currentPath = location.pathname;
    const newPath = pathMapping[currentPath] || "/app";
    
    // Preserve query string
    const queryString = location.search;
    
    // Navigate to new path with replace to avoid back button issues
    navigate(newPath + queryString, { replace: true });
  }, [navigate, location]);

  return (
    <div className="min-h-screen bg-kate-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Redirecionando...</p>
      </div>
    </div>
  );
}
