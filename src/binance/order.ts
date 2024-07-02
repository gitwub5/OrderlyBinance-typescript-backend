import { binanceSymbol, BINANCE_API_URL, binanceAccountInfo, symbol, binanceAxios } from '../utils';
import { createBinanceSignature } from './signer';
import axios from 'axios';

export class placeBinanceOrder {
  private static async placeOrder(queryParams: Record<string, string>) {
    const timestamp = Date.now();
    queryParams.timestamp = timestamp.toString();
    queryParams.recvWindow = '5000';

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
    const finalQueryString = `${queryString}&signature=${signature}`;

    try {
      const response = await axios.post(`${BINANCE_API_URL}/fapi/v1/order?${finalQueryString}`, null, {
        headers: {
          'X-MBX-APIKEY': binanceAccountInfo.apiKey,
        },
      });
      //console.log('Binance Order Response:', response.data);
    } catch (error) {
      console.error('Error placing Binance order:', error);
    }
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

  public static async marketOrder( side: string, amount: number) {
    const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      side: side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: amount.toString()
    };

    await this.placeOrder(queryParams);
  }
}

//TODO: cancel order 추가
export async function cancelBinanceOrder(orderId: number) {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/order';
  const baseUrl = BINANCE_API_URL;

  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      orderId: orderId.toString(),
      timestamp: timestamp.toString(),
      recvWindow: '5000'
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
  const finalQueryString = `${queryString}&signature=${signature}`;

  try {
    const response = await axios.delete(`${baseUrl}${endpoint}?${finalQueryString}`, {
        headers: {
            'X-MBX-APIKEY': binanceAccountInfo.apiKey,
        },
    });
    const cancel = response.data;
    //console.log('cancelOrder:', cancel);
  
  } catch(error){
    console.error('Error:', error);
    return null;
    }
}

export async function cancelMultipleBinanceOrders(orderIdList: number[]) {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/batchOrders';
  const baseUrl = BINANCE_API_URL;

  const queryParams = {
      symbol: binanceSymbol,
      orderIdList: JSON.stringify(orderIdList),
      timestamp: timestamp.toString(),
      recvWindow: '5000'
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
  const finalQueryString = `${queryString}&signature=${signature}`;

  try {
    const response = await axios.delete(`${baseUrl}${endpoint}?${finalQueryString}`, {
        headers: {
            'X-MBX-APIKEY': binanceAccountInfo.apiKey,
        },
    });
    const cancelmultiple = response.data;
    //console.log('cancelAllOrders:', cancelmultiple);
  
  } catch(error){
    console.error('Error:', error);
    return null;
    }
}


//Cancel All Open Orders
export async function cancelAllBinanceOrders() {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/allOpenOrders';
  const baseUrl = BINANCE_API_URL;

  const queryParams: Record<string, string> = {
      symbol: binanceSymbol,
      timestamp: timestamp.toString(),
      recvWindow: '5000'
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = await createBinanceSignature(queryString, binanceAccountInfo.secret);
  const finalQueryString = `${queryString}&signature=${signature}`;

  try {
    const response = await axios.delete(`${baseUrl}${endpoint}?${finalQueryString}`, {
        headers: {
            'X-MBX-APIKEY': binanceAccountInfo.apiKey,
        },
    });
    const cancel = response.data;
    //console.log('cancelAllOrders:', cancel);
  
  } catch(error){
    console.error('Error:', error);
    return null;
    }
}