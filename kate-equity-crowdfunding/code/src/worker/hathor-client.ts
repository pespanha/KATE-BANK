// Hathor Headless Wallet API Client
// All calls to the Hathor API must go through this client to ensure security

interface HathorClientConfig {
  baseUrl: string;
  apiKey: string;
  walletId: string;
}

interface HathorResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

// Wallet status codes
export const WALLET_STATUS = {
  0: { code: 0, label: "Closed", badge: "Offline ❌" },
  1: { code: 1, label: "Connecting", badge: "Connecting ⏳" },
  2: { code: 2, label: "Syncing", badge: "Syncing ⏳" },
  3: { code: 3, label: "Ready", badge: "Online ✅" },
} as const;

export class HathorHeadlessClient {
  private config: HathorClientConfig;

  constructor(config: HathorClientConfig) {
    this.config = config;
  }

  // Debug info for diagnostics
  getRequestDebugInfo(_method: string, path: string): {
    baseUrl: string;
    fullUrl: string;
    apiKeyPreview: string;
    walletId: string;
  } {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return {
      baseUrl: this.config.baseUrl,
      fullUrl: `${this.config.baseUrl}${cleanPath}`,
      apiKeyPreview: this.config.apiKey.substring(0, 8) + "..." + this.config.apiKey.substring(this.config.apiKey.length - 4),
      walletId: this.config.walletId,
    };
  }

  // Base request method with proper error handling
  async request<T = any>(
    method: "GET" | "POST",
    path: string,
    options?: {
      body?: Record<string, any>;
      queryParams?: Record<string, string>;
      walletId?: string;
      returnDebug?: boolean;
    }
  ): Promise<HathorResponse<T>> {
    const { body, queryParams, walletId, returnDebug } = options || {};

    // Build URL with query params - ensure no double slashes
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    let url = `${this.config.baseUrl}${cleanPath}`;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      url += `?${params.toString()}`;
    }

