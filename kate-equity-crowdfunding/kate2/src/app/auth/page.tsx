'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInUser } from '@/app/actions/auth';
import { KateLogo } from '@/components/KateLogo';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const res = await signInUser(email, password);
    
    if (res.error) {
      setMessage(res.error);
      setLoading(false);
    } else {
      router.push('/offers');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--kate-dark-blue) 0%, #0d162a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <KateLogo width={160} mode="white" />
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.75rem', fontSize: '0.875rem' }}>
            Plataforma regulada pela CVM
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '2rem',
        }}>
          <h2 style={{ color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>Entrar na plataforma</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <a href="#" style={{ color: 'var(--kate-yellow)', fontSize: '0.875rem' }}>Esqueceu a senha?</a>
            </div>

            {message && (
              <div style={{
                background: 'rgba(252, 163, 16, 0.15)',
                border: '1px solid rgba(252,163,16,0.4)',
                borderRadius: '8px',
                padding: '0.875rem',
                color: 'var(--kate-yellow)',
                fontSize: '0.875rem',
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '1rem',
                background: 'var(--kate-yellow)',
                color: 'var(--kate-dark-blue)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.8 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Processando...' : 'Entrar na plataforma'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Não tem uma conta?{' '}
            <Link href="/onboarding" style={{ color: 'var(--kate-yellow)' }}>Cadastre-se</Link>
          </p>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: '2rem' }}>
          Regulado pela CVM · Resolução nº 88 · Operações na Stellar
        </p>
      </div>
    </div>
  );
}
