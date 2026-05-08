import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AuthVerificarEmail() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token inválido");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email/${token}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.message || "Email verificado com sucesso!");
        } else {
          setStatus("error");
          setMessage(data.error || "Erro ao verificar email");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Erro de conexão. Tente novamente.");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-zinc-700/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                Verificando email...
              </h1>
              <p className="text-zinc-400">
                Aguarde enquanto confirmamos seu email.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                Email verificado!
              </h1>
              <p className="text-zinc-400 mb-6">{message}</p>
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-medium rounded-lg transition-colors"
              >
                Fazer login
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-xl font-semibold text-white mb-2">
                Falha na verificação
              </h1>
              <p className="text-zinc-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
                >
                  Ir para login
                </Link>
                <p className="text-sm text-zinc-500">
                  Caso o problema persista, entre em contato com o suporte.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-400">
            ← Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
