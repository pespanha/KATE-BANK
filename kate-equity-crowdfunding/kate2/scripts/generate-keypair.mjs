import { Keypair } from "@stellar/stellar-sdk";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Gerar keypair real
const kp = Keypair.random();
const publicKey = kp.publicKey();
const secretKey = kp.secret();

console.log("\n🔑 Keypair gerado:");
console.log("  Public Key :", publicKey);
console.log("  Secret Key :", secretKey);

// 2. Ativar conta no Testnet via Friendbot
console.log("\n⏳ Ativando conta no Testnet via Friendbot...");

const friendbotUrl = `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`;

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
      res.on("error", reject);
    }).on("error", reject);
  });
}

const { status, body } = await httpsGet(friendbotUrl);

if (status === 200) {
  const parsed = JSON.parse(body);
  const txHash = parsed.hash;
  console.log("  ✅ Conta ativada com sucesso!");
  console.log("  TX Hash  :", txHash);
  console.log("  Explorer : https://stellar.expert/explorer/testnet/tx/" + txHash);

  // 3. Atualizar o .env
  const envPath = path.resolve(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf-8");

  envContent = envContent
    .replace(/STELLAR_KATE_SECRET_KEY="[^"]*"/, `STELLAR_KATE_SECRET_KEY="${secretKey}"`)
    .replace(/STELLAR_KATE_PUBLIC_KEY="[^"]*"/, `STELLAR_KATE_PUBLIC_KEY="${publicKey}"`)
    .replace(/STELLAR_SIMULATION_MODE="[^"]*"/, `STELLAR_SIMULATION_MODE="false"`);

  fs.writeFileSync(envPath, envContent, "utf-8");

  console.log("\n✅ .env atualizado automaticamente!");
  console.log("\n📋 Resumo final:");
  console.log("  STELLAR_KATE_PUBLIC_KEY =", publicKey);
  console.log("  STELLAR_KATE_SECRET_KEY =", secretKey);
  console.log("  STELLAR_SIMULATION_MODE = false");
  console.log("  STELLAR_USE_TESTNET     = true");
  console.log("\n🔗 Conta no explorer: https://stellar.expert/explorer/testnet/account/" + publicKey);
} else {
  console.error("  ❌ Friendbot falhou. Status:", status);
  console.error("  Body:", body);
  process.exit(1);
}
