import { orderlySymbol, orderlyAccountInfo, ORDERLY_API_URL } from '../utils';
import { OrderlyAccount } from '../types';
import { signAndSendRequest } from './orderlySignRequest'

export class placeOrderlyOrder {
  private static async placeOrder(account: OrderlyAccount, orderType: string, side: string, price: number | null, amount: number) {
    const body: Record<string, any> = {
      symbol: orderlySymbol,
      order_type: orderType,
      side: side,
      order_quantity: amount
    };

    if (orderType === 'LIMIT') {
      body.order_price = price;
    }

    try {
      const res = await signAndSendRequest(account.accountId, account.privateKey, `${ORDERLY_API_URL}/v1/order`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const json = await res.json();
      //console.log('Orderly Order Response:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  public static async limitOrder(account: OrderlyAccount, side: string, price: number, amount: number) {
    await this.placeOrder(account, 'LIMIT', side, price, amount);
  }

  public static async marketOrder(account: OrderlyAccount, side: string, amount: number) {
    await this.placeOrder(account, 'MARKET', side, null, amount);
  }
}
