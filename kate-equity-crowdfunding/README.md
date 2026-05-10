# KATE Equity — Plataforma de Equity Crowdfunding

> Plataforma regulada pela **CVM 88** para investimento participativo em startups e PMEs, com tokenização nativa de ativos reais (RWA) na rede **Stellar**.

---

## 🧭 Visão geral

A Kate Equity conecta investidores a empresas em fase de crescimento por meio de tokens de segurança emitidos na blockchain Stellar. Ao término de uma captação bem-sucedida, o investidor recebe **tokens RWA** diretamente em sua carteira Stellar, podendo negociá-los no mural de transações subsequentes da plataforma.

---

## 🗂️ Estrutura do repositório

```
kate-equity-crowdfunding/
├── kate2/                    ← Aplicação principal (Next.js 15 + tRPC)
│   ├── src/
│   │   ├── app/              ← Rotas Next.js (App Router)
│   │   │   ├── page.tsx            Home pública
│   │   │   ├── about/              Sobre, missão, CVM 88
│   │   │   ├── auth/               Login / registro
│   │   │   ├── onboarding/         Cadastro investidor (KYC, suitability)
│   │   │   ├── offers/             Lista e detalhe de ofertas
│   │   │   ├── dashboard/          Dashboard do investidor
│   │   │   ├── portfolio/          Portfólio e posições
│   │   │   ├── secondary/          Mural de transações subsequentes
│   │   │   ├── captar/             Portal de pré-inscrição do emissor
│   │   │   └── admin/              Painel administrativo
│   │   │       ├── page.tsx             KPIs e pendências
│   │   │       ├── ofertas/             Gestão de ofertas
│   │   │       ├── investidores/        Gestão de investidores
│   │   │       ├── emissores/           Gestão de emissores
│   │   │       ├── investimentos/       Reservas e aprovações
│   │   │       │   └── [id]/            Detalhe do investimento
│   │   │       ├── kyc/                 Aprovação de KYC
│   │   │       ├── pagamentos/          Pagamentos e liquidações
│   │   │       ├── tokens/              Emissão de tokens RWA
│   │   │       ├── kpis/                Métricas da plataforma
│   │   │       └── configuracoes/       Configurações gerais
│   │   ├── lib/
│   │   │   ├── trpc/               Backend tRPC
│   │   │   │   ├── routers/
│   │   │   │   │   ├── admin.ts         Operações administrativas
│   │   │   │   │   ├── investors.ts     Reservas, posições, KYC
│   │   │   │   │   ├── issuers.ts       Emissores e captações
│   │   │   │   │   ├── offers.ts        Ofertas públicas
│   │   │   │   │   ├── secondary.ts     Mercado subsequente
│   │   │   │   │   ├── stellar.ts       Integração Stellar SDK
│   │   │   │   │   └── wallet.ts        Carteiras dos usuários
│   │   │   │   └── _app.ts          Router raiz
│   │   │   └── stellar/            Serviços de blockchain
│   │   └── components/             Componentes compartilhados
│   ├── prisma/
│   │   └── schema.prisma       Schema do banco de dados (15 tabelas)
│   ├── scripts/
│   │   └── generate-keypair.mjs  Gera e ativa keypair Stellar no Testnet
│   └── .env                    Variáveis de ambiente (não versionar)
├── code/                     ← Legado React/Vite (referência para migração)
└── README.md                 ← Este arquivo
```

---

## 🧱 Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS + design system Kate |
| Backend API | tRPC v11 |
| ORM / DB | Prisma + SQLite (dev) / PostgreSQL (prod) |
| Auth | Supabase Auth |
| Blockchain | Stellar SDK v15 + Horizon + Testnet |
| Deploy | Vercel |

---

## 🗄️ Schema do banco de dados

15 tabelas cobrindo todos os requisitos CVM 88:

| Tabela | Descrição |
|---|---|
| `User` | Usuários (investidores, emissores, admins) |
| `InvestorProfile` | Tipo, limites CVM, suitability |
| `Wallet` | Carteiras Stellar (custodial/MPC/self) |
| `Issuer` | Empresas emissoras |
| `IssuerController` | Controladores e grupo de controle |
| `Offer` | Ofertas públicas (CVM 88) |
| `OfferDocument` | Documentos regulatórios da oferta |
| `EssentialOfferInfo` | Informações essenciais (Anexo) |
| `Reservation` | Reservas de investimento + escrow |
| `InvestorDeclaration` | Declarações Anexo A/B/C assinadas |
| `TokenAsset` | Tokens RWA emitidos na Stellar |
| `InvestorPosition` | Cap table off-chain por investidor |
| `SecondaryIntention` | Intenções de compra/venda |
| `SecondaryTrade` | Trades bilaterais executados |
| `ComplianceCheck` | Checks de KYC, PLD, suitabilidade |
| `AuditLog` | Trilha de auditoria completa |

---

## ⛓️ Integração Stellar

### Configuração

```bash
# Gerar keypair real e ativar no Testnet via Friendbot
node scripts/generate-keypair.mjs
```

