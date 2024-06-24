import { binanceAxios } from './utils';
import { Account } from './types';

export async function placeOrder(account: Account, side: string, price: number, amount: number) {
  const order = {
    symbol: 'TONUSDT',
    side: side,
    type: 'LIMIT',
    price: price,
    quantity: amount,
    apiKey: account.apiKey,
    secret: account.secret,
  };

  try {
    const response = await binanceAxios.post('/api/v3/order', order);
    return response.data;
  } catch (error) {
    console.error('Error placing Binance order:', error);
  }
}
