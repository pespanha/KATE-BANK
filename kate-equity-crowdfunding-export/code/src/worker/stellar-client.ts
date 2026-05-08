/**
 * Stellar blockchain client for Kate Equity
 * Supports asset creation, trustlines, and token transfers on Stellar network
 */
import * as StellarSdk from "@stellar/stellar-sdk";

const TESTNET_URL = "https://horizon-testnet.stellar.org";
const MAINNET_URL = "https://horizon.stellar.org";

export interface StellarEnv {
  STELLAR_KATE_SECRET_KEY?: string;
  STELLAR_KATE_PUBLIC_KEY?: string;
  STELLAR_USE_TESTNET?: string;
}

export interface StellarAsset {
  code: string;
  issuer: string;
}

export interface StellarTransferResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface StellarKeypair {
  publicKey: string;
  secretKey: string;
}

export class StellarClient {
  private server: StellarSdk.Horizon.Server;
  private kateKeypair: StellarSdk.Keypair;
  private network: string;
  private isTestnet: boolean;

  constructor(env: StellarEnv) {
    if (!env.STELLAR_KATE_SECRET_KEY) {
      throw new Error("STELLAR_KATE_SECRET_KEY not configured");
    }

    this.isTestnet = env.STELLAR_USE_TESTNET === "true";
    const serverUrl = this.isTestnet ? TESTNET_URL : MAINNET_URL;
    this.server = new StellarSdk.Horizon.Server(serverUrl);
    this.network = this.isTestnet ? StellarSdk.Networks.TESTNET : StellarSdk.Networks.PUBLIC;
    this.kateKeypair = StellarSdk.Keypair.fromSecret(env.STELLAR_KATE_SECRET_KEY);
  }

  private get networkPassphrase(): string {
    return this.network;
  }

  /**
   * Generate a new Stellar keypair for a user
   */
  static generateKeypair(): StellarKeypair {
    const keypair = StellarSdk.Keypair.random();
    return {
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    };
  }

  /**
   * Get the Kate master public key
   */
  getKatePublicKey(): string {
    return this.kateKeypair.publicKey();
  }

  /**
   * Check if connection is working
   */
  async testConnection(): Promise<{ connected: boolean; network: string; katePublicKey: string }> {
    try {
      // Just load account to verify connection works
      await this.server.loadAccount(this.kateKeypair.publicKey());
      return {
        connected: true,
        network: this.isTestnet ? "testnet" : "mainnet",
        katePublicKey: this.kateKeypair.publicKey(),
      };
    } catch (error: any) {
      // Account not found is still a valid connection
      if (error.response?.status === 404) {
        return {
          connected: true,
          network: this.isTestnet ? "testnet" : "mainnet",
          katePublicKey: this.kateKeypair.publicKey(),
        };
      }
      throw error;
    }
  }

  /**
   * Create a project asset (token) on Stellar
   * The asset code is limited to 12 characters
   */
  async createProjectAsset(
    assetCode: string,
    totalSupply: number,
    projectData: {
      projectId: number;
      projectName: string;
      nftUid?: string;
    }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    // Asset code max 12 chars for Stellar
    const code = assetCode.substring(0, 12).toUpperCase();
    
    // Define asset for reference (issuer is Kate)
    const _asset = new StellarSdk.Asset(code, this.kateKeypair.publicKey());
    void _asset; // Asset created implicitly when transferred
    
    // Load Kate account
    const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey());
    
