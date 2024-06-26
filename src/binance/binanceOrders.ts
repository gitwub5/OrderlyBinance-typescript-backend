import { binanceAxios, binanceSymbol} from '../utils';
import { BinanceAccount } from '../types';
import { createBinanceSignature } from './binanceCreateSign';


export async function placeOrder(account: BinanceAccount, side: string, price: number, amount: number) {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/order';

  const queryParams: Record<string, string> = {
    symbol: binanceSymbol,
    side: side,
    type: 'LIMIT',
    price: price.toString(),
    quantity: amount.toString(),
    timestamp: timestamp.toString(),
    recvWindow: '5000',
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const signature = createBinanceSignature(queryString, account.secret);
  const finalQueryString = `${queryString}&signature=${signature}`;

  try {
    const response = await binanceAxios.post(`${endpoint}?${finalQueryString}`, null, {
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
