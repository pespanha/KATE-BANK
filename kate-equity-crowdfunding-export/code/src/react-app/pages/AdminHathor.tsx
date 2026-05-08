import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import {
  Wallet,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Coins,
  Image,
  FileJson,
  Settings,
  BookOpen,
  Send,
  Hash,
  Clock
} from "lucide-react";

type TabId = "setup" | "read" | "token" | "nft" | "swagger";

interface ApiResponse {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

export default function AdminHathor() {
  const [activeTab, setActiveTab] = useState<TabId>("setup");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Setup tab state
  const [walletId, setWalletId] = useState("main");
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline" | "checking" | null>(null);

  // Token tab state
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [mintAuthority, setMintAuthority] = useState(true);
  const [meltAuthority, setMeltAuthority] = useState(true);
  const [, setLastTokenUid] = useState("");
  const [mintTokenUid, setMintTokenUid] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [configTokenUid, setConfigTokenUid] = useState("");

  // NFT tab state
  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [nftAmount, setNftAmount] = useState("1");
  const [nftData, setNftData] = useState("");
  const [nftAddress, setNftAddress] = useState("");

  // Swagger tab state
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [swaggerLoading, setSwaggerLoading] = useState(false);

  const tabs = [
    { id: "setup" as TabId, label: "Setup", icon: Settings },
    { id: "read" as TabId, label: "Read", icon: BookOpen },
    { id: "token" as TabId, label: "Token", icon: Coins },
    { id: "nft" as TabId, label: "NFT", icon: Image },
    { id: "swagger" as TabId, label: "Swagger", icon: FileJson },
  ];

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const callApi = async (
    method: "GET" | "POST",
    endpoint: string,
    body?: Record<string, any>
  ) => {
    setLoading(true);
    setResponse(null);

    try {
      const options: RequestInit = {
        method,
        credentials: "include",
      };

      if (body) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      setResponse(data);
      return data;
    } catch (error: any) {
      const errorResponse = { success: false, error: error.message };
      setResponse(errorResponse);
      return errorResponse;
    } finally {
      setLoading(false);
    }
  };

  // Test connection
  const testConnection = async () => {
    setConnectionStatus("checking");
    const data = await callApi("GET", "/api/hathor/health");
    setConnectionStatus(data.ok ? "online" : "offline");
  };

  // Read operations
  const getStatus = () => callApi("GET", "/api/hathor/health");
  const getAddress = () => callApi("GET", "/api/hathor/address/new");
  const getBalance = () => callApi("GET", "/api/hathor/balance");

  // Token operations
  const createToken = async () => {
    if (!tokenName || !tokenSymbol || !tokenAmount) {
      setResponse({ success: false, error: "Preencha nome, símbolo e quantidade" });
      return;
    }
    if (tokenSymbol.length > 5) {
      setResponse({ success: false, error: "Símbolo deve ter no máximo 5 caracteres" });
      return;
    }
    const data = await callApi("POST", "/api/hathor/token/create", {
      name: tokenName,
      symbol: tokenSymbol,
      amount: parseInt(tokenAmount),
      address: tokenAddress || undefined,
      create_mint: mintAuthority,
      create_melt: meltAuthority,
    });
    if (data.hash) {
      setLastTokenUid(data.hash);
      setMintTokenUid(data.hash);
      setConfigTokenUid(data.hash);
    }
  };

  const mintTokens = async () => {
    if (!mintTokenUid || !mintAmount) {
      setResponse({ success: false, error: "Preencha Token UID e quantidade" });
      return;
    }
    await callApi("POST", "/api/hathor/token/mint", {
      token: mintTokenUid,
      amount: parseInt(mintAmount),
      address: mintAddress || undefined,
    });
  };

  const getConfigString = async () => {
    if (!configTokenUid) {
      setResponse({ success: false, error: "Preencha o Token UID" });
      return;
    }
    await callApi("GET", `/api/hathor/token/configuration-string/${configTokenUid}`);
  };

  // NFT operations
  const createNFT = async () => {
    if (!nftName || !nftSymbol || !nftAmount || !nftData) {
      setResponse({ success: false, error: "Preencha todos os campos obrigatórios" });
      return;
    }
    if (nftSymbol.length > 5) {
      setResponse({ success: false, error: "Símbolo deve ter no máximo 5 caracteres" });
      return;
    }
    await callApi("POST", "/api/hathor/nft/create", {
      name: nftName,
      symbol: nftSymbol,
      amount: parseInt(nftAmount),
      data: nftData,
      address: nftAddress || undefined,
    });
  };

  // Load swagger
  const loadSwagger = async () => {
    setSwaggerLoading(true);
    try {
      const res = await fetch("/api/hathor/swagger", { credentials: "include" });
      const data = await res.json();
      if (data.error) {
        setSwaggerSpec(null);
        setResponse({ success: false, error: data.error });
      } else {
        setSwaggerSpec(data);
      }
    } catch (error: any) {
      setSwaggerSpec(null);
      setResponse({ success: false, error: error.message });
    } finally {
      setSwaggerLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "swagger" && !swaggerSpec) {
      loadSwagger();
    }
  }, [activeTab]);

