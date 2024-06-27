import { binanceAxios, binanceSymbol, BINANCE_API_URL} from '../utils';
import { BinanceAccount } from '../types';
import { createBinanceSignature } from './binanceCreateSign';
import axios from 'axios';

export async function placeOrder(account: BinanceAccount, side: string, price: number, amount: number) {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/order';
  const baseUrl = 'BINANCE_API_URL';

  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
    side: side,
    type: 'LIMIT',
    timeInForce: 'GTC',
    quantity: amount.toString(),
    price: price.toString(),
    recvWindow: '5000',
    timestamp: timestamp.toString(),
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = await createBinanceSignature(queryString, account.secret);
  const finalQueryString = `${queryString}&signature=${signature}`;

  try {
    const response = await axios.post(`${baseUrl}${endpoint}?${finalQueryString}`, null, {
      headers: {
        'X-MBX-APIKEY': account.apiKey,
      },
    });
    console.log('Binance Order Res:', response.data);
    // return response.data;
  } catch (error) {
    console.error('Error placing Binance order:', error);
  }   
}
