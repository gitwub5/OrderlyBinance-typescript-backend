import axios from 'axios';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const ORDERLY_API_URL = 'https://api.orderly.network';
const BINANCE_API_URL = 'https://api.binance.com';

export const orderlyAccount = {
  apiKey: process.env.ORDERLY_API_KEY,
  secret: process.env.ORDERLY_SECRET,
};

export const binanceAccount = {
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_SECRET,
};

export const symbol = 'TON/USDT';
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
