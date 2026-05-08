import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

/**
 * AuthCallback - Legacy OAuth callback page
 * 
 * This page is no longer needed since we use email/password authentication.
 * It now simply redirects authenticated users to the appropriate page
 * or sends unauthenticated users to login.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Verificando autenticação...");

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is authenticated
        const res = await fetch("/api/user-profile", { credentials: "include" });
        
        if (res.ok) {
          const data = await res.json();
          setStatus("Redirecionando...");
          
          if (data.profile?.is_onboarding_complete) {
            // User has completed onboarding, redirect based on role
            if (data.profile.role === "investidor") {
              navigate("/app/investimentos", { replace: true });
            } else {
              navigate("/app/projetos", { replace: true });
            }
          } else {
            // User needs to complete onboarding
            navigate("/onboarding", { replace: true });
          }
        } else {
          // Not authenticated, redirect to login
          navigate("/auth/login", { replace: true });
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setError("Erro ao verificar autenticação. Redirecionando...");
        setTimeout(() => navigate("/auth/login", { replace: true }), 2000);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-kate-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kate-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
        <p className="text-navy-deep font-medium">{status}</p>
      </div>
    </div>
  );
}
