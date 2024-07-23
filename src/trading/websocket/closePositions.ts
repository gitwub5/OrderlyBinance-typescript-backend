import { cancelAllOrderlyOrders, placeOrderlyOrder } from '../../orderly/api/order';
import { cancelAllBinanceOrders} from '../../binance/api/order';
import { getPositionAmounts } from '../api/monitorPositions'
import { WebSocketAPIClient } from "../../binance/websocketAPI/websocektAPI";
import { Token } from '../../types/tokenTypes';

async function closeOrderlyPositions(token: Token, orderlyAmt: number) {
  if (orderlyAmt > 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly long position: SELL ${orderlyAmt} >>>>`);
  } else if (orderlyAmt < 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', -orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly short position: BUY ${-orderlyAmt} >>>>`);
  } else {
    // Re-check position amounts
    const { orderlyAmt: newOrderlyAmt } = await getPositionAmounts(token);
    if (newOrderlyAmt !== 0) {
      await closeOrderlyPositions(token, newOrderlyAmt);
    } else {
      console.log(`<<<< [${token.binanceSymbol}] No Orderly position to close. >>>>`);
    }
  }
}

//웹소켓 ver
async function closeBinancePositions(client: WebSocketAPIClient, token: Token, binanceAmt: number) {
  if (binanceAmt > 0) {
    client.placeOrder(token.binanceSymbol, null , binanceAmt , 'SELL', 'MARKET');
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance long position: SELL ${binanceAmt} >>>>`);
  } else if (binanceAmt < 0) {
    client.placeOrder(token.binanceSymbol, null , -binanceAmt , 'BUY', 'MARKET');
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance short position: BUY ${-binanceAmt} >>>>`);
  } else {
     // Re-check position amounts
     const { binanceAmt: newBinanceAmt } = await getPositionAmounts(token);
     if (newBinanceAmt !== 0) {
       await closeBinancePositions(client, token, newBinanceAmt);
     } else {
       console.log(`<<<< [${token.binanceSymbol}] No Binance position to close. >>>>`);
     }
  }
}

// 모든 포지션 청산(Market Order)
export async function closeAllPositions(client: WebSocketAPIClient, token: Token) {
  try {
    console.log(`<<<< [${token.binanceSymbol}] Closing positions >>>>`);
    const { orderlyAmt, binanceAmt } = await getPositionAmounts(token);

    //임시 로그
    console.log(`orderlyAmt = ${orderlyAmt} / binanceAmt = ${binanceAmt}`);

    await Promise.all([
      closeOrderlyPositions(token, orderlyAmt),
      closeBinancePositions(client, token, binanceAmt)
    ]);

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
    console.log(`[${token.binanceSymbol}] All Open Orders are canceled...`);
  } catch (error) {
    console.error('Error during order cancelation:', error);
  }
}