  return (
    <AdminLayout title="API Hathor" subtitle="Integração com Hathor Headless Wallet">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-kate-border mb-6">
        <div className="flex border-b border-kate-border overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-gold text-navy-deep"
                    : "border-transparent text-gray-500 hover:text-navy-deep hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Setup Tab */}
          {activeTab === "setup" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet ID
                </label>
                <input
                  type="text"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                  placeholder="main"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Identificador da wallet central (padrão: main)
                </p>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={testConnection}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Test Connection
                </button>

                {connectionStatus && (
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      connectionStatus === "online"
                        ? "bg-green-100 text-green-700"
                        : connectionStatus === "offline"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {connectionStatus === "online" && (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Online / Ready
                      </>
                    )}
                    {connectionStatus === "offline" && (
                      <>
                        <AlertCircle className="w-4 h-4" />
                        Offline
                      </>
                    )}
                    {connectionStatus === "checking" && (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando...
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-kate-border">
                <p className="text-sm text-gray-600">
                  <strong>Configuração:</strong> A API Hathor está configurada via
                  Secrets do projeto. Verifique se os seguintes secrets estão
                  definidos:
                </p>
                <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                  <li>HATHOR_HEADLESS_BASE_URL</li>
                  <li>HATHOR_HEADLESS_API_KEY</li>
                  <li>HATHOR_HEADLESS_WALLET_ID</li>
                </ul>
              </div>

              {/* Debug info display */}
              {(response?.debug || response?.configDebug) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Diagnóstico de Secrets
                  </h4>
                  {(() => {
                    const debug = response?.debug || response?.configDebug;
                    return debug ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          {debug.hasBaseUrl ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={debug.hasBaseUrl ? "text-green-700" : "text-red-700"}>
                            BASE_URL: {debug.hasBaseUrl ? debug.baseUrlPreview : "NÃO DEFINIDA"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debug.hasApiKey ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className={debug.hasApiKey ? "text-green-700" : "text-red-700"}>
                            API_KEY: {debug.hasApiKey ? `${debug.apiKeyLength} caracteres` : "NÃO DEFINIDA"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {debug.hasWalletId ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                          )}
                          <span className={debug.hasWalletId ? "text-green-700" : "text-yellow-700"}>
                            WALLET_ID: {debug.hasWalletId ? debug.walletIdPreview : "usando padrão 'main'"}
                          </span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {(response?.debug?.hasBaseUrl && response?.debug?.hasApiKey) || (response?.configDebug?.hasBaseUrl && response?.configDebug?.hasApiKey) ? (
                    <p className="mt-3 text-xs text-yellow-700">
                      ⚠️ Secrets configuradas mas ainda recebendo Unauthorized? Verifique se não há espaços extras no valor da API_KEY.
                    </p>
                  ) : null}
                </div>
              )}

              {/* Request debug info */}
              {response?.requestDebug && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Detalhes da Requisição Enviada
                  </h4>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="font-medium text-blue-700">URL:</span>
                      <code className="ml-2 bg-blue-100 px-2 py-0.5 rounded text-blue-800 text-xs">{response.requestDebug.url}</code>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Method:</span>
                      <span className="ml-2">{response.requestDebug.method}</span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-700">Headers enviados:</span>
                      <pre className="mt-1 bg-blue-100 p-2 rounded text-xs text-blue-800 overflow-x-auto">
{JSON.stringify(response.requestDebug.headersPreview, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw response debug */}
              {response?.rawResponse && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4">
                  <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Resposta Raw da API
                  </h4>
                  <pre className="text-xs bg-orange-100 p-2 rounded text-orange-800 overflow-x-auto">
{JSON.stringify(response.rawResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Read Tab */}
          {activeTab === "read" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={getStatus}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Get Status
                </button>
                <button
                  onClick={getAddress}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  Get Address
                </button>
                <button
                  onClick={getBalance}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  Get Balance
                </button>
              </div>
            </div>
          )}

          {/* Token Tab */}
          {activeTab === "token" && (
            <div className="space-y-8">
              {/* Create Token */}
              <div>
                <h3 className="text-lg font-semibold text-navy-deep mb-4">Create Token</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="Meu Token"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Symbol * <span className="text-gray-400">(máx 5 chars)</span>
                    </label>
                    <input
                      type="text"
                      value={tokenSymbol}
                      onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().slice(0, 5))}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="MTK"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valor em cents: 10000 = 100.00
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Address
                    </label>
                    <input
                      type="text"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mintAuthority}
                        onChange={(e) => setMintAuthority(e.target.checked)}
                        className="w-4 h-4 text-gold border-kate-border rounded focus:ring-gold"
                      />
                      <span className="text-sm text-gray-700">Mint Authority</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={meltAuthority}
                        onChange={(e) => setMeltAuthority(e.target.checked)}
                        className="w-4 h-4 text-gold border-kate-border rounded focus:ring-gold"
                      />
                      <span className="text-sm text-gray-700">Melt Authority</span>
                    </label>
                  </div>
                </div>
                <button
                  onClick={createToken}
                  disabled={loading}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-gold text-navy-deep font-semibold rounded-lg hover:bg-gold-hover disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  Create Token
                </button>
              </div>

              {/* Mint Tokens */}
              <div className="border-t border-kate-border pt-8">
                <h3 className="text-lg font-semibold text-navy-deep mb-4">Mint Tokens</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token UID *
                    </label>
                    <input
                      type="text"
                      value={mintTokenUid}
                      onChange={(e) => setMintTokenUid(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="Token UID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destination Address
                    </label>
                    <input
                      type="text"
                      value={mintAddress}
                      onChange={(e) => setMintAddress(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <button
                  onClick={mintTokens}
                  disabled={loading}
                  className="mt-4 flex items-center gap-2 px-6 py-3 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Mint Tokens
                </button>
              </div>

              {/* Configuration String */}
              <div className="border-t border-kate-border pt-8">
                <h3 className="text-lg font-semibold text-navy-deep mb-4">
                  Get Configuration String
                </h3>
                <div className="flex items-end gap-4 max-w-xl">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Token UID
                    </label>
                    <input
                      type="text"
                      value={configTokenUid}
                      onChange={(e) => setConfigTokenUid(e.target.value)}
                      className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                      placeholder="Token UID"
                    />
                  </div>
                  <button
                    onClick={getConfigString}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hash className="w-4 h-4" />}
                    Get Config String
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Cole no Hathor Wallet Desktop em Register Tokens
                </p>
              </div>
            </div>
          )}

          {/* NFT Tab */}
          {activeTab === "nft" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-navy-deep mb-4">Create NFT</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Meu NFT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol * <span className="text-gray-400">(máx 5 chars)</span>
                  </label>
                  <input
                    type="text"
                    value={nftSymbol}
                    onChange={(e) => setNftSymbol(e.target.value.toUpperCase().slice(0, 5))}
                    className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="MNFT"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    value={nftAmount}
                    onChange={(e) => setNftAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Address
                  </label>
                  <input
                    type="text"
                    value={nftAddress}
                    onChange={(e) => setNftAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Opcional"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data * <span className="text-gray-400">(metadados)</span>
                  </label>
                  <textarea
                    value={nftData}
                    onChange={(e) => setNftData(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-kate-border rounded-lg focus:ring-2 focus:ring-gold focus:border-gold"
                    placeholder="Hash SHA-256, IPFS link, ou JSON com metadados"
                  />
                </div>
              </div>
              <button
                onClick={createNFT}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gold text-navy-deep font-semibold rounded-lg hover:bg-gold-hover disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
                Create NFT
              </button>
            </div>
          )}

          {/* Swagger Tab */}
          {activeTab === "swagger" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-navy-deep">
                  Swagger / OpenAPI Spec
                </h3>
                <button
                  onClick={loadSwagger}
                  disabled={swaggerLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-deep text-white rounded-lg hover:bg-navy-deep/90 disabled:opacity-50 transition-colors"
                >
                  {swaggerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Reload
                </button>
              </div>

              {swaggerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : swaggerSpec ? (
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-sm text-green-400 font-mono">
                    {JSON.stringify(swaggerSpec, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                  <FileJson className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Não foi possível carregar a especificação Swagger</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Response Area */}
      <div className="bg-white rounded-xl border border-kate-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-navy-deep flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Response
          </h3>
          {response && (
            <button
              onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : response ? (
          <div
            className={`rounded-lg p-4 overflow-auto max-h-80 ${
              response.success === false || response.error
                ? "bg-red-50 border border-red-200"
                : "bg-gray-900"
            }`}
          >
            <pre
              className={`text-sm font-mono whitespace-pre-wrap ${
                response.success === false || response.error
                  ? "text-red-700"
                  : "text-green-400"
              }`}
            >
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">
            <p>Execute uma operação para ver a resposta aqui</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
