/**
 * KASE — Stellar Testnet Smoke Test
 * ====================================
 * 1. Gera dois keypairs novos (sender / receiver)
 * 2. Financia ambos via Friendbot (gratuito no testnet)
 * 3. Constrói uma transação de Payment de 10 XLM
 * 4. Assina com a secretKey do sender
 * 5. Submete ao testnet
 * 6. Imprime o hash da transação
 *
 * Rodar: node scripts/test-stellar.mjs
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);

/* ── Helpers ── */

async function fundWithFriendbot(publicKey) {
  console.log(`  🤖 Friendbot financiando: ${publicKey}`);
  const res = await fetch(`${FRIENDBOT_URL}?addr=${publicKey}`);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Friendbot falhou: ${res.status} — ${body}`);
  }
  console.log(`  ✅ Conta financiada com 10.000 XLM de teste`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── Main ── */

async function main() {
  console.log('\n🚀 KASE — Stellar Testnet Smoke Test');
  console.log('=====================================\n');

  // 1. Gerar keypairs
  console.log('1️⃣  Gerando keypairs...');
  const senderKeypair = StellarSdk.Keypair.random();
  const receiverKeypair = StellarSdk.Keypair.random();

  console.log(`  Sender  Public : ${senderKeypair.publicKey()}`);
  console.log(`  Sender  Secret : ${senderKeypair.secret()}`);
  console.log(`  Receiver Public: ${receiverKeypair.publicKey()}\n`);

  // 2. Financiar via Friendbot
  console.log('2️⃣  Financiando contas via Friendbot...');
  await fundWithFriendbot(senderKeypair.publicKey());
  await fundWithFriendbot(receiverKeypair.publicKey());
  console.log('');

  // Aguarda ledger confirmar
  console.log('⏳ Aguardando confirmação do ledger (~5s)...');
  await sleep(5000);

  // 3. Carregar conta do sender
  console.log('3️⃣  Carregando conta do sender no Horizon...');
  const senderAccount = await horizon.loadAccount(senderKeypair.publicKey());
  const balanceBefore = senderAccount.balances.find(b => b.asset_type === 'native')?.balance;
  console.log(`  Saldo antes: ${balanceBefore} XLM\n`);

  // 4. Construir transação de Payment (10 XLM)
  console.log('4️⃣  Construindo transação de Payment de 10 XLM...');
  const tx = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: receiverKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: '10',
      })
    )
    .addMemo(StellarSdk.Memo.text('KASE smoke test'))
    .setTimeout(30)
    .build();

  // 5. Assinar com a secretKey do sender
  console.log('5️⃣  Assinando com secretKey do sender...');
  tx.sign(senderKeypair);
  console.log(`  XDR: ${tx.toXDR().substring(0, 60)}...\n`);

  // 6. Submeter ao testnet
  console.log('6️⃣  Submetendo ao Stellar testnet...');
  const result = await horizon.submitTransaction(tx);

  // 7. Resultado
  console.log('\n🎉 TRANSAÇÃO CONFIRMADA!');
  console.log('========================');
  console.log(`  Hash  : ${result.hash}`);
  console.log(`  Ledger: ${result.ledger}`);
  console.log(`  Link  : https://stellar.expert/explorer/testnet/tx/${result.hash}`);

  // Verificar saldo do receiver
  await sleep(2000);
  const receiverAccount = await horizon.loadAccount(receiverKeypair.publicKey());
  const receiverBalance = receiverAccount.balances.find(b => b.asset_type === 'native')?.balance;
  console.log(`\n  Saldo receiver após: ${receiverBalance} XLM`);
  console.log('\n✅ Smoke test concluído com sucesso!\n');
}

main().catch((err) => {
  console.error('\n❌ Erro:', err.message || err);
  process.exit(1);
});
