import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Kate Equity — Demo Seed')
  console.log('──────────────────────────')

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEANUP — Order matters (respect FK constraints)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🗑️  Limpando banco...')
  await prisma.documentAccess.deleteMany()
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
  console.log('✅ Banco limpo.')

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS — Admin + Demo Investors
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👤 Criando usuários...')

  const admin = await prisma.user.create({
    data: {
      email: 'admin@kateequity.com.br',
      password_hash: 'hashed_admin_mock',
      full_name: 'Kate Admin',
      role: 'admin',
    },
  })

  // 8 investors to fill reservations and secondary market
  const investorNames = [
    { name: 'Rafael Mendes',     email: 'rafael@investidor.com' },
    { name: 'Camila Duarte',     email: 'camila@investidor.com' },
    { name: 'Lucas Takahashi',   email: 'lucas@investidor.com' },
    { name: 'Ana Carolina Silva', email: 'anacarolina@investidor.com' },
    { name: 'Pedro Henrique',    email: 'pedro@investidor.com' },
    { name: 'Mariana Costa',     email: 'mariana@investidor.com' },
    { name: 'Bruno Ferreira',    email: 'bruno@investidor.com' },
    { name: 'Juliana Almeida',   email: 'juliana@investidor.com' },
  ]

  const investors = await Promise.all(
    investorNames.map(inv =>
      prisma.user.create({
        data: {
          email: inv.email,
          password_hash: 'hashed_investor_mock',
          full_name: inv.name,
          role: 'investor',
        },
      })
    )
  )

  // Create investor profiles (KYC)
  await Promise.all(
    investors.map(inv =>
      prisma.investorProfile.create({
        data: {
          user_id: inv.id,
          investor_type: 'qualified',
          annual_income: 250000,
          financial_investments: 500000,
          annual_limit: 200000,
          used_limit: 0,
          risk_profile: 'aggressive',
          is_active_investor: true,
        },
      })
    )
  )

  console.log(`✅ ${investors.length + 1} usuários criados.`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ISSUER — Stellar Green Energy (DeepTech Sustentável)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🏢 Criando emissores...')

  const stellarGreen = await prisma.issuer.create({
    data: {
      legal_name: 'Stellar Green Energy S.A.',
      trade_name: 'Stellar Green Energy',
      cnpj: '45.123.456/0001-99',
      legal_type: 'S.A.',
      sector: 'DeepTech Sustentável',
      annual_revenue: 8500000,
      headquarters_address: 'Av. Paulista, 1578 — São Paulo, SP',
      website: 'https://stellargreen.energy',
      status: 'active',
      created_by: admin.id,
    },
  })

  // Controllers
  await prisma.issuerController.createMany({
    data: [
      {
        issuer_id: stellarGreen.id,
        name: 'Dr. Marcos Vieira',
        cpf_cnpj: '111.222.333-44',
        ownership_percentage: 45,
        voting_percentage: 55,
        is_control_group: true,
      },
      {
        issuer_id: stellarGreen.id,
        name: 'Eng. Luísa Tanaka',
        cpf_cnpj: '555.666.777-88',
        ownership_percentage: 30,
        voting_percentage: 25,
        is_control_group: true,
      },
      {
        issuer_id: stellarGreen.id,
        name: 'João Paulo Santos',
        cpf_cnpj: '999.000.111-22',
        ownership_percentage: 25,
        voting_percentage: 20,
        is_control_group: false,
      },
    ],
  })

  // Second issuer for variety
  const bioNova = await prisma.issuer.create({
    data: {
      legal_name: 'BioNova Diagnósticos Ltda.',
      trade_name: 'BioNova Health',
      cnpj: '78.901.234/0001-55',
      legal_type: 'Ltda.',
      sector: 'HealthTech',
      annual_revenue: 3200000,
      headquarters_address: 'Rua Oscar Freire, 900 — São Paulo, SP',
      website: 'https://bionovahealth.com.br',
      status: 'active',
      created_by: admin.id,
    },
  })

  console.log('✅ 2 emissores criados.')

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. OFFERS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📋 Criando ofertas...')

  // ── Offer 1: Stellar Green — ACTIVE (main demo offer)
  const offerGreen = await prisma.offer.create({
    data: {
      issuer_id: stellarGreen.id,
      title: 'Rodada Seed — Usinas Solares Tokenizadas',
      security_type: 'equity',
      status: 'active',
      min_target: 1300000,   // Meta mínima: R$ 1.3M (65% da máxima)
      max_target: 2000000,   // Meta máxima: R$ 2M
      unit_price: 50,        // R$ 50 por token
      min_investment: 500,   // R$ 500 mínimo
      start_date: new Date(Date.now() - 30 * 86400000), // Started 30 days ago
      end_date: new Date(Date.now() + 25 * 86400000),   // Ends in 25 days
      withdrawal_period_days: 5,
      secondary_authorized: true,
      secondary_buyer_scope: 'active_investors',
      primary_contract_address: 'CDLZ...SOROBAN_ESCROW_MOCK',
      rwa_token_address: 'GCSG...RWA_STELLAR_GREEN',
    },
  })

  // ── Offer 2: BioNova — UPCOMING
  const offerBio = await prisma.offer.create({
    data: {
      issuer_id: bioNova.id,
      title: 'Série A — Plataforma de Diagnóstico por IA',
      security_type: 'convertible_debt',
      status: 'upcoming',
      min_target: 3000000,
      max_target: 5000000,
      unit_price: 200,
      min_investment: 1000,
      start_date: new Date(Date.now() + 15 * 86400000),
      end_date: new Date(Date.now() + 90 * 86400000),
      withdrawal_period_days: 7,
      secondary_authorized: false,
    },
  })

  console.log('✅ 2 ofertas criadas.')

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. OFFER DOCUMENTS (Data Room)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📄 Criando documentos...')

  await prisma.offerDocument.createMany({
    data: [
      // Stellar Green — Public docs
      {
        offer_id: offerGreen.id,
        document_type: 'Pitch Deck',
        file_url: '/docs/stellar-green-pitch.pdf',
        is_public: true,
        isPremium: false,
        uploaded_by: admin.id,
      },
      {
        offer_id: offerGreen.id,
        document_type: 'Resumo da Oferta (CVM 88)',
        file_url: '/docs/stellar-green-resumo-cvm88.pdf',
        is_public: true,
        isPremium: false,
        uploaded_by: admin.id,
      },
      // Stellar Green — PREMIUM docs (x402 paywall)
      {
        offer_id: offerGreen.id,
        document_type: 'Contrato Social Completo',
        file_url: '/docs/stellar-green-contrato-social.pdf',
        is_public: false,
        isPremium: true,
        priceXLM: 1.5,
        uploaded_by: admin.id,
      },
      {
        offer_id: offerGreen.id,
        document_type: 'Valuation Report (DCF Detalhado)',
        file_url: '/docs/stellar-green-valuation.pdf',
        is_public: false,
        isPremium: true,
        priceXLM: 2.0,
        uploaded_by: admin.id,
      },
      {
        offer_id: offerGreen.id,
        document_type: 'Due Diligence Jurídica',
        file_url: '/docs/stellar-green-due-diligence.pdf',
        is_public: false,
        isPremium: true,
        priceXLM: 1.0,
        uploaded_by: admin.id,
      },
      // BioNova — just a teaser doc
      {
        offer_id: offerBio.id,
        document_type: 'Teaser de Oportunidade',
        file_url: '/docs/bionova-teaser.pdf',
        is_public: true,
        isPremium: false,
        uploaded_by: admin.id,
      },
    ],
  })

  console.log('✅ 6 documentos criados (3 premium com x402).')

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. RESERVATIONS — 85% captado na Stellar Green (FOMO visual)
  //
  //    Meta máxima: R$ 2.000.000
  //    85% = R$ 1.700.000 → distribute across 8 investors
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('💰 Criando reservas (85% captado = R$ 1.700.000)...')

  const reservationAmounts = [
    350000, // Rafael — big ticket
    280000, // Camila
    250000, // Lucas
    200000, // Ana
    180000, // Pedro
    160000, // Mariana
    150000, // Bruno
    130000, // Juliana
  ] // Total = 1,700,000

  const unitPrice = 50

  await Promise.all(
    reservationAmounts.map((amount, i) =>
      prisma.reservation.create({
        data: {
          offer_id: offerGreen.id,
          investor_id: investors[i].id,
          amount_brz: amount,
          token_quantity: amount / unitPrice,
          unit_price: unitPrice,
          status: 'confirmed',
          confirmed_at: new Date(Date.now() - (20 - i * 2) * 86400000),
          withdrawal_deadline: new Date(Date.now() - (15 - i * 2) * 86400000),
          blockchain_tx_hash: `MOCK_TX_${Date.now()}_${i}`,
        },
      })
    )
  )

  const totalRaised = reservationAmounts.reduce((a, b) => a + b, 0)
  const pct = ((totalRaised / 2000000) * 100).toFixed(1)
  console.log(`✅ ${reservationAmounts.length} reservas: R$ ${totalRaised.toLocaleString('pt-BR')} (${pct}%)`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. TOKEN ASSET + INVESTOR POSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🪙 Criando token e posições...')

  const tokenSGE = await prisma.tokenAsset.create({
    data: {
      issuer_id: stellarGreen.id,
      offer_id: offerGreen.id,
      token_symbol: 'SGE',
      token_name: 'Stellar Green Energy Token',
      token_contract_address: 'GCSG...TOKEN_SGE_TESTNET',
      token_type: 'rwa_security_token',
      total_supply: 40000,   // 2M / 50 = 40,000 tokens
      decimals: 7,
      transfer_restricted: true,
      status: 'active',
    },
  })

  // Create positions for confirmed investors
  await Promise.all(
    reservationAmounts.map((amount, i) =>
      prisma.investorPosition.create({
        data: {
          user_id: investors[i].id,
          issuer_id: stellarGreen.id,
          offer_id: offerGreen.id,
          token_asset_id: tokenSGE.id,
          quantity: amount / unitPrice,
          average_price: unitPrice,
          acquisition_origin: 'primary',
          last_updated_at: new Date(),
        },
      })
    )
  )

  console.log(`✅ Token SGE + ${investors.length} posições.`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SECONDARY INTENTIONS — Mural de Classificados
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📢 Criando intenções no mercado secundário...')

  const secondaryData = [
    // Sell intentions
    { userId: investors[0].id, type: 'sell', qty: 500,  price: 55, daysAgo: 2 },
    { userId: investors[2].id, type: 'sell', qty: 1000, price: 52, daysAgo: 5 },
    { userId: investors[4].id, type: 'sell', qty: 200,  price: 58, daysAgo: 1 },
    { userId: investors[6].id, type: 'sell', qty: 750,  price: 53, daysAgo: 3 },
    // Buy intentions
    { userId: investors[1].id, type: 'buy',  qty: 800,  price: 48, daysAgo: 1 },
    { userId: investors[3].id, type: 'buy',  qty: 300,  price: 50, daysAgo: 0 },
    { userId: investors[5].id, type: 'buy',  qty: 1500, price: 47, daysAgo: 4 },
    { userId: investors[7].id, type: 'buy',  qty: 600,  price: 49, daysAgo: 2 },
  ]

  await Promise.all(
    secondaryData.map(s =>
      prisma.secondaryIntention.create({
        data: {
          token_asset_id: tokenSGE.id,
          user_id: s.userId,
          intention_type: s.type,
          quantity: s.qty,
          price_per_token: s.price,
          total_value: s.qty * s.price,
          status: 'open',
          created_at: new Date(Date.now() - s.daysAgo * 86400000),
          expires_at: new Date(Date.now() + 30 * 86400000),
        },
      })
    )
  )

  console.log(`✅ ${secondaryData.length} intenções (4 venda + 4 compra).`)

  // ═══════════════════════════════════════════════════════════════════════════
  // DONE
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('')
  console.log('══════════════════════════════════════════════')
  console.log('🎉 SEED COMPLETO — Demo pronta para jurados!')
  console.log('──────────────────────────────────────────────')
  console.log(`  🏢 2 emissores (Stellar Green + BioNova)`)
  console.log(`  📋 2 ofertas (1 ativa + 1 upcoming)`)
  console.log(`  👤 8 investidores + 1 admin`)
  console.log(`  💰 R$ ${totalRaised.toLocaleString('pt-BR')} captados (${pct}% da meta)`)
  console.log(`  📄 6 documentos (3 premium x402)`)
  console.log(`  🪙 Token SGE (${(totalRaised / unitPrice).toLocaleString('pt-BR')} tokens emitidos)`)
  console.log(`  📢 8 intenções no mercado secundário`)
  console.log('══════════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
