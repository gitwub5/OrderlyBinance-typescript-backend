import { getOrderlyPrice } from '../orderly/market';
import { shouldStop } from '../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { interval } from './stratgy';
import { getBinanceOrderStatus } from '../binance/order';
import { token } from '../types/tokenTypes';


  export async function executeArbitrage(token: token) {
    try{
      let orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
      console.log(`[Orderly] ${token.orderlySymbol} Mark Price: `, orderlyPrice);
      const { longPositionId, shortPositionId } = await placeNewOrder(token.binanceSymbol, orderlyPrice, token.arbitrageThreshold);

      let positionFilled = false;
      let previousOrderlyPrice = orderlyPrice;

      while (!positionFilled) {
        const [longPositionStatus, shortPositionStatus] = await Promise.all([
          getBinanceOrderStatus(token.binanceSymbol, longPositionId),
          getBinanceOrderStatus(token.binanceSymbol, shortPositionId)
        ]);
        
        if(longPositionStatus.status === 'FILLED'){
          console.log(`<<<< Long Position filled on Binance >>>>`);
          enterShortPosition(token, shortPositionId);

          await monitorClosePositions(token);

          positionFilled = true;
          return;
        }
        else if(shortPositionStatus.status === 'FILLED'){
          console.log(`<<<< Short Position filled on Binance >>>>`);
          enterLongPosition(token, longPositionId);

          await monitorClosePositions(token);

          positionFilled = true;
          return;
        }
        else{
          orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
          console.log(`[Orderly] ${token.orderlySymbol} Mark Price: `, orderlyPrice);

          //가격 변화없으면 주문 수정 실행 X -> 같은 가격으로 주문 실행하면 에러 메시지 반환됨
          if (orderlyPrice !== previousOrderlyPrice) {
            await handleOrder(token.binanceSymbol, orderlyPrice, token.arbitrageThreshold, longPositionId, shortPositionId);
            previousOrderlyPrice = orderlyPrice;
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
    } catch (error) {
      console.error('Error in executeArbitrage:', error);
    }
  }

export async function manageArbitrage(token: token) {
  try {
    while (!shouldStop) {
      await executeArbitrage(token);
      console.log('<<<< Arbitrage iteration completed >>>>');
      // 5초 후 다시 실행
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error('Error in manageArbitrage:', error);
  } finally {
    console.log('Exiting manageOrders...');
  }
}

