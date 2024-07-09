import dotenv from 'dotenv';
import { BinanceAccount, OrderlyAccount } from '../types/accountTypes';
import bs58 from 'bs58';

dotenv.config();

export const ORDERLY_API_URL = 'https://api-evm.orderly.org';
export const BINANCE_API_URL = 'https://fapi.binance.com';
export const WS_PUBLIC_URL = 'wss://ws-evm.orderly.org/ws/stream/';

const privateKeyBase58 = (process.env.ORDERLY_SECRET as string).replace("ed25519:", "");
const privateKey = bs58.decode(privateKeyBase58);

export const orderlyAccountInfo : OrderlyAccount = {
  orderlyKey: process.env.ORDERLY_API_KEY as string,
  privateKeyBase58: privateKeyBase58,
  privateKey : privateKey,
  accountId: process.env.ORDERLY_ACCOUNT_ID as string,
};

export const binanceAccountInfo : BinanceAccount = {
  apiKey: process.env.BINANCE_API_KEY as string,
  secret: process.env.BINANCE_SECRET as string,
};

export const userWalletAddress = process.env.METAMASK_WALLET_ADDRESS as string;