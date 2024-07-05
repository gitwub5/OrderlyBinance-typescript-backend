import { orderSize, arbitrageThreshold } from './stratgy';
import { placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder, modifyBinanceOrders } from '../binance/order';
import { getBinancePrice } from '../binance/market';
import { setInitialPriceDifference } from '../globals';

function fixPrecision(value: number): number {
  const precision = 4;
  const factor = Math.pow(10, precision);
  return Math.floor(value * factor) / factor;
}

// 오덜리 시장가에 맞춰 바이낸스에 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
// 리턴값은 주문 걸어놓은 long position과 short position의 orderId
export async function placeOrder(orderlyPrice: number) {
  try {
    // 매도가 (Short Position) - orderlyPrice + arbitrageThreshold%
    const shortPositionPrice = fixPrecision(orderlyPrice * (1 + arbitrageThreshold / 100));
    // 매수가 (Long Position) - orderlyPrice - arbitrageThreshold%
    const longPositionPrice = fixPrecision(orderlyPrice * (1 - arbitrageThreshold / 100));
    
    // 두 개의 포지션을 동시에 걸어놓음
    const [longPosition, shortPosition] = await Promise.all([
      placeBinanceOrder.limitOrder('BUY', longPositionPrice, orderSize),
      placeBinanceOrder.limitOrder('SELL', shortPositionPrice, orderSize)
    ]);
    console.log(`[Binance] Place orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);

    // 주문 ID 가져오기
    const longPositionId = longPosition.orderId;
    const shortPositionId = shortPosition.orderId;
    console.log(`[Binance] Long Position ID, Short Position ID: `, longPositionId, shortPositionId);
    // 주문 ID 반환
    return { longPositionId, shortPositionId };

  } catch (error) {
    console.error('Error placing orders:', error);
    throw new Error('Failed to place orders');
  }
}

//현재 오덜리의 시장가에 따라 롱 포지션, 숏 포지션 수정
export async function handleOrder(orderlyPrice:number, longPositionId: number, shortPositionId: number){
  const shortPositionPrice = fixPrecision(orderlyPrice * (1 + arbitrageThreshold / 100));
  const longPositionPrice = fixPrecision(orderlyPrice * (1 - arbitrageThreshold / 100));
  
 await Promise.all([
    modifyBinanceOrders(longPositionId, 'BUY', longPositionPrice, orderSize),
    modifyBinanceOrders(shortPositionId, 'SELL', shortPositionPrice, orderSize)
  ]);
  
  console.log(`[Binance] Modified orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);
}

export async function enterPosition(positionAmt: number, longPositionId: number, shortPositionId: number) {
  let price : number = 0;
  if (positionAmt > 0) {
    // 포지션이 양수인 경우, 바이낸스 long 포지션이므로 오덜리에서 short 포지션으로 진입
    const response = await placeOrderlyOrder.marketOrder('SELL', positionAmt);
    const orderId = response.order_id;
    const response2 = await getOrderlyOrderById(orderId);
    price = response2.average_executed_price;
    
    console.log('<<<< Excuteing arbitrage: BUY on Binance, SELL on Orderly >>>>');
    console.log(`[Orderly] Avg executed price (Short Position): ${price}`);

    // 매도 주문을 취소
    await cancelBinanceOrder(shortPositionId);
    console.log('[Binance] Short position order canceled');

  } else if (positionAmt < 0) {
    // 포지션이 음수인 경우, 바이낸스 short 포지션이므로 오덜리에서 long 포지션으로 진입
    const response = await placeOrderlyOrder.marketOrder('BUY', positionAmt);
    const orderId = response.order_id;
    const response2 = await getOrderlyOrderById(orderId);
    price = response2.average_executed_price;

    console.log('<<<< Excuteing arbitrage: SELL on Binance, BUY on Orderly >>>>');
    console.log(`[Orderly] Avg executed price (Long Position): ${price}`);

    // 메수 주문을 취소
    await cancelBinanceOrder(longPositionId);
    console.log('[Binance] Long position order canceled');
  } 

  const binancePrice = getBinancePrice();
  const priceDifference = ((parseFloat(binancePrice.toString()) - price) / price) * 100;
  setInitialPriceDifference(priceDifference);
}

