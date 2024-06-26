import { binanceAxios, binanceSymbol} from '../utils';
import { BinanceAccount } from '../types';
import { createBinanceSignature } from './binanceCreateSign';


export async function placeOrder(account: BinanceAccount, side: string, price: number, amount: number) {
  const timestamp = Date.now();
  const endpoint = '/fapi/v1/order';

  const queryParams = {
    symbol: binanceSymbol,
    side: side,
    type: 'LIMIT',
    price: price,
    quantity: amount,
    timestamp: timestamp,
    recvWindow: 5000,
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
    return response.data;
  } catch (error) {
    console.error('Error placing Binance order:', error);
  }   
}
