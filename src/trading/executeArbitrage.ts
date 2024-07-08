import { getOrderlyPrice } from '../orderly/market';
import { shouldStop } from '../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { interval } from './stratgy';
import { getBinanceOrderStatus } from '../binance/order';
import { token } from '../types/tokenTypes';

export async function executeArbitrage(token: token) {
  try {
      let orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
      console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
      
      const { longPositionId, shortPositionId } = await placeNewOrder(token, orderlyPrice);
      let positionFilled = false;
      let previousOrderlyPrice = orderlyPrice;
      let longPositionPrice = 0;
      let shortPositionPrice = 0;

      //1초 정도 대기
      await new Promise(resolve => setTimeout(resolve, 1000));

      while (!positionFilled) {
          const [longPositionStatus, shortPositionStatus] = await Promise.all([
              getBinanceOrderStatus(token.binanceSymbol, longPositionId),
              getBinanceOrderStatus(token.binanceSymbol, shortPositionId)
          ]);

          if (longPositionStatus === 'FILLED') {
              console.log(`<<<< [${token.binanceSymbol}] Long Position filled on Binance >>>>`);
              await enterShortPosition(token, shortPositionId, longPositionPrice);
              await monitorClosePositions(token);
              positionFilled = true;
              return;
          } else if (shortPositionStatus === 'FILLED') {
              console.log(`<<<< [${token.binanceSymbol}] Short Position filled on Binance >>>>`);
              await enterLongPosition(token, longPositionId, shortPositionPrice);
              await monitorClosePositions(token);
              positionFilled = true;
              return;
          } else {
              orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
              console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);

              if (orderlyPrice !== previousOrderlyPrice) {
                ({ longPositionPrice, shortPositionPrice } = await handleOrder(token, orderlyPrice, longPositionId, shortPositionId));
                previousOrderlyPrice = orderlyPrice;
            }
              await new Promise(resolve => setTimeout(resolve, interval));
          }
      }
  } catch (error) {
    console.error('Error in executeArbitrage:', error);
    throw error;
}
}

export async function manageArbitrage(token: token) {
    try {
        //TODO: shouldStop의 조건은 balance가 없을 때가 되어야함
        while (!shouldStop) {
            await executeArbitrage(token);
            console.log(`<<<< [${token.binanceSymbol}] Arbitrage iteration completed >>>>`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error('Error in manageArbitrage:', error);
        throw error;
    } finally {
        console.log('Exiting manageOrders...');
    }
}

