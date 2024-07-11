import { cancelAllOrderlyOrders, placeOrderlyOrder } from '../orderly/order';
import { cancelAllBinanceOrders, getBinanceOrderStatus, placeBinanceOrder } from '../binance/order';
import { getPositionAmounts } from './monitorPositions'
import { token } from '../types/tokenTypes';

async function closeOrderlyPositions(token: token, orderlyAmt: number) {
  if (orderlyAmt > 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly long position: SELL ${orderlyAmt} >>>>`);
  } else if (orderlyAmt < 0) {
    await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', -orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly short position: BUY ${-orderlyAmt} >>>>`);
  } else {
    console.log(`<<<< [${token.binanceSymbol}] No Orderly position to close. >>>>`);
  }
}

async function closeBinancePositions(token: token, binanceAmt: number) {
  if (binanceAmt > 0) {
    const response = await placeBinanceOrder.marketOrder(token.binanceSymbol, 'SELL', binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance long position: SELL ${binanceAmt} >>>>`);

    const orderId = response.orderId;
    const status = await getBinanceOrderStatus(token.binanceSymbol, orderId);
    token.state.setClosePrice(parseFloat(status.avgPrice));

  } else if (binanceAmt < 0) {
    const response = await placeBinanceOrder.marketOrder(token.binanceSymbol, 'BUY', -binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance short position: BUY ${-binanceAmt} >>>>`);

    const orderId = response.orderId;
    const status = await getBinanceOrderStatus(token.binanceSymbol, orderId);
    token.state.setClosePrice(parseFloat(status.avgPrice));

  } else {
    console.log(`<<<< [${token.binanceSymbol}] No Binance position to close. >>>>`);
  }
}

// 모든 포지션 청산(Market Order)
export async function closeAllPositions(token: token) {
  try {
    console.log(`<<<< [${token.binanceSymbol}] Closing positions >>>>`);
    const { orderlyAmt, binanceAmt } = await getPositionAmounts(token);

    //임시 로그
    console.log(`orderltAmt = ${orderlyAmt} / binanceAmt = ${binanceAmt}`);

    await Promise.all([
      closeOrderlyPositions(token, orderlyAmt),
      closeBinancePositions(token, binanceAmt)
    ]);
    
  } catch (error) {
    console.error('Error during position close:', error);
  }
}

// 오덜리 & 바이낸스 모든 주문 취소
export async function cancelAllOrders(token : token){
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

//DB에 저장할 값 변경하기!
//TODO: Profit을 따로 계산해서 저장하는데 거의 대부분의 주문이 원하는 가격으로 안들어갈 확률이 높아서 
//수익률이 정확하지 않을 수 있어서 주문 기록을 거래소에서 가져와서 저장하는거로 바꾸기