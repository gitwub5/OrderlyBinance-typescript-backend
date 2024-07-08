import { placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder, modifyBinanceOrders } from '../binance/order';
import { token } from '../types/tokenTypes';

function fixPrecision(value: number): number {
  const precision = 4;
  const factor = Math.pow(10, precision);
  return Math.floor(value * factor) / factor;
}

// 오덜리 시장가에 따라 바이낸스에 아비트리지 임계값 차이만큼 매수, 매도 포지션 주문
// 롱 포지션, 숏 포지션 주문 Id 리턴
export async function placeNewOrder(token: token, orderlyPrice: number) {
  try {
    // 매도가 (Short Position) - orderlyPrice + arbitrageThreshold%
    const shortPositionPrice = fixPrecision(orderlyPrice * (1 + token.arbitrageThreshold / 100));
    // 매수가 (Long Position) - orderlyPrice - arbitrageThreshold%
    const longPositionPrice = fixPrecision(orderlyPrice * (1 - token.arbitrageThreshold / 100));
    
    // 두 개의 포지션을 동시에 걸어놓음
    const [longPosition, shortPosition] = await Promise.all([
      placeBinanceOrder.limitOrder(token.binanceSymbol, 'BUY', longPositionPrice, token.orderSize),
      placeBinanceOrder.limitOrder(token.binanceSymbol, 'SELL', shortPositionPrice, token.orderSize)
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

// 현재 오덜리의 시장가에 따라 바이낸스 롱 포지션, 숏 포지션 수정
// 롱 포지션, 숏 포지션 가격 반환
export async function handleOrder(token: token, orderlyPrice: number, longPositionId: number, shortPositionId: number) {
  const shortPositionPrice = fixPrecision(orderlyPrice * (1 + token.arbitrageThreshold / 100));
  const longPositionPrice = fixPrecision(orderlyPrice * (1 - token.arbitrageThreshold / 100));
  
  try {
    await Promise.all([
      modifyBinanceOrders(token.binanceSymbol, longPositionId, 'BUY', longPositionPrice, token.orderSize),
      modifyBinanceOrders(token.binanceSymbol, shortPositionId, 'SELL', shortPositionPrice, token.orderSize)
    ]);

    console.log(`[Binance] Modified orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);
    return { longPositionPrice, shortPositionPrice };
  } catch (error) {
    console.error('Error in modifying orders:', error);
    throw new Error('Order modification failed');
  }
}

// 오덜리 숏 포지션 진입 (바이낸스가 롱 포지션일 때)
export async function enterShortPosition(token: token, shortPositionId: number, binancePrice: number) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', token.orderSize);
      const orderId = response.order_id;
      const order = await getOrderlyOrderById(orderId);
      const orderlyPrice = order.average_executed_price;
      token.state.setEnterPrice(orderlyPrice);

      console.log(`<<< Executing ${token.binanceSymbol} arbitrage: BUY on Binance, SELL on Orderly >>>>`);
      console.log(`[Orderly] Avg executed price (Short Position): ${orderlyPrice}`);

      await cancelBinanceOrder(token.binanceSymbol, shortPositionId);
      console.log('[Binance] Short position order canceled');

      const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

      token.state.setInitialPriceDifference(priceDifference);
  } catch (error) {
      console.error('Error in enterShortPosition:', error);
      throw error;
  }
}

// 오덜리 롱 포지션 진입 (바이낸스가 숏 포지션일 때)
export async function enterLongPosition(token: token, longPositionId: number, binancePrice : number) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', token.orderSize);
      const orderId = response.order_id;
      const order = await getOrderlyOrderById(orderId);
      const orderlyPrice = order.average_executed_price;
      token.state.setEnterPrice(orderlyPrice);

      console.log(`<<<< Executing ${token.binanceSymbol} arbitrage: SELL on Binance, BUY on Orderly >>>>`);
      console.log(`[Orderly] Avg executed price (Long Position): ${orderlyPrice}`);

      await cancelBinanceOrder(token.binanceSymbol, longPositionId);
      console.log('[Binance] Long position order canceled');
      
      const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
      token.state.setInitialPriceDifference(priceDifference);
  } catch (error) {
      console.error('Error in enterLongPosition:', error);
      throw error;
  }
}
