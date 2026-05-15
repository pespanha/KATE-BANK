'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, User, Lock, Mail, Save, CheckCircle2, AlertTriangle, Shield, Wallet } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { trpc } from '@/lib/trpc/client'

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [fullName, setFullName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Email form
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch user data
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/auth/login')
        return
      }
      setUser(data.user)
      setNewEmail(data.user.email || '')
      setLoading(false)
    })
  }, [router])

  // Fetch profile from DB
  const { data: profile } = trpc.investors.getMyProfile.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  })

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
  }, [profile])

  // Update name
  const updateProfile = trpc.investors.updateMyProfile.useMutation({
    onSuccess: () => {
      setNameMsg({ type: 'success', text: 'Nome atualizado com sucesso!' })
      setTimeout(() => setNameMsg(null), 3000)
      setSavingName(false)
    },
    onError: (err) => {
      setNameMsg({ type: 'error', text: err.message })
      setSavingName(false)
    },
  })

  const handleSaveName = () => {
    if (!fullName.trim()) return
    setSavingName(true)
    setNameMsg(null)
    updateProfile.mutate({ full_name: fullName.trim() })
  }

  // Update email
  const handleSaveEmail = async () => {
    if (!newEmail.trim() || newEmail === user?.email) return
    setSavingEmail(true)
    setEmailMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) {
        setEmailMsg({ type: 'error', text: error.message })
      } else {
        setEmailMsg({ type: 'success', text: 'Email de confirmação enviado para o novo endereço.' })
      }
    } catch {
      setEmailMsg({ type: 'error', text: 'Erro ao atualizar email.' })
    }
    setSavingEmail(false)
  }

  // Update password
  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) return
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setPasswordMsg({ type: 'error', text: error.message })
      } else {
        setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Erro ao alterar senha.' })
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-kate-yellow/30 border-t-kate-yellow rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="text-kate-yellow" /> Configurações
        </h1>
        <p className="text-white/40 text-sm mt-1">Gerencie seu perfil e segurança</p>
      </div>

      {/* Name Section */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-5">
          <User size={16} className="text-kate-yellow" /> Dados Pessoais
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Nome Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-all text-sm"
            />
          </div>
          {nameMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              nameMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {nameMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {nameMsg.text}
            </div>
          )}
          <button
            onClick={handleSaveName}
            disabled={savingName || !fullName.trim()}
            className="flex items-center gap-2 bg-kate-orange text-kate-navy font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {savingName ? 'Salvando...' : 'Salvar Nome'}
          </button>
        </div>
      </div>

      {/* Email Section */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-5">
          <Mail size={16} className="text-kate-yellow" /> Alterar Email
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Email atual</label>
            <p className="text-white/40 text-sm font-mono bg-white/5 px-4 py-3 rounded-xl">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Novo email</label>
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="novo@email.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-all text-sm"
            />
          </div>
          {emailMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              emailMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {emailMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {emailMsg.text}
            </div>
          )}
          <button
            onClick={handleSaveEmail}
            disabled={savingEmail || newEmail === user?.email || !newEmail.trim()}
            className="flex items-center gap-2 bg-kate-orange text-kate-navy font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            {savingEmail ? 'Salvando...' : 'Alterar Email'}
          </button>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-5">
          <Lock size={16} className="text-kate-yellow" /> Alterar Senha
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Nova senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-kate-yellow/50 transition-all text-sm"
            />
          </div>
          {passwordMsg && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
              passwordMsg.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {passwordMsg.text}
            </div>
          )}
          <button
            onClick={handleSavePassword}
            disabled={savingPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 bg-kate-orange text-kate-navy font-bold px-5 py-2.5 rounded-xl text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock size={14} />
            {savingPassword ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>

      {/* Account Info (read-only) */}
      <div className="bg-kate-dark-blue border border-white/10 rounded-2xl p-6">
        <h2 className="font-bold text-white flex items-center gap-2 mb-5">
          <Shield size={16} className="text-kate-yellow" /> Informações da Conta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-white/40 text-xs mb-1">CPF</p>
            <p className="text-white font-medium font-mono">{profile?.cpf || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Função</p>
            <p className="text-white font-medium capitalize">{profile?.role || '—'}</p>
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Perfil de Investidor</p>
            {profile?.investor_profile ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">✓ Completo</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">Pendente</span>
            )}
          </div>
          <div>
            <p className="text-white/40 text-xs mb-1">Membro desde</p>
            <p className="text-white font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
