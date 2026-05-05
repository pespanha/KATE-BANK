/**
 * KASE — Gerar Keypair da Plataforma
 * =====================================
 * Gera um keypair novo para a conta da plataforma KASE,
 * financia via Friendbot no testnet e exibe as chaves.
 *
 * Rodar: node scripts/generate-platform-keypair.mjs
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const FRIENDBOT_URL = 'https://friendbot.stellar.org';

const horizon = new StellarSdk.Horizon.Server(HORIZON_URL);

async function main() {
  console.log('\n🔑 KASE — Gerando Keypair da Plataforma');
  console.log('=========================================\n');

  // 1. Gerar keypair
  const keypair = StellarSdk.Keypair.random();
  console.log('✅ Keypair gerado:');
  console.log(`  Public Key : ${keypair.publicKey()}`);
  console.log(`  Secret Key : ${keypair.secret()}\n`);

  // 2. Financiar via Friendbot
  console.log('🤖 Financiando via Friendbot...');
  const res = await fetch(`${FRIENDBOT_URL}?addr=${keypair.publicKey()}`);
  if (!res.ok) throw new Error(`Friendbot falhou: ${res.status}`);
  console.log('✅ Conta financiada com 10.000 XLM de teste\n');

  // 3. Aguardar ledger
  await new Promise(r => setTimeout(r, 4000));

  // 4. Confirmar saldo
  const account = await horizon.loadAccount(keypair.publicKey());
  const balance = account.balances.find(b => b.asset_type === 'native')?.balance;
  console.log(`💰 Saldo confirmado: ${balance} XLM`);
  console.log(`🔗 https://stellar.expert/explorer/testnet/account/${keypair.publicKey()}\n`);

  // 5. Imprimir bloco para .env
  console.log('📋 Cole isso no seu .env:');
  console.log('─────────────────────────────────────────');
  console.log(`NEXT_PUBLIC_STELLAR_NETWORK=testnet`);
  console.log(`STELLAR_PLATFORM_ACCOUNT_ID=${keypair.publicKey()}`);
  console.log(`STELLAR_PLATFORM_SECRET_KEY=${keypair.secret()}`);
  console.log(`STELLAR_MAX_GAS_STROOPS=1000000`);
  console.log('─────────────────────────────────────────\n');

  // Retornar os valores para uso externo
  process.env._KASE_PUBLIC = keypair.publicKey();
  process.env._KASE_SECRET = keypair.secret();

  // Escrever em arquivo temporário para captura
  const { writeFileSync } = await import('fs');
  writeFileSync(
    'scripts/.generated-keypair.json',
    JSON.stringify({ publicKey: keypair.publicKey(), secretKey: keypair.secret() }, null, 2)
  );
  console.log('✅ Chaves salvas em scripts/.generated-keypair.json (não commitar!)\n');
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
