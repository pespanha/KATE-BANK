import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KASE — Kate Assets Stellar Exchange",
  description:
    "Plataforma de investimentos tokenizados na blockchain Stellar. Compre e venda ações, dívidas e recebíveis com segurança e transparência. Cada investimento é um caso de sucesso.",
  keywords: [
    "investimentos",
    "crowdfunding",
    "tokenização",
    "blockchain",
    "stellar",
    "ações",
    "equity",
    "CVM",
    "fintech",
  ],
  openGraph: {
    title: "KASE — Kate Assets Stellar Exchange",
    description:
      "Invista em ativos tokenizados com segurança. Cada investimento é um caso de sucesso.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
