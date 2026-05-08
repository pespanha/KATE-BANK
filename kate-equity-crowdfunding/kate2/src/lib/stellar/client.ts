/**
 * Stellar blockchain client for Kate Equity
 * Supports asset creation, trustlines, NFTs and token transfers on Stellar network
 * Includes SimulatedStellarClient for development without real credentials
 */
import * as StellarSdk from '@stellar/stellar-sdk'

const TESTNET_URL = 'https://horizon-testnet.stellar.org'
const MAINNET_URL = 'https://horizon.stellar.org'

export interface StellarEnv {
  STELLAR_KATE_SECRET_KEY?: string
  STELLAR_KATE_PUBLIC_KEY?: string
  STELLAR_USE_TESTNET?: string
  STELLAR_SIMULATION_MODE?: string
}

export interface StellarAsset {
  code: string
  issuer: string
}

export interface StellarTransferResult {
  success: boolean
  txHash?: string
  error?: string
}

export interface StellarKeypair {
  publicKey: string
  secretKey: string
}

// ─── Real Stellar Client ──────────────────────────────────────────────────────

export class StellarClient {
  private server: StellarSdk.Horizon.Server
  private kateKeypair: StellarSdk.Keypair
  private network: string
  private isTestnet: boolean

  constructor(env: StellarEnv) {
    if (!env.STELLAR_KATE_SECRET_KEY) {
      throw new Error('STELLAR_KATE_SECRET_KEY not configured')
    }

    this.isTestnet = env.STELLAR_USE_TESTNET !== 'false'
    const serverUrl = this.isTestnet ? TESTNET_URL : MAINNET_URL
    this.server = new StellarSdk.Horizon.Server(serverUrl)
    this.network = this.isTestnet
      ? StellarSdk.Networks.TESTNET
      : StellarSdk.Networks.PUBLIC
    this.kateKeypair = StellarSdk.Keypair.fromSecret(env.STELLAR_KATE_SECRET_KEY)
  }

  static generateKeypair(): StellarKeypair {
    const keypair = StellarSdk.Keypair.random()
    return { publicKey: keypair.publicKey(), secretKey: keypair.secret() }
  }

  getKatePublicKey(): string {
    return this.kateKeypair.publicKey()
  }

  getNetworkInfo(): { isTestnet: boolean; network: string } {
    return { isTestnet: this.isTestnet, network: this.isTestnet ? 'testnet' : 'mainnet' }
  }

  async testConnection(): Promise<{ connected: boolean; network: string; katePublicKey: string }> {
    try {
      await this.server.loadAccount(this.kateKeypair.publicKey())
      return {
        connected: true,
        network: this.isTestnet ? 'testnet' : 'mainnet',
        katePublicKey: this.kateKeypair.publicKey(),
      }
    } catch (error: unknown) {
      const e = error as { response?: { status: number } }
      if (e.response?.status === 404) {
        return {
          connected: true,
          network: this.isTestnet ? 'testnet' : 'mainnet',
          katePublicKey: this.kateKeypair.publicKey(),
        }
      }
      throw error
    }
  }

