import { orderSize } from './stratgy';
import { placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder, modifyBinanceOrders } from '../binance/order';
import { getBinancePrice } from '../binance/market';
import { setInitialPriceDifference } from '../globals';
import { token } from 'types/tokenTypes';

function fixPrecision(value: number): number {
  const precision = 4;
  const factor = Math.pow(10, precision);
  return Math.floor(value * factor) / factor;
}

// 오덜리 시장가에 맞춰 바이낸스에 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
// 리턴값은 주문 걸어놓은 long position과 short position의 orderId
export async function placeNewOrder(binanceSymbol: string, orderlyPrice: number, arbitrageThreshold: number) {
  try {
    // 매도가 (Short Position) - orderlyPrice + arbitrageThreshold%
    const shortPositionPrice = fixPrecision(orderlyPrice * (1 + arbitrageThreshold / 100));
    // 매수가 (Long Position) - orderlyPrice - arbitrageThreshold%
    const longPositionPrice = fixPrecision(orderlyPrice * (1 - arbitrageThreshold / 100));
    
    // 두 개의 포지션을 동시에 걸어놓음
    const [longPosition, shortPosition] = await Promise.all([
      placeBinanceOrder.limitOrder(binanceSymbol, 'BUY', longPositionPrice, orderSize),
      placeBinanceOrder.limitOrder(binanceSymbol, 'SELL', shortPositionPrice, orderSize)
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

// 현재 오덜리의 시장가에 따라 롱 포지션, 숏 포지션 수정
export async function handleOrder(binanceSymbol: string, orderlyPrice: number, arbitrageThreshold: number, 
  longPositionId: number, shortPositionId: number) {
  const shortPositionPrice = fixPrecision(orderlyPrice * (1 + arbitrageThreshold / 100));
  const longPositionPrice = fixPrecision(orderlyPrice * (1 - arbitrageThreshold / 100));
  
  try {
    await Promise.all([
      modifyBinanceOrders(binanceSymbol, longPositionId, 'BUY', longPositionPrice, orderSize),
      modifyBinanceOrders(binanceSymbol, shortPositionId, 'SELL', shortPositionPrice, orderSize)
    ]);

    console.log(`[Binance] Modified orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);
  } catch (error) {
    console.error('Error in modifying orders:', error);
    throw new Error('Order modification failed');
  }
}


// 공통 함수: 포지션 진입 및 초기 가격 차이 설정
async function enterPosition(token: token, positionType: 'BUY' | 'SELL', positionId: number, cancelPositionId: number) {
  try {
    const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, positionType, token.orderSize);
    const orderId = response.order_id;
    const response2 = await getOrderlyOrderById(orderId);
    const orderlyPrice = response2.average_executed_price;

    console.log(`<<<< Executing arbitrage: ${positionType === 'BUY' ? 'SELL' : 'BUY'} on Binance, ${positionType} on Orderly >>>>`);
    console.log(`[Orderly] Avg executed price (${positionType === 'BUY' ? 'Long' : 'Short'} Position): ${orderlyPrice}`);

    // 바이낸스 포지션 주문을 취소
    await cancelBinanceOrder(token.binanceSymbol, cancelPositionId);
    console.log(`[Binance] ${positionType === 'BUY' ? 'Long' : 'Short'} position order canceled`);

    // 초기 가격 갭 저장
    const binancePrice = await getBinancePrice(token.binanceSymbol);
    const priceDifference = ((parseFloat(binancePrice.toString()) - orderlyPrice) / orderlyPrice) * 100;
    setInitialPriceDifference(priceDifference);
  } catch (error) {
    console.error(`Error in enter${positionType === 'BUY' ? 'Long' : 'Short'}Position:`, error);
    throw new Error('Enter poition failed');
  }
}

// 바이낸스가 롱 포지션일 때, 오덜리에서 숏 포지션으로 진입
export async function enterShortPosition(token: token, shortPositionId: number) {
  await enterPosition(token, 'SELL', shortPositionId, shortPositionId);
}

// 바이낸스가 숏 포지션일 때, 오덜리에서 롱 포지션으로 진입
export async function enterLongPosition(token: token, longPositionId: number) {
  await enterPosition(token, 'BUY', longPositionId, longPositionId);
}