Isso:
1. Gera um keypair criptográfico real (`Keypair.random()`)
2. Ativa a conta no Testnet (Friendbot deposita 10.000 XLM)
3. Atualiza automaticamente o `.env`

### Variáveis de ambiente

```env
DATABASE_URL="file:./dev.db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://seu-projeto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sua-anon-key"

# Stellar
STELLAR_KATE_PUBLIC_KEY="G..."
STELLAR_KATE_SECRET_KEY="S..."
STELLAR_USE_TESTNET="true"
STELLAR_SIMULATION_MODE="false"   # true para dev sem Stellar real
```

### Conta da plataforma (Testnet)

| Campo | Valor |
|---|---|
| Public Key | `GDAIXH3WCJQS326ZQOXEENKZGMGALK6YQ5MUTLXKGBUSHCOEXNKIMHA7` |
| TX Ativação | `8745a9e92c276f2ebae52501a1f002ac6a86b39c9ba39dcea742486065b39e06` |
| Explorer | [stellar.expert/testnet](https://stellar.expert/explorer/testnet/account/GDAIXH3WCJQS326ZQOXEENKZGMGALK6YQ5MUTLXKGBUSHCOEXNKIMHA7) |

---

## 🚀 Rodando localmente

```bash
cd kate2

# Instalar dependências
npm install

# Configurar banco
npx prisma db push
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em: [http://localhost:3000](http://localhost:3000)

---

## 👥 Tipos de usuário

| Tipo | Acesso |
|---|---|
| **Visitante** | Home, ofertas públicas, material didático |
| **Investidor** | Dashboard, portfólio, checkout de investimento, mercado subsequente |
| **Emissor** | Portal de captação (`/captar`), acompanhamento pós-oferta |
| **Admin compliance** | Painel `/admin/*`: KYC, ofertas, investimentos, tokens |
| **Superadmin** | Configurações, chaves, integrações |

---

## 📋 Fluxos críticos implementados

### Investimento primário
1. Investidor faz KYC e cria carteira Stellar → `/onboarding`
2. Explora e seleciona oferta → `/offers/[id]`
3. Reserva com validação CVM (limite anual, suitability) → checkout
4. BRZ fica em escrow programável até encerramento
5. Admin confirma e emite tokens RWA → `/admin/tokens`
6. Token RWA minted/distribuído na carteira Stellar do investidor

### Mercado subsequente
1. Investidor ativo publica intenção de venda → `/secondary`
2. Comprador elegível manifesta interesse
3. Admin valida: titularidade, limite CVM, elegibilidade
4. Swap atômico BRZ ↔ RWA via contrato Soroban
5. Plataforma registra volume/preço para histórico mensal

---

## ⚖️ Compliance CVM 88

- ✅ Limite de R$ 20.000/ano para investidor de varejo
- ✅ Prazo mínimo de desistência de 5 dias
- ✅ Declarações Anexo A/B/C com assinatura e IP
- ✅ Recursos em escrow (não na conta da plataforma)
- ✅ Token RWA só emitido após atingir meta mínima
- ✅ Sem order book, matching automático ou market maker
- ✅ Histórico mensal de preço/volume no mercado subsequente
- ✅ Trilha de auditoria completa (`AuditLog`)
- ✅ Relatórios Anexo G/H automatizados

---

## 📁 Status da migração

| Módulo | Status |
|---|---|
| Home pública | ✅ Completo |
| Auth (login/registro) | ✅ Completo |
| Onboarding investidor (KYC) | ✅ Completo |
| Lista de ofertas | ✅ Completo |
| Detalhe da oferta | ✅ Completo |
| Checkout de investimento | ✅ Completo |
| Dashboard do investidor | ✅ Completo |
| Portfólio | ✅ Completo |
| Mercado subsequente | ✅ Completo |
| Portal do emissor (`/captar`) | ✅ Completo |
| Admin — dashboard | ✅ Completo |
| Admin — ofertas | ✅ Completo |
| Admin — investidores | ✅ Completo |
| Admin — emissores | ✅ Completo |
| Admin — investimentos + detalhe | ✅ Completo |
| Admin — KYC | ✅ Completo |
| Admin — pagamentos | ✅ Completo |
| Admin — tokens RWA | ✅ Completo |
| Admin — KPIs | ✅ Completo |
| Admin — configurações | ✅ Completo |
| Páginas institucionais (`/about`) | ✅ Completo |
| Token Jobs admin | 🔄 Pendente |
| Wizard de submissão emissor | 🔄 Pendente |
| Contratos Soroban (on-chain) | 🔄 Em desenvolvimento |

---

## 🔐 Segurança

- Autenticação via Supabase (JWT)
- tRPC com `protectedProcedure` e `adminProcedure`
- Chaves Stellar protegidas por KMS (nunca expostas ao frontend)
- Variáveis sensíveis apenas no `.env` (listado no `.gitignore`)
- Audit log em toda ação sensível

---

## 📝 Licença

Proprietário — Kate Equity Ltda. Todos os direitos reservados.
