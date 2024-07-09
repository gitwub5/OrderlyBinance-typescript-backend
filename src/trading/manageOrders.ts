import { placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder, modifyBinanceOrders } from '../binance/order';
import { token } from '../types/tokenTypes';

function fixPrecision(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

// TODO: db에 주문이 들어갔을 때 가격 밖에 없어서 아비트리지가 일어나야할 시점의 가격을 추가해서 확인 원하는 가격이랑 주문 가격이 비슷한지 확인!
// 오덜리 시장가에 따라 바이낸스에 아비트리지 임계값 차이만큼 매수, 매도 포지션 주문
// 롱 포지션, 숏 포지션 주문 Id 리턴
export async function placeNewOrder(token: token, orderlyPrice: number) {
  try {
    // 매도가 (Short Position) - orderlyPrice + arbitrageThreshold%
    const shortPositionPrice = fixPrecision(orderlyPrice * (1 + token.arbitrageThreshold / 100), token.precision);
    // 매수가 (Long Position) - orderlyPrice - arbitrageThreshold%
    const longPositionPrice = fixPrecision(orderlyPrice * (1 - token.arbitrageThreshold / 100), token.precision);
    
    // 두 개의 포지션을 동시에 걸어놓음
    const [longPosition, shortPosition] = await Promise.all([
      placeBinanceOrder.limitOrder(token.binanceSymbol, 'BUY', longPositionPrice, token.orderSize),
      placeBinanceOrder.limitOrder(token.binanceSymbol, 'SELL', shortPositionPrice, token.orderSize)
    ]);
    console.log(`[${token.binanceSymbol}][B] Place Orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);

    // 주문 ID 가져오기
    const longPositionId = longPosition.orderId;
    const shortPositionId = shortPosition.orderId;
    console.log(`[${token.binanceSymbol}][B] Long Position ID, Short Position ID: `, longPositionId, shortPositionId);
    // 주문 ID 반환
    return { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice };

  } catch (error) {
    console.error('Error placing orders:', error);
    throw new Error('Failed to place orders');
  }
}

// 현재 오덜리의 시장가에 따라 바이낸스 롱 포지션, 숏 포지션 수정
// 롱 포지션, 숏 포지션 가격 반환
export async function handleOrder(
  token: token, 
  orderlyPrice: number, 
  longPositionId: number, 
  shortPositionId: number, 
  previousLongPositionPrice: number, 
  previousShortPositionPrice: number
) {
  const shortPositionPrice = fixPrecision(orderlyPrice * (1 + token.arbitrageThreshold / 100), token.precision);
  const longPositionPrice = fixPrecision(orderlyPrice * (1 - token.arbitrageThreshold / 100), token.precision);

  // 수정할 필요가 없는 가격인지 확인
  const modifications = [];
  if (longPositionPrice !== previousLongPositionPrice) {
    modifications.push(modifyBinanceOrders(token.binanceSymbol, longPositionId, 'BUY', longPositionPrice, token.orderSize));
  }
  if (shortPositionPrice !== previousShortPositionPrice) {
    modifications.push(modifyBinanceOrders(token.binanceSymbol, shortPositionId, 'SELL', shortPositionPrice, token.orderSize));
  } 
  if (modifications.length === 0) {
    return { longPositionPrice, shortPositionPrice };
  }

  try {
    await Promise.all(modifications);
    console.log(`[${token.binanceSymbol}][B] Modified orders -> BUY: ${longPositionPrice} | SELL: ${shortPositionPrice}`);
    return { longPositionPrice, shortPositionPrice };
  } catch (error) {
    console.error('Error in modifying orders:', error);
    throw new Error('Order modification failed');
  }
}

// 오덜리 숏 포지션 진입 (바이낸스가 롱 포지션일 때)
export async function enterShortPosition(token: token, shortPositionId: number) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', token.orderSize);
      const orderId = response.order_id;
      const order = await getOrderlyOrderById(orderId);
      const sellPrice = order.average_executed_price;
      token.state.setEnterPrice(sellPrice);

      console.log(`<<<< Executing [${token.binanceSymbol}] arbitrage: BUY on Binance, SELL on Orderly >>>>`);

      await cancelBinanceOrder(token.binanceSymbol, shortPositionId);
      console.log('<<<< [${token.binanceSymbol}][B] Short position order canceled >>>>');

      return sellPrice;
  } catch (error) {
      console.error('Error in enterShortPosition:', error);
      throw error;
  }
}

// 오덜리 롱 포지션 진입 (바이낸스가 숏 포지션일 때)
export async function enterLongPosition(token: token, longPositionId: number) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', token.orderSize);
      const orderId = response.order_id;
      const order = await getOrderlyOrderById(orderId);
      const buyPrice = order.average_executed_price;
      token.state.setEnterPrice(buyPrice);

      console.log(`<<<< Executing [${token.binanceSymbol}] arbitrage: SELL on Binance, BUY on Orderly >>>>`);

      await cancelBinanceOrder(token.binanceSymbol, longPositionId);
      console.log('<<<< [${token.binanceSymbol}][B] Long position order canceled >>>>');

      return buyPrice;
  } catch (error) {
      console.error('Error in enterLongPosition:', error);
      throw error;
  }
}
