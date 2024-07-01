export interface BinanceAccount {
    apiKey: string;
    secret: string;
  }

export interface BinanceBalance {
    asset: string;
    free: string;
    locked: string;
  }

export interface OrderlyAccount {
    accountId: string;
    orderlyKey: string;
    privateKeyBase58: string;
    privateKey: Uint8Array;
  }