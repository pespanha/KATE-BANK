'use client';

import { useState } from 'react';
import KaseLogo from '@/components/KaseLogo';
import styles from './page.module.css';

const steps = [
  { number: 1, label: 'Dados Pessoais' },
  { number: 2, label: 'Perfil Investidor' },
  { number: 3, label: 'Criar Passkey' },
];

export default function CadastroPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);

  const handleNext = () => { if (currentStep < 3) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleCreatePasskey = () => {
    setCreating(true);
    setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.logoWrap}><a href="/"><KaseLogo variant="full" size="md" /></a></div>
        <h1 className={styles.title}>Crie sua conta</h1>
        <p className={styles.subtitle}>Comece a investir em ativos tokenizados em minutos.</p>

        {/* Progress */}
        <div className={styles.progress}>
          {steps.map((step) => (
            <div key={step.number} className={`${styles.progressStep} ${currentStep >= step.number ? styles.progressActive : ''}`}>
              <div className={styles.progressDot}>{currentStep > step.number ? '✓' : step.number}</div>
              <span className={styles.progressLabel}>{step.label}</span>
            </div>
          ))}
          <div className={styles.progressLine}>
            <div className={styles.progressFill} style={{ width: `${((currentStep - 1) / 2) * 100}%` }} />
          </div>
        </div>

        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nome completo</label>
              <input type="text" className={styles.input} placeholder="Seu nome" defaultValue="Gabriel Oliveira" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} placeholder="seu@email.com" defaultValue="gabriel@email.com" />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>CPF</label>
                <input type="text" className={styles.input} placeholder="000.000.000-00" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Telefone</label>
                <input type="tel" className={styles.input} placeholder="(00) 99999-0000" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Renda anual bruta</label>
              <input type="text" className={styles.input} placeholder="R$ 0,00" defaultValue="R$ 180.000,00" />
              <span className={styles.hint}>Usado para calcular seu limite CVM 88.</span>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Investidor qualificado?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input type="radio" name="qualified" value="no" defaultChecked />
                  <span className={styles.radioMark} />
                  <div>
                    <span className={styles.radioLabel}>Não</span>
                    <span className={styles.radioHint}>Limite de R$ 20.000/ano</span>
                  </div>
                </label>
                <label className={styles.radioOption}>
                  <input type="radio" name="qualified" value="yes" />
                  <span className={styles.radioMark} />
                  <div>
                    <span className={styles.radioLabel}>Sim</span>
                    <span className={styles.radioHint}>Até 10% da renda anterior</span>
                  </div>
                </label>
              </div>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.infoText}>ℹ️ Resolução CVM nº 88/2022: investidores com patrimônio acima de R$ 1M ou certificação CGA/CEA/CNPI são qualificados.</p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.passkeySection}>
              <div className={styles.passkeyVisual}>
                <div className={styles.fingerprint}>{creating ? '✓' : '👆'}</div>
              </div>
              <h3 className={styles.passkeyTitle}>{creating ? 'Wallet criada!' : 'Autenticação Biométrica'}</h3>
              <p className={styles.passkeyDesc}>
                {creating ? 'Smart Wallet criada na Stellar. Redirecionando...' : 'Crie uma Passkey com FaceID, TouchID ou chave de segurança.'}
              </p>
              {!creating && (
                <button className={styles.createPasskeyBtn} onClick={handleCreatePasskey}>🔐 Criar Passkey</button>
              )}
              <div className={styles.passkeyFeatures}>
                <span>🔒 Protegido por hardware</span>
                <span>⚡ Login instantâneo</span>
                <span>🌐 Smart Wallet Stellar</span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.navButtons}>
          {currentStep > 1 && <button className={styles.backBtn} onClick={handleBack}>← Voltar</button>}
          {currentStep < 3 && <button className={styles.nextBtn} onClick={handleNext}>Continuar →</button>}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerText}>Já tem conta?</span>
          <a href="/login" className={styles.footerLink}>Entrar →</a>
        </div>
      </div>
    </div>
  );
}
