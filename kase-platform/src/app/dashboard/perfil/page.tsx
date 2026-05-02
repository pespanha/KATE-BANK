'use client';

import DashboardLayout from '@/components/DashboardLayout';
import ProgressBar from '@/components/ProgressBar';
import { mockUser, formatCurrency } from '@/lib/mock-data';
import styles from './page.module.css';

export default function PerfilPage() {
  const limitPercent = (mockUser.totalInvested / mockUser.investmentLimit) * 100;

  return (
    <DashboardLayout
      title="Perfil"
      breadcrumb={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Perfil' },
      ]}
    >
      <div className={styles.layout}>
        {/* Profile Header */}
        <div className={styles.profileCard}>
          <div className={styles.avatarLg}>{mockUser.avatarInitials}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileName}>{mockUser.name}</h2>
            <span className={styles.profileEmail}>{mockUser.email}</span>
            <div className={styles.badges}>
              <span className={`${styles.kycBadge} ${styles.kycApproved}`}>🛡️ KYC Aprovado</span>
              <span className={styles.typeBadge}>{mockUser.type === 'PF' ? 'Pessoa Física' : mockUser.type === 'PJ' ? 'Pessoa Jurídica' : 'Investidor Qualificado'}</span>
            </div>
          </div>
        </div>

        {/* Two columns */}
        <div className={styles.columns}>
          {/* Left: Personal */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dados Pessoais</h3>
            <div className={styles.fieldList}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Nome</span>
                <span className={styles.fieldValue}>{mockUser.name}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Email</span>
                <span className={styles.fieldValue}>{mockUser.email}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>CPF</span>
                <span className={styles.fieldValue}>{mockUser.cpf}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Telefone</span>
                <span className={styles.fieldValue}>{mockUser.phone}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Membro desde</span>
                <span className={styles.fieldValue}>{mockUser.createdAt}</span>
              </div>
            </div>
          </div>

          {/* Right: Wallet + CVM */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Carteira Stellar</h3>
            <div className={styles.walletCard}>
              <div className={styles.walletRow}>
                <span className={styles.walletLabel}>Endereço</span>
                <div className={styles.walletAddress}>
                  <span className={styles.walletAddr}>{mockUser.stellarAddress}</span>
                  <button className={styles.copyBtn}>📋</button>
                </div>
              </div>
              <div className={styles.walletRow}>
                <span className={styles.walletLabel}>Tipo</span>
                <span className={styles.walletType}>🔐 Smart Wallet (Passkey)</span>
              </div>
              <div className={styles.walletRow}>
                <span className={styles.walletLabel}>Rede</span>
                <span className={styles.walletNetwork}>🌐 Stellar Testnet</span>
              </div>
            </div>

            <h3 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>Limites CVM 88</h3>
            <div className={styles.cvmCard}>
              <div className={styles.cvmRow}>
                <span>Renda anual declarada</span>
                <span className={styles.cvmValue}>{formatCurrency(mockUser.annualIncome)}</span>
              </div>
              <div className={styles.cvmRow}>
                <span>Limite de investimento</span>
                <span className={styles.cvmValue}>{formatCurrency(mockUser.investmentLimit)}</span>
              </div>
              <div className={styles.cvmRow}>
                <span>Utilizado</span>
                <span className={styles.cvmValue}>{formatCurrency(mockUser.totalInvested)}</span>
              </div>
              <ProgressBar value={limitPercent} label="Limite utilizado" size="md" variant={limitPercent > 80 ? 'warning' : 'brand'} />
              <div className={styles.cvmRow}>
                <span>Disponível</span>
                <span className={styles.cvmAvailable}>{formatCurrency(mockUser.investmentLimit - mockUser.totalInvested)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Configurações</h3>
          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div>
                <span className={styles.settingLabel}>Notificações por email</span>
                <span className={styles.settingHint}>Receber atualizações de ofertas e trades</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked /><span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.settingItem}>
              <div>
                <span className={styles.settingLabel}>Notificações de mercado</span>
                <span className={styles.settingHint}>Alertas quando ordens forem executadas</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" defaultChecked /><span className={styles.toggleSlider} />
              </label>
            </div>
            <div className={styles.settingItem}>
              <div>
                <span className={styles.settingLabel}>Relatórios mensais</span>
                <span className={styles.settingHint}>Resumo mensal do portfólio por email</span>
              </div>
              <label className={styles.toggle}>
                <input type="checkbox" /><span className={styles.toggleSlider} />
              </label>
            </div>
          </div>
        </div>

        {/* Passkey Management */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Passkeys</h3>
          <div className={styles.passkeyList}>
            <div className={styles.passkeyItem}>
              <span className={styles.passkeyIcon}>🔐</span>
              <div className={styles.passkeyInfo}>
                <span className={styles.passkeyName}>MacBook Pro — Touch ID</span>
                <span className={styles.passkeyDate}>Criado em 15 Jan 2026</span>
              </div>
              <span className={styles.passkeyStatus}>Ativa</span>
            </div>
            <div className={styles.passkeyItem}>
              <span className={styles.passkeyIcon}>📱</span>
              <div className={styles.passkeyInfo}>
                <span className={styles.passkeyName}>iPhone 16 — Face ID</span>
                <span className={styles.passkeyDate}>Criado em 20 Jan 2026</span>
              </div>
              <span className={styles.passkeyStatus}>Ativa</span>
            </div>
          </div>
          <button className={styles.addPasskey}>+ Adicionar nova Passkey</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
