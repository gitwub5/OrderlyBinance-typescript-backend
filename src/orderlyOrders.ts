import { orderlyAxios } from './utils';
import { Account } from './types';

export async function placeOrder(account: Account, side: string, price: number, amount: number) {
  const order = {
    symbol: 'TON/USDT',
    side: side,
    type: 'LIMIT',
    price: price,
    quantity: amount,
    apiKey: account.apiKey,
    secret: account.secret,
  };

  try {
    const response = await orderlyAxios.post('/order', order);
    return response.data;
  } catch (error) {
    console.error('Error placing Orderly order:', error);
  }
}
