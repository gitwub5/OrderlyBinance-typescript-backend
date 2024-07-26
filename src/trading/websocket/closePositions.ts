import { cancelAllOrderlyOrders, placeOrderlyOrder } from '../../orderly/api/order';
import { cancelAllBinanceOrders} from '../../binance/api/order';
import { getPositionAmounts } from '../api/monitorPositions'
import { WebSocketAPIClient } from "../../binance/websocketAPI/websocektAPI";
import { Token } from '../../types/tokenTypes';
import { tokensArray } from '../stratgy';

async function closeOrderlyPositions(token: Token, orderlyAmt: number) {
  if (orderlyAmt > 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', orderlyAmt);
    console.log(`<<<< [${token.symbol}] Closing Orderly long position: SELL ${orderlyAmt} >>>>`);
  } else if (orderlyAmt < 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', -orderlyAmt);
    console.log(`<<<< [${token.symbol}] Closing Orderly short position: BUY ${-orderlyAmt} >>>>`);
  } else {
    console.log(`<<<< [${token.symbol}] No Orderly position to close. >>>>`);
  }
}

// // Example of closing positions
// async function closePositionsExample() {
//   try {
//     const { orderlyAmt, binanceAmt } = await getPositionAmounts(tokensArray[0]);
//     await closeOrderlyPositions(tokensArray[0], orderlyAmt); // Pass the entire token object

//     const apiclient = new WebSocketAPIClient();
//     await apiclient.connect(); // Await WebSocket connection
//     setTimeout(async () => {
//       await closeBinancePositions(apiclient, tokensArray[0], binanceAmt);
//     }, 1000);
//   } catch (error) {
//     console.error('Error closing positions:', error);
//   }
// }

// closePositionsExample();

// WebSocket version to close Binance positions
async function closeBinancePositions(client: WebSocketAPIClient, token: Token, binanceAmt: number) {
  if (binanceAmt > 0) {
    client.placeOrder(token.binanceSymbol, null, binanceAmt, 'SELL', 'MARKET');
    console.log(`<<<< [${token.symbol}] Closing Binance long position: SELL ${binanceAmt} >>>>`);
  } else if (binanceAmt < 0) {
    client.placeOrder(token.binanceSymbol, null, -binanceAmt, 'BUY', 'MARKET');
    console.log(`<<<< [${token.symbol}] Closing Binance short position: BUY ${-binanceAmt} >>>>`);
  } else {
    console.log(`<<<< [${token.symbol}] No Binance position to close. >>>>`);
  }
}

// 모든 포지션 청산(Market Order)
export async function closeAllPositions(client: WebSocketAPIClient, token: Token) {
  try {
    console.log(`<<<< [${token.symbol}] Closing positions >>>>`);
    const { orderlyAmt, binanceAmt } = await getPositionAmounts(token);

    //임시 로그
    console.log(`Orderly Amount: ${orderlyAmt}, Binance Amount: ${binanceAmt}`);

    await Promise.all([
      closeOrderlyPositions(token, orderlyAmt),
      closeBinancePositions(client, token, binanceAmt)
    ]);

    console.log(`<<<< [${token.symbol}] All positions closed >>>>`);

  } catch (error) {
    console.error('Error during position close:', error);
  }
}

// 오덜리 & 바이낸스 모든 주문 취소
export async function cancelAllOrders(token : Token){
  const cancelOrderPromises = [
    cancelAllBinanceOrders(token.binanceSymbol),
    cancelAllOrderlyOrders(token.orderlySymbol)
  ];    

  try {
    await Promise.all(cancelOrderPromises);
    console.log(`[${token.symbol}] All Open Orders are canceled...`);
  } catch (error) {
    console.error('Error during order cancelation:', error);
  }
}

