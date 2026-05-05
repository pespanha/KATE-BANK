/**
 * KASE — Classic Asset Full Flow Test
 * ======================================
 * Simula o fluxo completo de emissão de ativo tokenizado no KASE:
 *
 * Atores:
 *  - ISSUER      → Conta que emite o ativo (ex: empresa captando)
 *  - DISTRIBUTOR → Conta intermediária que recebe e distribui tokens
 *  - INVESTOR    → Investidor que compra os tokens (whitelistado)
 *
 * Fluxo:
 *  1. Gerar 3 keypairs (issuer, distributor, investor)
 *  2. Financiar via Friendbot
 *  3. Issuer seta flags de compliance (AUTH_REQUIRED + REVOCABLE + CLAWBACK)
 *  4. Distributor cria trustline para o ativo
 *  5. Issuer autoriza trustline do distributor (KYC aprovado)
 *  6. Issuer emite 1.000.000 tokens para o distributor
 *  7. Investor cria trustline para o ativo
 *  8. Issuer autoriza trustline do investor (whitelist)
 *  9. Distributor envia 1000 tokens para o investor
 * 10. Verificar saldos finais
 *
 * Rodar: node scripts/test-classic-asset.mjs
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL     = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL   = 'https://friendbot.stellar.org';
const PASSPHRASE      = StellarSdk.Networks.TESTNET;
const ASSET_CODE      = 'KASE01';   // Código do ativo (max 12 chars)
const TOTAL_SUPPLY    = '1000000';  // Total de tokens emitidos
const INVESTOR_AMOUNT = '1000';     // Tokens enviados ao investidor

const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);

/* ── Helpers ── */

async function friendbot(publicKey) {
  process.stdout.write(`  🤖 Friendbot → ${publicKey.substring(0, 10)}...`);
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!res.ok) throw new Error(`Friendbot falhou: ${res.status}`);
  console.log(' ✅');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function buildAndSubmit(sourceAccount, operations, signers, memo = null) {
  let builder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: PASSPHRASE,
  });

  for (const op of operations) builder = builder.addOperation(op);
  if (memo) builder = builder.addMemo(StellarSdk.Memo.text(memo));

  const tx = builder.setTimeout(30).build();
  for (const signer of signers) tx.sign(signer);

  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

async function getBalance(publicKey, assetCode, issuer) {
  const account = await horizon.loadAccount(publicKey);
  const b = account.balances.find(b =>
    b.asset_type !== 'native' &&
    b.asset_code === assetCode &&
    b.asset_issuer === issuer
  );
  return b ? b.balance : '0';
}

/* ── Main ── */

