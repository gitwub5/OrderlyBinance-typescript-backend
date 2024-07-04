import { orderSize, arbitrageThreshold, closeThreshold, trailingThreshold } from './stratgy';
import { placeOrderlyOrder } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder, modifyBinanceOrders } from '../binance/order';

 // 오덜리 시장가에 맞춰 바이낸스에 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
 // 리턴값은 주문 걸어놓은 long position과 short position의 orderId
 export async function placeOrder(orderlyPrice: number) {
    // 매수가 (Long Position) - orderlyPrice + arbitrageThreshold%
  const longPositionPrice = orderlyPrice * (1 + arbitrageThreshold / 100);

  // 매도가 (Short Position) - orderlyPrice - arbitrageThreshold%
  const shortPositionPrice = orderlyPrice * (1 - arbitrageThreshold / 100);

  const [longPosition, shortPosition] = await Promise.all([
    placeBinanceOrder.limitOrder('BUY', longPositionPrice, orderSize),
    placeBinanceOrder.limitOrder('SELL', shortPositionPrice, orderSize)
  ]);

  const longPositionId = longPosition.orderId;
  const shortPositionId = shortPosition.orderId;

  return {longPositionId, shortPositionId};
}

//현재 오덜리의 시장가에 따라 롱 포지션, 숏 포지션 수정
export async function handleOrder(orderlyPrice:number, longPositionId: number, shortPositionId: number){
  const longPositionPrice = orderlyPrice * (1 + arbitrageThreshold / 100);
  const shortPositionPrice = orderlyPrice * (1 - arbitrageThreshold / 100);

 await Promise.all([
    modifyBinanceOrders(longPositionId, 'BUY', longPositionPrice, orderSize),
    modifyBinanceOrders(shortPositionId, 'SELL', shortPositionPrice, orderSize)
  ]);
}

export async function enterPosition(positionAmt: number, longPositionId: number, shortPositionId: number) {
  if (positionAmt > 0) {
    // 포지션이 양수인 경우, long 포지션이므로 오덜리에서 short 포지션으로 진입
    await placeOrderlyOrder.marketOrder('SELL', positionAmt);
    console.log('Excuteing arbitrage: BUY on Binance, SELL on Orderly');
    // 매도 주문을 취소
    await cancelBinanceOrder(shortPositionId);
    console.log('Short position order canceled');

  } else if (positionAmt < 0) {
    // 포지션이 음수인 경우, short 포지션이므로 오덜리에서 long 포지션으로 진입
    await placeOrderlyOrder.marketOrder('BUY', positionAmt);
    console.log('Excuteing arbitrage: SELL on Binance, BUY on Orderly');
    // 메수 주문을 취소
    await cancelBinanceOrder(longPositionId);
    console.log('Long position order canceled');
  } 
}
