import { cancelAllOrderlyOrders, placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { cancelAllBinanceOrders, placeBinanceOrder } from '../binance/order';
import { getPositionAmounts } from './monitorPositions'
import { recordTrade } from '../db/queries';
import { forceStop } from '../globals';
import { token } from '../types/tokenTypes';
import { getOrderlyPositions } from '../orderly/account';

async function closeOrderlyPosAndRecord(token: token, side: 'BUY' | 'SELL', amount: number) {
  const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, side, amount);
  const orderId = response.order_id;
  const order = await getOrderlyOrderById(orderId);
  const orderlyPrice = order.average_executed_price;
  token.state.setClosePrice(orderlyPrice);
}

async function closeOrderlyPositions(token: token, orderlyAmt: number) {
  if (orderlyAmt > 0) {
    await closeOrderlyPosAndRecord(token, 'SELL', orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly long position: SELL ${orderlyAmt} >>>>`);
  } else if (orderlyAmt < 0) {
    await closeOrderlyPosAndRecord(token, 'BUY', -orderlyAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Orderly short position: BUY ${-orderlyAmt} >>>>`);
  } else {
    console.log(`[${token.binanceSymbol}] No Orderly position to close.`);
  }
}

async function closeBinancePositions(token: token, binanceAmt: number) {
  if (binanceAmt > 0) {
    await placeBinanceOrder.marketOrder(token.binanceSymbol, 'SELL', binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance long position: SELL ${binanceAmt} >>>>`);
  } else if (binanceAmt < 0) {
    await placeBinanceOrder.marketOrder(token.binanceSymbol, 'BUY', -binanceAmt);
    console.log(`<<<< [${token.binanceSymbol}] Closing Binance short position: BUY ${-binanceAmt} >>>>`);
  } else {
    console.log(`[${token.binanceSymbol}] No Binance position to close.`);
  }
}

// 모든 포지션 청산(Market Order) 및 DB에 기록
export async function closeAllPositions(token: token) {
  try {
    console.log(`<<<< [${token.binanceSymbol}] Closing positions >>>>`);
    const { orderlyAmt, binanceAmt } = await getPositionAmounts(token);

    await Promise.all([
      closeOrderlyPositions(token, orderlyAmt),
      closeBinancePositions(token, binanceAmt)
    ]);
    
    //임시로 한 번 더 오덜리 포지션 청산되었는지 확인 (오덜리만 포지션 청산이 안되는 오류 발생해서)
    const checkOrderlyPosition = await getOrderlyPositions(token.orderlySymbol); 
    if(checkOrderlyPosition.position_qty !== 0){
      await closeOrderlyPositions(token, checkOrderlyPosition.position_qty);
    }
  } catch (error) {
    console.error('Error during position close:', error);
  }

  if (!forceStop) {
    try {
      await recordTrade(
        token.binanceSymbol,
        token.state.getInitialPriceDifference(),
        token.state.getClosePriceDifference(),
        token.state.getEnterPrice(),
        token.state.getClosePrice()
      );
      console.log(`[${token.binanceSymbol}] Recorded at table`);
    } catch (err) {
      console.log('Error during recording at table', err);
    }
  }
  token.state.reset();
}

//포지션 전부 닫기링 주문 전부 취소 나누기
export async function cancelAllOrders(token : token){
  // 오덜리 & 바이낸스 모든 주문 취소
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