    // Build headers - try lowercase header names as some APIs are case-sensitive
    const headers: Record<string, string> = {
      "x-api-key": this.config.apiKey,
      "x-wallet-id": walletId || this.config.walletId,
    };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    // Debug info
    const debugInfo = {
      url,
      method,
      headersPreview: {
        "x-api-key": this.config.apiKey.substring(0, 8) + "...",
        "x-wallet-id": walletId || this.config.walletId,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check content type
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/html")) {
        return {
          success: false,
          error: "API retornou HTML — verificar URL ou configuração",
          statusCode: response.status,
        };
      }

      // Try to parse JSON
      let data: any;
      let text = "";
      
      try {
        text = await response.text();
      } catch (e: any) {
        return {
          success: false,
          error: `Erro ao ler resposta: ${e.message}`,
          statusCode: response.status,
        };
      }

      // Handle empty responses
      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: "Resposta vazia da API",
          statusCode: response.status,
        };
      }

      try {
        data = JSON.parse(text);
      } catch (parseError: any) {
        return {
          success: false,
          error: `Resposta inválida da API (não é JSON válido): ${text.substring(0, 200)}`,
          statusCode: response.status,
        };
      }

      // Handle WALLET_ALREADY_STARTED as success
      if (data.errorCode === "WALLET_ALREADY_STARTED") {
        return {
          success: true,
          data: { ...data, statusCode: 3, statusMessage: "Ready (wallet already started)" },
          statusCode: response.status,
        };
      }

      // Check if response indicates an error
      if (!response.ok && !data.success) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          data: returnDebug ? { ...data, _debug: debugInfo } : data,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        data: returnDebug ? { ...data, _debug: debugInfo } : data,
        statusCode: response.status,
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Timeout: a requisição excedeu 30 segundos",
        };
      }
      return {
        success: false,
        error: error.message || "Erro desconhecido ao chamar a API Hathor",
      };
    }
  }

  // ============ Health / Status ============
  async getStatus(returnDebug: boolean = false): Promise<HathorResponse<{
    statusCode: number;
    statusMessage: string;
    network: string;
    serverUrl: string;
    serverInfo: any;
    _debug?: any;
  }>> {
    const result = await this.request<any>("GET", "/wallet/status", { returnDebug });
    
    if (result.success && result.data) {
      const status = WALLET_STATUS[result.data.statusCode as keyof typeof WALLET_STATUS];
      return {
        ...result,
        data: {
          ...result.data,
          statusMessage: status?.label || "Unknown",
        },
      };
    }
    return result;
  }

  // ============ Address ============
  async getNewAddress(markAsUsed: boolean = true): Promise<HathorResponse<{ address: string }>> {
    return this.request("GET", "/wallet/address", {
      queryParams: { mark_as_used: String(markAsUsed) },
    });
  }

  // ============ Balance ============
  async getBalance(tokenUid?: string): Promise<HathorResponse<{
    available: number;
    locked: number;
  }>> {
    const queryParams: Record<string, string> = {};
    if (tokenUid) {
      queryParams.token = tokenUid;
    }
    return this.request("GET", "/wallet/balance", { queryParams });
  }

  // ============ Tokens ============
  async createToken(params: {
    name: string;
    symbol: string;
    amount: number;
    address?: string;
    create_mint?: boolean;
    create_melt?: boolean;
  }): Promise<HathorResponse<{
    success: boolean;
    hash: string;
    configurationString: string;
  }>> {
    return this.request("POST", "/wallet/create-token", { body: params });
  }

  async mintTokens(params: {
    token: string;
    amount: number;
    address?: string;
  }): Promise<HathorResponse<{ success: boolean; hash: string }>> {
    return this.request("POST", "/wallet/mint-tokens", { body: params });
  }

  async meltTokens(params: {
    token: string;
    amount: number;
  }): Promise<HathorResponse<{ success: boolean; hash: string }>> {
    return this.request("POST", "/wallet/melt-tokens", { body: params });
  }

  async getConfigurationString(tokenUid: string): Promise<HathorResponse<{
    success: boolean;
    configurationString: string;
  }>> {
    return this.request("GET", "/configuration-string", {
      queryParams: { token: tokenUid },
    });
  }

  // ============ NFTs ============
  async createNFT(params: {
    name: string;
    symbol: string;
    amount: number;
    data: string;
    address?: string;
  }): Promise<HathorResponse<{
    success: boolean;
    hash: string;
    configurationString: string;
  }>> {
    return this.request("POST", "/wallet/create-nft", { body: params });
  }

  // ============ Transfers ============
  async transfer(params: {
    address: string;
    value: number;
    token?: string;
  }): Promise<HathorResponse<{ success: boolean; hash: string }>> {
    return this.request("POST", "/wallet/simple-send-tx", { body: params });
  }

  // Send transaction with multiple outputs (supports data outputs)
  async sendTx(params: {
    outputs: Array<
      | { type: "data"; data: string }
      | { address: string; value: number; token?: string }
    >;
  }): Promise<HathorResponse<{ success: boolean; hash: string }>> {
    return this.request("POST", "/wallet/send-tx", { body: params });
  }

  // ============ History ============
  async getTxHistory(): Promise<HathorResponse<any[]>> {
    return this.request("GET", "/wallet/tx-history");
  }

  async getTxConfirmations(txId: string): Promise<HathorResponse<{
    success: boolean;
    confirmationNumber: number;
  }>> {
    return this.request("GET", "/wallet/tx-confirmation-blocks", {
      queryParams: { id: txId },
    });
  }

  // ============ Swagger ============
  async getSwaggerSpec(): Promise<HathorResponse<any>> {
    // Try multiple paths
    const paths = ["/docs/swagger.json", "/swagger.json", "/openapi.json", "/docs/openapi.json"];
    
    for (const path of paths) {
      const result = await this.request("GET", path);
      if (result.success) {
        return result;
      }
    }
    
    return {
      success: false,
      error: "Não foi possível carregar a especificação Swagger",
    };
  }
}

// Simulated Hathor Client for testing without real credentials
export class SimulatedHathorClient {
  private generateHash(): string {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }

  async getStatus(): Promise<HathorResponse<any>> {
    return {
      success: true,
      data: {
        statusCode: 3,
        statusMessage: "Ready (simulated)",
        network: "testnet",
        serverUrl: "simulated",
        serverInfo: { isSimulated: true }
      }
    };
  }

  async getNewAddress(): Promise<HathorResponse<{ address: string }>> {
    return {
      success: true,
      data: { address: `SIM_ADDR_${this.generateHash().substring(0, 32)}` }
    };
  }

  async getBalance(): Promise<HathorResponse<{ available: number; locked: number }>> {
    return {
      success: true,
      data: { available: 1000000, locked: 0 }
    };
  }

  async createToken(params: { name: string; symbol: string; amount: number }): Promise<HathorResponse<any>> {
    return {
      success: true,
      data: {
        success: true,
        hash: `SIM_TOKEN_TX_${this.generateHash()}`,
        configurationString: `[${params.name}:${params.symbol}:SIM_${this.generateHash().substring(0, 16)}]`
      }
    };
  }

