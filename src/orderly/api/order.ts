import { ORDERLY_API_URL, orderlyAccountInfo } from '../../utils/utils';
import { signAndSendRequest, createSignatureMessage } from './signer'

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

  public static async bidOrder(symbol: string, side: string, amount: number) {
    return await this.placeOrder(symbol, 'BID', side, null, amount);
  }

  public static async askOrder(symbol: string, side: string, amount: number) {
    return await this.placeOrder(symbol, 'ASK', side , null, amount);
  }

  // Buy at the lowest price
  public static async buyAtLowestPrice(symbol: string, amount: number) {
    return await this.bidOrder(symbol, 'BUY' ,amount);
  }

  // Sell at the highest price
  public static async sellAtHighestPrice(symbol: string, amount: number) {
    return await this.askOrder(symbol, 'SELL', amount);
  }
}


export async function orderlyMarketOrder(symbol: string, side: string, amount: number) {
  const body = JSON.stringify({
    symbol: symbol,
    order_type: 'MARKET',
    side: side,
    order_quantity: amount
  });

  try {
    const response = await signAndSendRequest(
      orderlyAccountInfo.accountId,
      orderlyAccountInfo.privateKey,
      `${ORDERLY_API_URL}/v1/order`,
      {
        method: 'POST',
        body: body
      }
    );
    const json = await response.json();
    return json.data;
  } catch (error) {
    console.error('Error creating order:', error);
  }
}

// // Usage example:
// function example() {
//   const symbol = 'PERP_ZRO_USDC';
//   const side = 'BUY';
//   const amount = 3;

//   try {
//     const orderResponse = orderlyMarketOrder(symbol, side, amount);
//     console.log('Order Response:', orderResponse);
//   } catch (error) {
//     console.error('Order Error:', error);
//   }
// }
// example();

export async function editOrderlyOrder(orderId: string, symbol: string, orderType: string, side: string, price: number | null, amount: number) {
  const body: Record<string, any> = {
    order_id: orderId,
    symbol: symbol,
    order_type: orderType,
    order_price: price,
    order_quantity: amount,
    side: side
  };

  try {
      const response = await signAndSendRequest(
        orderlyAccountInfo.accountId, 
        orderlyAccountInfo.privateKey, 
        `${ORDERLY_API_URL}/v1/order`, 
        {
          method: 'PUT',
          body: JSON.stringify(body)
        }
        );
        const json = await response.json();
        console.log('editOrder:', JSON.stringify(json, undefined, 2));
    } catch (error) {
      console.error('Error:', error);
      return null;
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
//       console.log(await placeOrderlyOrder.buyAtLowestPrice('PERP_TON_USDC', 2));
//       // const orderId = response.order_id;
//       // const orderlyPosition = await getOrderlyPositions('PERP_TON_USDC');
//       // const orderlyAmt = parseFloat(orderlyPosition.position_qty.toString());
//       // console.log(orderlyAmt);
//       // console.log(await placeOrderlyOrder.sellAtHighestPrice('PERP_TON_USDC', 2));
//       // console.log(res);
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