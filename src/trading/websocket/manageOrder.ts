import { Token } from "../../types/tokenTypes";
import { WebSocketAPIClient } from "../../binance/websocketAPI/websocketAPI";
import { placeOrderlyOrder, getOrderlyOrderById } from '../../orderly/api/order';
import { placeBinanceOrder } from "../../binance/api/order";

function fixPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

  export async function placeNewOrder(token: Token, orderlyPrice: number) {
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
      console.log(`[${token.symbol}][B] Place Orders -> Long Pos: ${longPositionPrice} | Short Pos: ${shortPositionPrice}`);
  
      // 주문 ID 가져오기
      const longPositionId = longPosition.orderId;
      const shortPositionId = shortPosition.orderId;
      console.log(`[${token.symbol}][B] Long Position ID, Short Position ID: `, longPositionId, shortPositionId);
      // 주문 ID 반환
      return { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice };
  
    } catch (error) {
      console.error('Error placing orders:', error);
      throw new Error('Failed to place orders');
    }
  }

// 현재 오덜리의 시장가에 따라 웹소켓으로 바이낸스 롱 포지션, 숏 포지션 수정
// 롱 포지션, 숏 포지션 가격 반환
export async function handleOrder(
    client : WebSocketAPIClient,
    token: Token,
    orderlyPrice: number, 
    longPositionId: number, 
    shortPositionId: number, 
    previousLongPositionPrice: number, 
    previousShortPositionPrice: number
  ) {
    try {
    const longPositionPrice = fixPrecision(orderlyPrice * (1 - token.arbitrageThreshold / 100), token.precision);
    const shortPositionPrice = fixPrecision(orderlyPrice * (1 + token.arbitrageThreshold / 100), token.precision);
   
    // 수정할 필요가 없는 가격인지 확인
    const modifications = [];
    if (longPositionPrice !== previousLongPositionPrice) {
      modifications.push(client.modifyOrder(token.binanceSymbol, longPositionId, longPositionPrice, token.orderSize, 'BUY'));
    }
    if (shortPositionPrice !== previousShortPositionPrice) {
      modifications.push(client.modifyOrder(token.binanceSymbol, shortPositionId, shortPositionPrice, token.orderSize, 'SELL'));
    } 
    if (modifications.length === 0) {
      return { longPositionPrice, shortPositionPrice };
    }
  
    
      await Promise.all(modifications);
      console.log(`[${token.symbol}][B] Modified orders -> BUY: ${longPositionPrice} | SELL: ${shortPositionPrice}`);
      return { longPositionPrice, shortPositionPrice };
    } catch (error) {
      console.error('Error in modifying orders:', error);
      throw new Error('Order modification failed');
    }
  }

  // 오덜리 숏 포지션 진입 (바이낸스가 롱 포지션일 때)
export async function placeSellOrder(token: Token) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'SELL', token.orderSize);
      const orderId = response.order_id;
      let retries = 0;
      let order = await getOrderlyOrderById(orderId);

      const sellPrice = order.average_executed_price;

      console.log(`<<<< [${token.symbol}] Executing arbitrage: BUY on Binance, SELL on Orderly >>>>`);

      return sellPrice;
  } catch (error) {
      console.error('Error in placeSellOrder:', error);
      throw error;
  }
}

// 오덜리 롱 포지션 진입 (바이낸스가 숏 포지션일 때)
export async function placeBuyOrder(token: Token) {
  try {
      const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', token.orderSize);
      const orderId = response.order_id;
      let retries = 0;
      let order = await getOrderlyOrderById(orderId);
  
      const buyPrice = parseFloat(order.average_executed_price);

      console.log(`<<<< [${token.symbol}] Executing arbitrage: SELL on Binance, BUY on Orderly >>>>`);

      return buyPrice;
  } catch (error) {
      console.error('Error in placeBuyOrder:', error);
      throw error;
  }
}