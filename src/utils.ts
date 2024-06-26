import axios from 'axios';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { BinanceAccount, OrderlyAccount } from './types';
import crypto from 'crypto';

dotenv.config();

export const ORDERLY_API_URL = 'https://api-evm.orderly.org';
export const BINANCE_API_URL = 'https://fapi.binance.com';

export const orderlyAccountInfo : OrderlyAccount = {
  apiKey: process.env.ORDERLY_API_KEY as string,
  secret: process.env.ORDERLY_SECRET as string,
  accountId: process.env.ORDERLY_ACCOUNT_ID as string,
};

export const binanceAccountInfo : BinanceAccount = {
  apiKey: process.env.BINANCE_API_KEY as string,
  secret: process.env.BINANCE_SECRET as string,
};

export const symbol = 'TON/USDT';
export const binanceSymbol = symbol.replace('/', '');
export const orderlySymbol = `PERP_${symbol.split('/')[0]}_USDC`;//Orderly에서 사용하는 symbol 형식
export const orderSize = 10; // 주문 크기 (단위: TON)
export const interval = 60000; // 1분 (단위시간)
export const arbitrageThreshold = 0.5; // 아비트리지 허용 임계값 (%)

export const orderlyAxios = axios.create({
  baseURL: ORDERLY_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const binanceAxios = axios.create({
  baseURL: BINANCE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function createOrderlyWebSocket() {
  return new WebSocket('wss://ws.orderly.network');
}

export function createBinanceWebSocket() {
  return new WebSocket('wss://stream.binance.com:9443/ws');
}