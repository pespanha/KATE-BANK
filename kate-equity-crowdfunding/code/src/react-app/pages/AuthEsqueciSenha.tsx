import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function AuthEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Since we use Google OAuth, this is just a placeholder
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-deep via-navy to-navy-light flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link 
          to="/auth/login"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </Link>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-navy-deep px-8 py-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center">
                <span className="text-navy-deep font-bold text-xl">K</span>
              </div>
              <span className="text-2xl font-bold text-white">Kate</span>
            </Link>
            <h1 className="text-xl font-bold text-white mb-2">Recuperar acesso</h1>
            <p className="text-white/70 text-sm">
              Vamos ajudar você a acessar sua conta
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {!submitted ? (
              <>
                {/* Info box about Google OAuth */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      Login via Google
                    </p>
                    <p className="text-xs text-blue-700">
                      A Kate usa autenticação via Google. Se você não consegue acessar, 
                      tente recuperar sua conta Google diretamente no{" "}
                      <a 
                        href="https://accounts.google.com/signin/recovery" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Google Account Recovery
                      </a>.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-kate-border focus:border-gold focus:ring-2 focus:ring-gold/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-gold hover:bg-gold-hover text-navy-deep font-bold rounded-xl transition-colors"
                  >
                    Verificar conta
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-navy-deep mb-2">
                  Verifique seu email
                </h2>
                <p className="text-gray-600 mb-6">
                  Se existe uma conta associada a <strong>{email}</strong>, 
                  você receberá instruções para recuperar o acesso.
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Como usamos autenticação via Google, recomendamos que você 
                  tente fazer login novamente ou recupere sua conta Google 
                  se necessário.
                </p>
                <Link
                  to="/auth/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy-deep hover:bg-navy text-white font-semibold rounded-xl transition-colors"
                >
                  Voltar para login
                </Link>
              </div>
            )}

            {/* Help */}
            {!submitted && (
              <div className="mt-6 pt-6 border-t border-kate-border text-center">
                <p className="text-sm text-gray-600 mb-2">Precisa de ajuda?</p>
                <a 
                  href="mailto:suporte@kate.com.br"
                  className="text-gold-hover font-medium hover:underline"
                >
                  Fale com nosso suporte
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
