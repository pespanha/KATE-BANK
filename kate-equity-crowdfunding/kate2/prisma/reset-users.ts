/**
 * Script para limpar todos os dados de usuários do banco de dados.
 * Respeita a ordem de foreign keys (deleta dependências primeiro).
 * 
 * Uso: npx tsx prisma/reset-users.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetUsers() {
  console.log('⚠️  Limpando dados de usuários do banco...\n')

  // Ordem: dependências primeiro → tabelas pai por último
  const tables = [
    { name: 'DocumentAccess',      fn: () => prisma.documentAccess.deleteMany() },
    { name: 'AuditLog',            fn: () => prisma.auditLog.deleteMany() },
    { name: 'ComplianceCheck',     fn: () => prisma.complianceCheck.deleteMany() },
    { name: 'SecondaryTrade',      fn: () => prisma.secondaryTrade.deleteMany() },
    { name: 'SecondaryIntention',  fn: () => prisma.secondaryIntention.deleteMany() },
    { name: 'InvestorPosition',    fn: () => prisma.investorPosition.deleteMany() },
    { name: 'Reservation',        fn: () => prisma.reservation.deleteMany() },
    { name: 'InvestorDeclaration', fn: () => prisma.investorDeclaration.deleteMany() },
    { name: 'Wallet',             fn: () => prisma.wallet.deleteMany() },
    { name: 'InvestorProfile',    fn: () => prisma.investorProfile.deleteMany() },
    { name: 'User',               fn: () => prisma.user.deleteMany() },
  ]

  for (const { name, fn } of tables) {
    try {
      const result = await fn()
      console.log(`  ✓ ${name}: ${result.count} registros removidos`)
    } catch (err: any) {
      console.log(`  ✗ ${name}: ${err.message}`)
    }
  }

  console.log('\n✅ Dados de usuários limpos com sucesso!')
  console.log('\n⚠️  IMPORTANTE: Os usuários no Supabase Auth (auth.users) precisam')
  console.log('   ser removidos manualmente no Supabase Dashboard:')
  console.log('   → Authentication → Users → selecionar todos → Delete')
  
  await prisma.$disconnect()
}

resetUsers().catch(console.error)