  async createNFT(params: { name: string; symbol: string; amount: number; data: string }): Promise<HathorResponse<any>> {
    const hash = this.generateHash();
    return {
      success: true,
      data: {
        success: true,
        hash: `SIM_NFT_TX_${hash}`,
        nftUid: `SIM_NFT_${hash.substring(0, 32)}`,
        configurationString: `[${params.name}:${params.symbol}:SIM_NFT_${hash.substring(0, 16)}]`
      }
    };
  }

  async transfer(_params: { address: string; value: number; token?: string }): Promise<HathorResponse<any>> {
    return {
      success: true,
      data: {
        success: true,
        hash: `SIM_TRANSFER_${this.generateHash()}`
      }
    };
  }

  async sendTx(_params: { outputs: Array<any> }): Promise<HathorResponse<any>> {
    return {
      success: true,
      data: {
        success: true,
        hash: `SIM_SENDTX_${this.generateHash()}`
      }
    };
  }

  async mintTokens(): Promise<HathorResponse<any>> {
    return { success: true, data: { success: true, hash: `SIM_MINT_${this.generateHash()}` } };
  }

  async meltTokens(): Promise<HathorResponse<any>> {
    return { success: true, data: { success: true, hash: `SIM_MELT_${this.generateHash()}` } };
  }

  async getTxHistory(): Promise<HathorResponse<any[]>> {
    return { success: true, data: [] };
  }

  async getTxConfirmations(): Promise<HathorResponse<any>> {
    return { success: true, data: { success: true, confirmationNumber: 10 } };
  }

  async getConfigurationString(tokenUid: string): Promise<HathorResponse<any>> {
    return { 
      success: true, 
      data: { 
        success: true, 
        configurationString: `[SimToken:SIM:${tokenUid}]` 
      } 
    };
  }

  async getSwaggerSpec(): Promise<HathorResponse<any>> {
    return {
      success: true,
      data: {
        openapi: "3.0.0",
        info: { title: "Simulated Hathor API", version: "1.0.0" },
        paths: {}
      }
    };
  }

  getRequestDebugInfo(): any {
    return { baseUrl: "simulated", fullUrl: "simulated", apiKeyPreview: "SIM", walletId: "simulated" };
  }
}

// Factory function to create client from env
export function createHathorClient(env: {
  HATHOR_HEADLESS_BASE_URL?: string;
  HATHOR_HEADLESS_API_KEY?: string;
  HATHOR_HEADLESS_WALLET_ID?: string;
  HATHOR_SIMULATION_MODE?: string;
}): HathorHeadlessClient | SimulatedHathorClient | null {
  // Check for simulation mode first
  if (env.HATHOR_SIMULATION_MODE === 'true' || env.HATHOR_SIMULATION_MODE === '1') {
    return new SimulatedHathorClient();
  }

  // Trim all values to remove accidental spaces/newlines
  const baseUrl = env.HATHOR_HEADLESS_BASE_URL?.trim();
  const apiKey = env.HATHOR_HEADLESS_API_KEY?.trim();
  const walletId = env.HATHOR_HEADLESS_WALLET_ID?.trim() || "main";

  if (!baseUrl || !apiKey) {
    // Fall back to simulation mode if no credentials
    return new SimulatedHathorClient();
  }

  return new HathorHeadlessClient({
    // Remove trailing slash and ensure clean URL
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    walletId,
  });
}

// Debug helper to verify config (remove after debugging)
export function getHathorConfigDebug(env: {
  HATHOR_HEADLESS_BASE_URL?: string;
  HATHOR_HEADLESS_API_KEY?: string;
  HATHOR_HEADLESS_WALLET_ID?: string;
}): {
  hasBaseUrl: boolean;
  hasApiKey: boolean;
  hasWalletId: boolean;
  baseUrlPreview: string;
  apiKeyLength: number;
  walletIdPreview: string;
} {
  const baseUrl = env.HATHOR_HEADLESS_BASE_URL?.trim() || "";
  const apiKey = env.HATHOR_HEADLESS_API_KEY?.trim() || "";
  const walletId = env.HATHOR_HEADLESS_WALLET_ID?.trim() || "";

  return {
    hasBaseUrl: baseUrl.length > 0,
    hasApiKey: apiKey.length > 0,
    hasWalletId: walletId.length > 0,
    baseUrlPreview: baseUrl.substring(0, 30) + (baseUrl.length > 30 ? "..." : ""),
    apiKeyLength: apiKey.length,
    walletIdPreview: walletId.substring(0, 20) + (walletId.length > 20 ? "..." : ""),
  };
}
