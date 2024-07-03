import { timeStamp } from 'console';
import { binanceSymbol } from '../utils/utils';
import { createSignAndRequest } from "./signer";
import { BinanceBalance } from "./types";
import { BinancePosition } from './types';

//Query account balance info
//https://developers.binance.com/docs/derivatives/usds-margined-futures/account/rest-api/Futures-Account-Balance-V2
export async function getBinanceBalance(){
  const endpoint = '/fapi/v2/balance';
  const queryParams = {
      recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
    //USDT로 검색
      const balance = data.find((account: any) => account.asset === 'USDT') as BinanceBalance;
      return balance.balance;
  }
  return null;
}

// 현재 포지션 정보 조회
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Position-Information-V2
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

// 심볼의 모든 미체결 주문 조회 (Get all open orders on a symbol.)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Current-All-Open-Orders
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

//TODO: 주문 기록 가져오는 함수 (start_time ~ end_time)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/All-Orders
export async function getBinanceAllOrders(startTime : number, endTime : number) {
  const endpoint = '/fapi/v1/allOrders';
  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      recvWindow: '5000',
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      console.log(data);
      return data;
  }
  return null;
}


//Query income history (start_time ~ end_time)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/account/rest-api/Get-Income-History
export async function getBinanceIncomeHis(startTime : number, endTime : number) {
  const endpoint = '/fapi/v1/income';
  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      recvWindow: '5000',
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      console.log(data);
      return data;
  }
  return null;
}