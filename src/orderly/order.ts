import { ORDERLY_API_URL, orderlyAccountInfo } from '../utils/utils';
import { signAndSendRequest } from './signer'

export class placeOrderlyOrder {
  private static async placeOrder(symbol: string, orderType: string, side: string, price: number | null, amount: number) {
    const body: Record<string, any> = {
      symbol: symbol,
      order_type: orderType,
      side: side,
      order_quantity: amount
    };

    if (orderType === 'LIMIT') {
      body.order_price = price;
    }

    try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId, 
        orderlyAccountInfo.privateKey, 
        `${ORDERLY_API_URL}/v1/order`, 
        {
          method: 'POST',
          body: JSON.stringify(body)
        }
      );

      const json = await response.json();
      //console.log('Orderly Order Response:', JSON.stringify(json, undefined, 2));
      return json.data;
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  public static async limitOrder(symbol: string, side: string, price: number, amount: number) {
    return await this.placeOrder(symbol, 'LIMIT', side, price, amount);
  }

  public static async marketOrder(symbol: string, side: string, amount: number) {
    return await this.placeOrder(symbol, 'MARKET', side, null, amount);
  }
}

export async function cancelOrderlyOrder(symbol: string, orderId: number) {
  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
          `${ORDERLY_API_URL}/v1/order?order_id=${orderId}&symbol=${symbol}`,
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

export async function cancelAllOrderlyOrders(symbol: string) {
  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
          `${ORDERLY_API_URL}/v1/orders?symbol=${symbol}`,
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

export async function getOrderlyOrderById(order_id: string) {
  try {
    const response = await signAndSendRequest(
      orderlyAccountInfo.accountId,
      orderlyAccountInfo.privateKey,
      `${ORDERLY_API_URL}/v1/order/${order_id}`,
      {
        method: 'GET'
      }
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// async function main() {
//     try {
//       const response = await placeOrderlyOrder.marketOrder('PERP_TON_USDC', 'BUY', 2)
//       // const orderId = response.order_id;
//       // const response2 = await getOrderlyOrderById(orderId);
//       // const orderlyPrice = response2.average_executed_price;
//       //console.log(price);
//     } catch (error) {
//         console.error('Error in main function:', error);
//     }
// }

// main().catch(error => {
//   console.error('Unhandled error in main function:', error);
// });