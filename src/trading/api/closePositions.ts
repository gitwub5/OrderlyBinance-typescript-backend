import { cancelAllOrderlyOrders, placeOrderlyOrder } from '../../orderly/api/order';
import { cancelAllBinanceOrders, getBinanceOrderStatus, placeBinanceOrder } from '../../binance/api/order';
import { getPositionAmounts } from './monitorPositions'
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

async function closeBinancePositions(token: Token, binanceAmt: number) {
  if (binanceAmt > 0) {
    const response = await placeBinanceOrder.marketOrder(token.binanceSymbol, 'SELL', binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance long position: SELL ${binanceAmt} >>>>`);

    const orderId = response.orderId;
    const status = await getBinanceOrderStatus(token.binanceSymbol, orderId);
    token.state.setBinanceClosePrice(parseFloat(status.avgPrice));

  } else if (binanceAmt < 0) {
    const response = await placeBinanceOrder.marketOrder(token.binanceSymbol, 'BUY', -binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance short position: BUY ${-binanceAmt} >>>>`);

    const orderId = response.orderId;
    const status = await getBinanceOrderStatus(token.binanceSymbol, orderId);
    token.state.setBinanceClosePrice(parseFloat(status.avgPrice));

  } else {
     // Re-check position amounts
     const { binanceAmt: newBinanceAmt } = await getPositionAmounts(token);
     if (newBinanceAmt !== 0) {
       await closeBinancePositions(token, newBinanceAmt);
     } else {
       console.log(`<<<< [${token.binanceSymbol}] No Binance position to close. >>>>`);
     }
  }
}

// 모든 포지션 청산(Market Order)
export async function closeAllPositions(token: Token) {
  try {
    console.log(`<<<< [${token.binanceSymbol}] Closing positions >>>>`);
    const { orderlyAmt, binanceAmt } = await getPositionAmounts(token);

    //임시 로그
    console.log(`orderlyAmt = ${orderlyAmt} / binanceAmt = ${binanceAmt}`);

    await Promise.all([
      closeOrderlyPositions(token, orderlyAmt),
      closeBinancePositions(token, binanceAmt)
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
