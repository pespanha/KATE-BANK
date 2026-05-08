const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({})

async function main() {
  // Create superadmin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@kate.exchange',
      password_hash: 'hashedpassword',
      full_name: 'Kate Admin',
      role: 'superadmin',
      status: 'active'
    }
  })

  // Create investor user
  const investor = await prisma.user.create({
    data: {
      email: 'investor@example.com',
      password_hash: 'hashedpassword',
      full_name: 'John Doe',
      role: 'investor',
      status: 'active'
    }
  })

  // Create issuer
  const issuer = await prisma.issuer.create({
    data: {
      legal_name: 'Stellar Tech LTDA',
      trade_name: 'Stellar37',
      cnpj: '12.345.678/0001-99',
      sector: 'Fintech',
      status: 'approved'
    }
  })

  // Create offer
  const offer = await prisma.offer.create({
    data: {
      issuer_id: issuer.id,
      title: 'Stellar37 Seed Round',
      security_type: 'equity',
      status: 'live',
      min_target: 1000000,
      max_target: 2000000,
      unit_price: 100,
      min_investment: 1000,
      start_date: new Date(),
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      secondary_authorized: true,
      brz_token_address: 'GABRZ...'
    }
  })

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
