import { binanceAxios, binanceSymbol} from '../utils';
import { BinanceAccount } from '../types';


export async function placeOrder(account: BinanceAccount, side: string, price: number, amount: number) {
  const timestamp = Date.now();
  const method = 'POST';
  const endpoint = '/fapi/v1/order';

  const order = {
    symbol: binanceSymbol,
    side: side,
    type: 'LIMIT',
    price: price,
    quantity: amount,
    timestamp: timestamp,
  };

//   const payload = `${timestamp}${method}${endpoint}${JSON.stringify(order)}`;
//   const signature = createBinanceSignature(payload, account.secret);
    
//   try {
//     const response = await binanceAxios.post(endpoint, order, {
//       headers: {
//         'X-MBX-APIKEY': account.apiKey,
//       },
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error placing Binance order:', error);
//   }
// }
