import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')
  
  // Clean up existing data to avoid unique constraint errors during multiple seeds
  await prisma.secondaryTrade.deleteMany()
  await prisma.secondaryIntention.deleteMany()
  await prisma.investorPosition.deleteMany()
  await prisma.tokenAsset.deleteMany()
  await prisma.investorDeclaration.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.essentialOfferInfo.deleteMany()
  await prisma.offerDocument.deleteMany()
  await prisma.offer.deleteMany()
  await prisma.issuerController.deleteMany()
  await prisma.issuer.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.investorProfile.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.complianceCheck.deleteMany()
  await prisma.user.deleteMany()

  // 1. Create a User (Issuer Creator)
  const creator = await prisma.user.create({
    data: {
      email: 'admin@kateequity.com',
      password_hash: 'hashed_password_mock',
      full_name: 'Kate Admin',
      role: 'admin',
    }
  })

  // 2. Create Issuers
  const issuer1 = await prisma.issuer.create({
    data: {
      legal_name: 'Tech Inovadora S.A.',
      trade_name: 'InovaTech',
      cnpj: '12345678000199',
      sector: 'Tecnologia',
      created_by: creator.id,
      status: 'active'
    }
  })

  const issuer2 = await prisma.issuer.create({
    data: {
      legal_name: 'Energia Limpa S.A.',
      trade_name: 'SolarBR',
      cnpj: '98765432000188',
      sector: 'Energia',
      created_by: creator.id,
      status: 'active'
    }
  })

  // 3. Create Offers
  const offer1 = await prisma.offer.create({
    data: {
      issuer_id: issuer1.id,
      title: 'Rodada Seed InovaTech',
      security_type: 'equity',
      status: 'active',
      min_target: 1000000,
      max_target: 2500000,
      unit_price: 1000,
      min_investment: 5000,
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      secondary_authorized: true,
      rwa_token_address: 'GCOXXXXXYYYYYZZZZZ'
    }
  })

  const offer2 = await prisma.offer.create({
    data: {
      issuer_id: issuer2.id,
      title: 'Rodada Série A SolarBR',
      security_type: 'convertible_debt',
      status: 'upcoming',
      min_target: 5000000,
      max_target: 10000000,
      unit_price: 5000,
      min_investment: 25000,
      start_date: new Date(new Date().setDate(new Date().getDate() + 15)),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      secondary_authorized: false,
    }
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
