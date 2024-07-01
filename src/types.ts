export interface BinanceAccount {
    apiKey: string;
    secret: string;
  }

export interface OrderlyAccount {
    accountId: string;
    orderlyKey: string;
    privateKeyBase58: string;
    privateKey: Uint8Array;
  }