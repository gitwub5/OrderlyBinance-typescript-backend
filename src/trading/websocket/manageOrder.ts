import { WebsocketAPI } from "@binance/connector-typescript";
import { token } from "../../types/tokenTypes";
import { WebSocketAPIClient } from "binance/websocketAPI/websocektAPI";

function fixPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  }

// 현재 오덜리의 시장가에 따라 웹소켓으로 바이낸스 롱 포지션, 숏 포지션 수정
// 롱 포지션, 숏 포지션 가격 반환
export async function handleOrder(
    client : WebSocketAPIClient,
    token: token,
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
      console.log(`[${token.binanceSymbol}][B] Modified orders -> BUY: ${longPositionPrice} | SELL: ${shortPositionPrice}`);
      return { longPositionPrice, shortPositionPrice };
    } catch (error) {
      console.error('Error in modifying orders:', error);
      throw new Error('Order modification failed');
    }
  }