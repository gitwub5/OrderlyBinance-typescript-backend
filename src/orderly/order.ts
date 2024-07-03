import { orderlySymbol, ORDERLY_API_URL, orderlyAccountInfo } from '../utils/utils';
import { signAndSendRequest } from './signer'

export class placeOrderlyOrder {
  private static async placeOrder(orderType: string, side: string, price: number | null, amount: number) {
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
      const response = await signAndSendRequest(orderlyAccountInfo.accountId, orderlyAccountInfo.privateKey, `${ORDERLY_API_URL}/v1/order`, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      const json = await response.json();
      //console.log('Orderly Order Response:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  public static async limitOrder(side: string, price: number, amount: number) {
    await this.placeOrder('LIMIT', side, price, amount);
  }

  public static async marketOrder(side: string, amount: number) {
    await this.placeOrder('MARKET', side, null, amount);
  }
}

export async function cancelOrderlyOrder(orderId: number) {
  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
          `${ORDERLY_API_URL}/v1/order?order_id=${orderId}&symbol=${orderlySymbol}`,
          {
            method: 'DELETE'
          }
        );
        const json = await response.json();
        //console.log('cancelOrder:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
}

export async function cancelBatchOrderlyOrders(order_ids: number[]) {
  const orderIdsString = order_ids.join(',');

  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/batch-order?order_ids=${orderIdsString}`,
        {
          method: 'DELETE'
        }
      );
      const json = await response.json();
      //console.log('cancelBatchOrder:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
}

export async function cancelAllOrderlyOrders() {
  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
          `${ORDERLY_API_URL}/v1/orders?symbol=${orderlySymbol}`,
          {
            method: 'DELETE'
          }
        );
        const json = await response.json();
        //console.log('cancelAllOrder:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
}