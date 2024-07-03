import { binanceSymbol } from '../utils/utils';
import { createSignAndRequest } from './signer';

export class placeBinanceOrder {
  private static async placeOrder(queryParams: Record<string, string>) {
    const endpoint = '/fapi/v1/order';
    return await createSignAndRequest(endpoint, queryParams, 'POST');
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

    await this.placeOrder(queryParams);
  }

  public static async marketOrder(side: string, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'MARKET',
      quantity: amount.toString()
    };

    await this.placeOrder(queryParams);
  }
}


//TODO: cancel order 추가
export async function cancelBinanceOrder(orderId: number) {
  const endpoint = '/fapi/v1/order';
  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
    orderId: orderId.toString(),
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}

//Cancel multiple orders
export async function cancelMultipleBinanceOrders(orderIdList: number[]) {
  const endpoint = '/fapi/v1/batchOrders';
  const queryParams = {
    symbol: binanceSymbol,
    orderIdList: JSON.stringify(orderIdList),
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}

//Cancel All Open Orders
export async function cancelAllBinanceOrders() {
  const endpoint = '/fapi/v1/allOpenOrders';
  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
  };

  return await createSignAndRequest(endpoint, queryParams, 'DELETE');
}
