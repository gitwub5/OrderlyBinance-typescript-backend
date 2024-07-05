import { binanceSymbol } from '../utils/utils';
import { createSignAndRequest } from './signer';
import { BatchOrder } from './types';

//Send in a new order.
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/New-Order
export class placeBinanceOrder {
  private static async placeOrder(queryParams: Record<string, string>) {
    const endpoint = '/fapi/v1/order';
    const response = await createSignAndRequest(endpoint, queryParams, 'POST');
    return response;
  }

  public static async limitOrder(side: string, price: number, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: amount.toString(),
      price: price.toString(),
    };

    const response = await this.placeOrder(queryParams);
    return response;
  }

  public static async marketOrder(side: string, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'MARKET',
      quantity: amount.toString()
    };

    const response = await this.placeOrder(queryParams);
    return response;
  }
}

//Cancel an active order.
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Cancel-Order
export async function cancelBinanceOrder(orderId: number) {
  const endpoint = '/fapi/v1/order';
  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
    orderId: orderId.toString(),
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}

//Cancel multiple orders
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Cancel-Multiple-Orders
export async function cancelMultipleBinanceOrders(orderIdList: number[]) {
  const endpoint = '/fapi/v1/batchOrders';
  const queryParams = {
    symbol: binanceSymbol,
    orderIdList: JSON.stringify(orderIdList),
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}

//Cancel All Open Orders
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Cancel-All-Open-Orders
export async function cancelAllBinanceOrders() {
  const endpoint = '/fapi/v1/allOpenOrders';
  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}

//Order modify function, currently only LIMIT order modification is supported, modified orders will be reordered in the match queue
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Modify-Order
export async function modifyBinanceOrders(orderId: number, side: string, price: number, amount : number) {
  const endpoint = '/fapi/v1/order';
  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
    orderId: orderId.toString(),
    side: side,
    quantity: amount.toString(),
    price: price.toString(),
  };

  return await createSignAndRequest(endpoint, queryParams, 'PUT');
}

//Modify Multiple Orders (TRADE)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Modify-Multiple-Orders
export async function modifyBinanceBatchOrders(batchOrders: BatchOrder[]) {
  const endpoint = '/fapi/v1/batchOrders';
  const queryParams: Record<string, string> = {
    batchOrders: JSON.stringify(batchOrders),
    recvWindow: '5000',
  };

  const response = await createSignAndRequest(endpoint, queryParams, 'PUT');
  return response;
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

//Check an order's status.
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Query-Order
export async function getOrderStatus(orderId: number) {
  const endpoint = '/fapi/v1/order';
  const queryParams = {
    symbol: binanceSymbol,
    orderId: orderId.toString(),
    recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
    return data.status;
  }
  return null;
}

//TODO: 주문 기록 가져오는 함수 (start_time ~ end_time)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/All-Orders
export async function getBinanceAllOrders(startTime?: number, endTime?: number) {
  const endpoint = '/fapi/v1/allOrders';
  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      recvWindow: '5000',
  };
  if (startTime) {
    queryParams.startTime = startTime.toString();
  }
  if (endTime) {
    queryParams.endTime = endTime.toString();
  }

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      console.log(data);
      return data;
  }
  return null;
}


// async function main() {
//   const position = await getBinanceOpenOrders();
//   console.log(position);
//   const res = await getOrderStatus(1517124565);
//   console.log(res);
// }

// main().catch(error => {
//   console.error('Error in main function:', error);
// });
