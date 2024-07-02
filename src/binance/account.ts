import { binanceSymbol } from '../utils';
import { createSignAndRequest } from "./signer";
import { BinanceBalance } from "./types";
import { BinancePosition } from './types';

//API Description: Query account balance info
// API 설명: 계좌 잔액 정보 조회
export async function getBinanceBalance(){
  const endpoint = '/fapi/v2/balance';
  const queryParams = {
      recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      const balance = data.find((account: any) => account.asset === 'USDT') as BinanceBalance;
      return balance.balance;
  }
  return null;
}

// 현재 포지션 정보 조회
export async function getBinancePositions(): Promise<BinancePosition | null> {
  const endpoint = '/fapi/v2/positionRisk';
  const queryParams = {
      symbol: binanceSymbol,
      recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data && Array.isArray(data)) {
      const position = data.find((pos: any) => pos.symbol === binanceSymbol) as BinancePosition;
      return position || null;
  }
  return null;
}

// 심볼의 모든 미체결 주문 조회
export async function getBinanceOpenOrders() {
  const endpoint = '/fapi/v1/openOrders';
  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      recvWindow: '5000',
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      const orderIds = data.map((order: any) => order.orderId);
      return orderIds;
  }
  return null;
}

//TODO: 주문 기록 가져오는 함수