    // Create the asset by setting options (this establishes the asset)
    // The asset is "created" implicitly when we send it to ourselves
    // First, we need to set up the issuer account with the asset
    const transaction = new StellarSdk.TransactionBuilder(kateAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `PROJECT_${projectData.projectId}`,
          value: JSON.stringify({
            asset: code,
            supply: totalSupply,
            name: projectData.projectName,
            nftUid: projectData.nftUid || null,
          }).substring(0, 64),
        })
      )
      .setTimeout(180)
      .build();

    transaction.sign(this.kateKeypair);
    const result = await this.server.submitTransaction(transaction);

    return {
      assetCode: code,
      issuer: this.kateKeypair.publicKey(),
      txHash: result.hash,
    };
  }

  /**
   * Create a trustline for an investor to receive a project's tokens
   * Must be called before transferring tokens to the investor
   */
  async createTrustline(
    investorSecretKey: string,
    assetCode: string,
    issuerPublicKey: string
  ): Promise<{ success: boolean; txHash: string }> {
    const investorKeypair = StellarSdk.Keypair.fromSecret(investorSecretKey);
    const asset = new StellarSdk.Asset(assetCode, issuerPublicKey);
    
    const investorAccount = await this.server.loadAccount(investorKeypair.publicKey());
    
    const transaction = new StellarSdk.TransactionBuilder(investorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: asset,
          limit: "1000000000", // Max tokens the investor can hold
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(investorKeypair);
    const result = await this.server.submitTransaction(transaction);
    
    return {
      success: true,
      txHash: result.hash,
    };
  }

  /**
   * Transfer tokens from Kate to an investor
   */
  async transferTokens(
    investorPublicKey: string,
    assetCode: string,
    amount: number,
    memo?: string
  ): Promise<StellarTransferResult> {
    try {
      const asset = new StellarSdk.Asset(assetCode, this.kateKeypair.publicKey());
      const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey());
      
      let txBuilder = new StellarSdk.TransactionBuilder(kateAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.network,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: investorPublicKey,
            asset: asset,
            amount: amount.toString(),
          })
        )
        .setTimeout(30);

      if (memo) {
        txBuilder = txBuilder.addMemo(StellarSdk.Memo.text(memo.substring(0, 28)));
      }

      const transaction = txBuilder.build();
      transaction.sign(this.kateKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      return {
        success: true,
        txHash: result.hash,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Transfer failed",
      };
    }
  }

  /**
   * Create an NFT-like asset on Stellar
   * Uses a unique asset code and amount of 1
   */
  async createNFT(
    nftCode: string,
    metadata: {
      projectId: number;
      projectName: string;
      verificationUrl: string;
    }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    // NFT code max 12 chars
    const code = nftCode.substring(0, 12).toUpperCase();
    
    const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey());
    
    // Store NFT metadata in manage data
    const transaction = new StellarSdk.TransactionBuilder(kateAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `kate_nft_${metadata.projectId}`,
          value: JSON.stringify({
            name: metadata.projectName.substring(0, 40),
            url: metadata.verificationUrl,
            type: "project_nft",
            created: new Date().toISOString(),
          }),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(this.kateKeypair);
    const result = await this.server.submitTransaction(transaction);
    
    return {
      assetCode: code,
      issuer: this.kateKeypair.publicKey(),
      txHash: result.hash,
    };
  }

  /**
   * Fund a new account with minimum XLM (testnet only via friendbot)
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    if (!this.isTestnet) {
      throw new Error("Friendbot funding only available on testnet");
    }
    
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get account balance for a specific asset
   */
  async getAssetBalance(
    publicKey: string,
    assetCode: string
  ): Promise<string | null> {
    try {
      const account = await this.server.loadAccount(publicKey);
      const balance = account.balances.find(
        (b: any) => b.asset_code === assetCode && b.asset_issuer === this.kateKeypair.publicKey()
      );
      return balance ? (balance as any).balance : null;
    } catch {
      return null;
    }
  }

  /**
   * Get explorer URL for a transaction
   */
  getExplorerUrl(txHash: string): string {
    const baseUrl = this.isTestnet
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
    return `${baseUrl}/tx/${txHash}`;
  }

  /**
   * Get explorer URL for an asset
   */
  getAssetExplorerUrl(assetCode: string): string {
    const baseUrl = this.isTestnet
      ? "https://stellar.expert/explorer/testnet"
      : "https://stellar.expert/explorer/public";
    return `${baseUrl}/asset/${assetCode}-${this.kateKeypair.publicKey()}`;
  }
}

