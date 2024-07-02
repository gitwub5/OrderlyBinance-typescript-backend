import axios from 'axios';
import dotenv from 'dotenv';
import { BinanceAccount, OrderlyAccount } from './types';
import bs58 from 'bs58';
import path from 'path';
// import WebSocket from 'ws';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const ORDERLY_API_URL = 'https://api-evm.orderly.org';
export const BINANCE_API_URL = 'https://fapi.binance.com';

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

export const symbol = 'TON/USDT';
export const binanceSymbol = symbol.replace('/', '');
export const orderlySymbol = `PERP_${symbol.split('/')[0]}_USDC`;//Orderly에서 사용하는 symbol 형식
//통합테스트: 주문 크기 5로 설정, 아비트리지 임계앖 0.1 설정
export const orderSize = 5; // 주문 크기 (단위: TON)
export const interval = 30000; // 1분 ->30초 (단위시간)
export const arbitrageThreshold = 0.1; // 아비트리지 허용 임계값 (%)
export const closeThreshold = arbitrageThreshold / 2; //포지션 청산 임계값

export const orderlyAxios = axios.create({
  baseURL: ORDERLY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// export const binanceAxios = axios.create({
//   baseURL: BINANCE_API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export function createOrderlyWebSocket() {
//   return new WebSocket('wss://ws.orderly.network');
// }

// export function createBinanceWebSocket() {
//   return new WebSocket("wss://ws-api.binance.com:443/ws-api/v3");
// }