  /**
   * Create a project security token on Stellar
   * Asset code limited to 12 characters (Stellar spec)
   */
  async createProjectAsset(
    assetCode: string,
    totalSupply: number,
    projectData: { projectId: string; projectName: string; nftUid?: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = assetCode.substring(0, 12).toUpperCase()
    const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey())

    const transaction = new StellarSdk.TransactionBuilder(kateAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `PROJECT_${projectData.projectId.substring(0, 10)}`,
          value: JSON.stringify({
            asset: code,
            supply: totalSupply,
            name: projectData.projectName.substring(0, 40),
            nftUid: projectData.nftUid || null,
          }).substring(0, 64),
        })
      )
      .setTimeout(180)
      .build()

    transaction.sign(this.kateKeypair)
    const result = await this.server.submitTransaction(transaction)

    return { assetCode: code, issuer: this.kateKeypair.publicKey(), txHash: result.hash }
  }

  /**
   * Create a trustline so an investor can receive project tokens
   * Must be called before transferring tokens
   */
  async createTrustline(
    investorSecretKey: string,
    assetCode: string,
    issuerPublicKey: string
  ): Promise<{ success: boolean; txHash: string }> {
    const investorKeypair = StellarSdk.Keypair.fromSecret(investorSecretKey)
    const asset = new StellarSdk.Asset(assetCode, issuerPublicKey)
    const investorAccount = await this.server.loadAccount(investorKeypair.publicKey())

    const transaction = new StellarSdk.TransactionBuilder(investorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset,
          limit: '1000000000',
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(investorKeypair)
    const result = await this.server.submitTransaction(transaction)
    return { success: true, txHash: result.hash }
  }

  /**
   * Transfer tokens from Kate issuer to an investor
   */
  async transferTokens(
    investorPublicKey: string,
    assetCode: string,
    amount: number,
    memo?: string
  ): Promise<StellarTransferResult> {
    try {
      const asset = new StellarSdk.Asset(assetCode, this.kateKeypair.publicKey())
      const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey())

      let txBuilder = new StellarSdk.TransactionBuilder(kateAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.network,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: investorPublicKey,
            asset,
            amount: amount.toString(),
          })
        )
        .setTimeout(30)

      if (memo) {
        txBuilder = txBuilder.addMemo(StellarSdk.Memo.text(memo.substring(0, 28)))
      }

      const transaction = txBuilder.build()
      transaction.sign(this.kateKeypair)
      const result = await this.server.submitTransaction(transaction)
      return { success: true, txHash: result.hash }
    } catch (error: unknown) {
      const e = error as Error
      return { success: false, error: e.message || 'Transfer failed' }
    }
  }

  /**
   * Create an NFT-like unique asset on Stellar for project verification
   */
  async createNFT(
    nftCode: string,
    metadata: { projectId: string; projectName: string; verificationUrl: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = nftCode.substring(0, 12).toUpperCase()
    const kateAccount = await this.server.loadAccount(this.kateKeypair.publicKey())

    const transaction = new StellarSdk.TransactionBuilder(kateAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.network,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: `kate_nft_${metadata.projectId.substring(0, 8)}`,
          value: JSON.stringify({
            name: metadata.projectName.substring(0, 40),
            url: metadata.verificationUrl,
            type: 'project_nft',
            created: new Date().toISOString(),
          }),
        })
      )
      .setTimeout(30)
      .build()

    transaction.sign(this.kateKeypair)
    const result = await this.server.submitTransaction(transaction)
    return { assetCode: code, issuer: this.kateKeypair.publicKey(), txHash: result.hash }
  }

  /**
   * Fund a new account with minimum XLM (Testnet only via Friendbot)
   */
  async fundTestnetAccount(publicKey: string): Promise<boolean> {
    if (!this.isTestnet) throw new Error('Friendbot funding only available on testnet')
    try {
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
      )
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get balance for a specific asset in an account
   */
  async getAssetBalance(publicKey: string, assetCode: string): Promise<string | null> {
    try {
      const account = await this.server.loadAccount(publicKey)
      const balance = account.balances.find(
        (b) =>
          (b as StellarSdk.Horizon.HorizonApi.BalanceLine).asset_type !== 'native' &&
          (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_code === assetCode &&
          (b as StellarSdk.Horizon.HorizonApi.BalanceLineAsset).asset_issuer === this.kateKeypair.publicKey()
      )
      return balance ? balance.balance : null
    } catch {
      return null
    }
  }

  /**
   * Get all balances for an account
   */
  async getAllBalances(publicKey: string): Promise<StellarSdk.Horizon.HorizonApi.BalanceLine[]> {
    try {
      const account = await this.server.loadAccount(publicKey)
      return account.balances
    } catch {
      return []
    }
  }

  getExplorerUrl(txHash: string): string {
    const base = this.isTestnet
      ? 'https://stellar.expert/explorer/testnet'
      : 'https://stellar.expert/explorer/public'
    return `${base}/tx/${txHash}`
  }

  getAssetExplorerUrl(assetCode: string): string {
    const base = this.isTestnet
      ? 'https://stellar.expert/explorer/testnet'
      : 'https://stellar.expert/explorer/public'
    return `${base}/asset/${assetCode}-${this.kateKeypair.publicKey()}`
  }
}

// ─── Simulated Stellar Client (for dev/test without real credentials) ─────────

export class SimulatedStellarClient {
  private katePublicKey: string

  constructor() {
    this.katePublicKey = 'GSIM_KATE_EQUITY_PUBLIC_KEY_SIMULATED_0000000000'
  }

  static generateKeypair(): StellarKeypair {
    const id = Math.random().toString(36).substring(2, 10).toUpperCase()
    return {
      publicKey: `G${id}SIMULATED000000000000000000000000000000000`,
      secretKey: `S${id}SIMULATED000000000000000000000000000000000`,
    }
  }

  getKatePublicKey(): string { return this.katePublicKey }
  getNetworkInfo(): { isTestnet: boolean; network: string } {
    return { isTestnet: true, network: 'simulated' }
  }

  async testConnection(): Promise<{ connected: boolean; network: string; katePublicKey: string }> {
    return { connected: true, network: 'simulated', katePublicKey: this.katePublicKey }
  }

  async createProjectAsset(
    assetCode: string,
    _totalSupply: number,
    _projectData: { projectId: string; projectName: string; nftUid?: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = assetCode.substring(0, 12).toUpperCase()
    return {
      assetCode: code,
      issuer: this.katePublicKey,
      txHash: `SIM_TX_ASSET_${code}_${Date.now().toString(36).toUpperCase()}`,
    }
  }

  async createTrustline(
    _investorSecretKey: string,
    assetCode: string,
    _issuerPublicKey: string
  ): Promise<{ success: boolean; txHash: string }> {
    return {
      success: true,
      txHash: `SIM_TX_TRUST_${assetCode}_${Date.now().toString(36).toUpperCase()}`,
    }
  }

  async transferTokens(
    _investorPublicKey: string,
    assetCode: string,
    _amount: number,
    _memo?: string
  ): Promise<StellarTransferResult> {
    return {
      success: true,
      txHash: `SIM_TX_TRANSFER_${assetCode}_${Date.now().toString(36).toUpperCase()}`,
    }
  }

  async createNFT(
    nftCode: string,
    _metadata: { projectId: string; projectName: string; verificationUrl: string }
  ): Promise<{ assetCode: string; issuer: string; txHash: string }> {
    const code = nftCode.substring(0, 12).toUpperCase()
    return {
      assetCode: code,
      issuer: this.katePublicKey,
      txHash: `SIM_TX_NFT_${code}_${Date.now().toString(36).toUpperCase()}`,
    }
  }

  async fundTestnetAccount(_publicKey: string): Promise<boolean> { return true }

  async getAssetBalance(_publicKey: string, _assetCode: string): Promise<string | null> {
    return '1000'
  }

  async getAllBalances(_publicKey: string): Promise<{ asset_type: string; balance: string; asset_code?: string }[]> {
    return [
      { asset_type: 'native', balance: '100' },
      { asset_type: 'credit_alphanum12', asset_code: 'KATESIM', balance: '1000' },
    ]
  }

  getExplorerUrl(txHash: string): string {
    return `https://stellar.expert/explorer/testnet/tx/${txHash}`
  }

  getAssetExplorerUrl(assetCode: string): string {
    return `https://stellar.expert/explorer/testnet/asset/${assetCode}-${this.katePublicKey}`
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createStellarClient(env: StellarEnv): StellarClient | SimulatedStellarClient {
  if (!env.STELLAR_KATE_SECRET_KEY || env.STELLAR_SIMULATION_MODE === 'true') {
    console.log('[Stellar] Using SimulatedStellarClient')
    return new SimulatedStellarClient()
  }
  console.log('[Stellar] Using real StellarClient on', env.STELLAR_USE_TESTNET !== 'false' ? 'TESTNET' : 'MAINNET')
  return new StellarClient(env)
}

export function getStellarConfigDebug(env: StellarEnv) {
  return {
    hasSecretKey: !!env.STELLAR_KATE_SECRET_KEY,
    hasPublicKey: !!env.STELLAR_KATE_PUBLIC_KEY,
    isTestnet: env.STELLAR_USE_TESTNET !== 'false',
    isSimulated: !env.STELLAR_KATE_SECRET_KEY || env.STELLAR_SIMULATION_MODE === 'true',
  }
}
