import { orderlySymbol, orderlyAccountInfo, ORDERLY_API_URL } from '../utils';
import { OrderlyAccount } from '../types';
import { signAndSendRequest } from './orderlySignRequest'

export async function placeOrder(account: OrderlyAccount, side: string, price: number, amount: number) {
  const body = {
    symbol: orderlySymbol,
    order_type: 'LIMIT',
    side: side,
    order_price: price,
    order_quantity: amount
  };

  try {
    console.log('creating order', JSON.stringify(body, undefined, 2));
    const res = await signAndSendRequest(account.accountId, account.privateKey, `${ORDERLY_API_URL}/v1/order`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const json = await res.json();
    console.log('createOrder:', JSON.stringify(json, undefined, 2));
  } catch (error) {
    console.error('Error creating order:', error);
  }
}