async function main() {
  console.log('\n🏦 KASE — Classic Asset Full Flow Test');
  console.log('=========================================\n');

  // ── 1. Gerar keypairs ──
  console.log('1️⃣  Gerando keypairs...');
  const issuerKp      = StellarSdk.Keypair.random();
  const distributorKp = StellarSdk.Keypair.random();
  const investorKp    = StellarSdk.Keypair.random();

  const asset = new StellarSdk.Asset(ASSET_CODE, issuerKp.publicKey());

  console.log(`  ISSUER      : ${issuerKp.publicKey()}`);
  console.log(`  DISTRIBUTOR : ${distributorKp.publicKey()}`);
  console.log(`  INVESTOR    : ${investorKp.publicKey()}`);
  console.log(`  ASSET CODE  : ${ASSET_CODE}\n`);

  // ── 2. Financiar via Friendbot ──
  console.log('2️⃣  Financiando contas via Friendbot...');
  await friendbot(issuerKp.publicKey());
  await friendbot(distributorKp.publicKey());
  await friendbot(investorKp.publicKey());
  console.log('  ⏳ Aguardando ledger (~5s)...');
  await sleep(5000);
  console.log('');

  // ── 3. Issuer: flags de compliance ──
  console.log('3️⃣  Configurando flags de compliance no issuer...');
  console.log('  (AUTH_REQUIRED + AUTH_REVOCABLE + CLAWBACK_ENABLED)');
  const issuerAccount = await horizon.loadAccount(issuerKp.publicKey());
  const hash3 = await buildAndSubmit(
    issuerAccount,
    [StellarSdk.Operation.setOptions({
      setFlags: (
        StellarSdk.AuthRequiredFlag |
        StellarSdk.AuthRevocableFlag |
        StellarSdk.AuthClawbackEnabledFlag
      ),
    })],
    [issuerKp],
    'KASE compliance flags'
  );
  console.log(`  ✅ Hash: ${hash3}\n`);

  // ── 4. Distributor: criar trustline ──
  console.log('4️⃣  Distributor criando trustline para ' + ASSET_CODE + '...');
  const distributorAccount = await horizon.loadAccount(distributorKp.publicKey());
  const hash4 = await buildAndSubmit(
    distributorAccount,
    [StellarSdk.Operation.changeTrust({ asset })],
    [distributorKp],
    'KASE distributor trustline'
  );
  console.log(`  ✅ Hash: ${hash4}\n`);

  // ── 5. Issuer: autorizar trustline do distributor (KYC) ──
  console.log('5️⃣  Issuer autorizando trustline do distributor (KYC)...');
  const issuerAccount2 = await horizon.loadAccount(issuerKp.publicKey());
  const hash5 = await buildAndSubmit(
    issuerAccount2,
    [StellarSdk.Operation.setTrustLineFlags({
      trustor: distributorKp.publicKey(),
      asset,
      flags: { authorized: true, authorizedToMaintainLiabilities: false },
    })],
    [issuerKp],
    'KASE authorize distributor'
  );
  console.log(`  ✅ Hash: ${hash5}\n`);

  // ── 6. Issuer: emitir tokens para distributor ──
  console.log(`6️⃣  Issuer emitindo ${TOTAL_SUPPLY} ${ASSET_CODE} → distributor...`);
  const issuerAccount3 = await horizon.loadAccount(issuerKp.publicKey());
  const hash6 = await buildAndSubmit(
    issuerAccount3,
    [StellarSdk.Operation.payment({
      destination: distributorKp.publicKey(),
      asset,
      amount: TOTAL_SUPPLY,
    })],
    [issuerKp],
    'KASE token issuance'
  );
  console.log(`  ✅ Hash: ${hash6}\n`);

  // ── 7. Investor: criar trustline ──
  console.log('7️⃣  Investor criando trustline para ' + ASSET_CODE + '...');
  const investorAccount = await horizon.loadAccount(investorKp.publicKey());
  const hash7 = await buildAndSubmit(
    investorAccount,
    [StellarSdk.Operation.changeTrust({ asset })],
    [investorKp],
    'KASE investor trustline'
  );
  console.log(`  ✅ Hash: ${hash7}\n`);

  // ── 8. Issuer: autorizar trustline do investor (whitelist) ──
  console.log('8️⃣  Issuer autorizando investor (whitelist/KYC aprovado)...');
  const issuerAccount4 = await horizon.loadAccount(issuerKp.publicKey());
  const hash8 = await buildAndSubmit(
    issuerAccount4,
    [StellarSdk.Operation.setTrustLineFlags({
      trustor: investorKp.publicKey(),
      asset,
      flags: { authorized: true, authorizedToMaintainLiabilities: false },
    })],
    [issuerKp],
    'KASE whitelist investor'
  );
  console.log(`  ✅ Hash: ${hash8}\n`);

  // ── 9. Distributor: enviar tokens ao investor ──
  console.log(`9️⃣  Distributor enviando ${INVESTOR_AMOUNT} ${ASSET_CODE} → investor...`);
  const distributorAccount2 = await horizon.loadAccount(distributorKp.publicKey());
  const hash9 = await buildAndSubmit(
    distributorAccount2,
    [StellarSdk.Operation.payment({
      destination: investorKp.publicKey(),
      asset,
      amount: INVESTOR_AMOUNT,
    })],
    [distributorKp],
    'KASE investor purchase'
  );
  console.log(`  ✅ Hash: ${hash9}\n`);

  // ── 10. Verificar saldos ──
  await sleep(2000);
  console.log('🔟 Saldos finais:');
  const distBalance = await getBalance(distributorKp.publicKey(), ASSET_CODE, issuerKp.publicKey());
  const invBalance  = await getBalance(investorKp.publicKey(), ASSET_CODE, issuerKp.publicKey());
  console.log(`  DISTRIBUTOR  : ${distBalance} ${ASSET_CODE}`);
  console.log(`  INVESTOR     : ${invBalance} ${ASSET_CODE}`);

  // ── Resumo ──
  console.log('\n🎉 FLUXO COMPLETO EXECUTADO COM SUCESSO!');
  console.log('==========================================');
  console.log(`  Ativo        : ${ASSET_CODE}`);
  console.log(`  Issuer       : ${issuerKp.publicKey()}`);
  console.log(`  Total emitido: ${TOTAL_SUPPLY} tokens`);
  console.log(`  Investidor   : ${INVESTOR_AMOUNT} tokens`);
  console.log(`\n  🔗 Explorer:`);
  console.log(`  https://stellar.expert/explorer/testnet/asset/${ASSET_CODE}-${issuerKp.publicKey()}`);
  console.log('');
}

main().catch(err => {
  console.error('\n❌ Erro:', err?.response?.data?.extras?.result_codes || err.message);
  process.exit(1);
});
