'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function signUpUser(formData: any) {
  const supabase = await createClient()

  // 1. Supabase Auth signup
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Erro ao criar conta no Supabase' }
  }

  // 2. Prisma sync
  try {
    const user = await prisma.user.create({
      data: {
        id: authData.user.id, // Keep the same ID as Supabase
        email: formData.email,
        password_hash: '[SUPABASE_MANAGED]', // We don't store passwords here
        full_name: formData.fullName,
        cpf: formData.cpf,
        phone: formData.phone,
        birth_date: formData.birthDate ? new Date(formData.birthDate) : null,
        role: 'investor',
        status: 'active',
        investor_profile: {
          create: {
            investor_type: formData.investorType,
            annual_income: Number(formData.annualIncome) || null,
            financial_investments: Number(formData.financialInvestments) || null,
          }
        }
      }
    })

    return { success: true }
  } catch (err: any) {
    console.error('Prisma Error:', err)
    // If Prisma fails, ideally we should delete the Supabase user, but we'd need the service_role key.
    // For now, return an error.
    return { error: 'Erro ao salvar dados no banco de dados local. ' + err.message }
  }
}

export async function signInUser(email: string, pass: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: true }
}