/**
 * Simulated Stellar client for testing without real network
 */
export class SimulatedStellarClient {
  private katePublicKey: string;

  constructor() {
    this.katePublicKey = "GSIM_KATE_PUBLIC_KEY_SIMULATED_000000000000000000";
  }

  static generateKeypair(): StellarKeypair {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    return {
      publicKey: `GSIM_USER_${id}_000000000000000000000000000000000`,
      secretKey: `SSIM_SECRET_${id}_00000000000000000000000000000000`,
    };
  }

  getKatePublicKey(): string {
    return this.katePublicKey;
  }

  async testConnection(): Promise<{ connected: boolean; network: string; katePublicKey: string }> {
    return {
      connected: true,
      network: "simulated",
      katePublicKey: this.katePublicKey,
    };
  }

  async createProjectAsset(
    assetCode: string,
    _totalSupply: number,
    _projectData: { projectId: number; projectName: string; nftUid?: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = assetCode.substring(0, 12).toUpperCase();
    const txHash = `SIM_STELLAR_TX_${code}_${Date.now().toString(36).toUpperCase()}`;
    return {
      assetCode: code,
      issuer: this.katePublicKey,
      txHash,
    };
  }

  async createTrustline(
    _investorSecretKey: string,
    assetCode: string,
    _issuerPublicKey: string
  ): Promise<{ success: boolean; txHash: string }> {
    return {
      success: true,
      txHash: `SIM_STELLAR_TRUSTLINE_${assetCode}_${Date.now().toString(36).toUpperCase()}`,
    };
  }

  async transferTokens(
    _investorPublicKey: string,
    assetCode: string,
    _amount: number,
    _memo?: string
  ): Promise<StellarTransferResult> {
    return {
      success: true,
      txHash: `SIM_STELLAR_TRANSFER_${assetCode}_${Date.now().toString(36).toUpperCase()}`,
    };
  }

  async createNFT(
    nftCode: string,
    _metadata: { projectId: number; projectName: string; verificationUrl: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = nftCode.substring(0, 12).toUpperCase();
    return {
      assetCode: code,
      issuer: this.katePublicKey,
      txHash: `SIM_STELLAR_NFT_${code}_${Date.now().toString(36).toUpperCase()}`,
    };
  }

  async fundTestnetAccount(_publicKey: string): Promise<boolean> {
    return true;
  }

  async getAssetBalance(_publicKey: string, _assetCode: string): Promise<string | null> {
    return "1000";
  }

  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`;
  }

  getAssetExplorerUrl(assetCode: string): string {
    return `https://stellar.expert/explorer/testnet/asset/${assetCode}-${this.katePublicKey}`;
  }
}

/**
 * Factory function to create appropriate Stellar client
 */
export function createStellarClient(env: StellarEnv): StellarClient | SimulatedStellarClient {
  // Use simulated client if no credentials or simulation mode
  if (!env.STELLAR_KATE_SECRET_KEY || (env as any).STELLAR_SIMULATION_MODE === "true") {
    console.log("[Stellar] Using SimulatedStellarClient");
    return new SimulatedStellarClient();
  }

  console.log("[Stellar] Using real StellarClient");
  return new StellarClient(env);
}

/**
 * Debug function to check Stellar configuration
 */
export function getStellarConfigDebug(env: StellarEnv): { hasSecretKey: boolean; hasPublicKey: boolean; isTestnet: boolean } {
  return {
    hasSecretKey: !!env.STELLAR_KATE_SECRET_KEY,
    hasPublicKey: !!env.STELLAR_KATE_PUBLIC_KEY,
    isTestnet: env.STELLAR_USE_TESTNET === "true",
  };
}
