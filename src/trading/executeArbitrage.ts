import { getOrderlyPrice } from '../orderly/market';
import { shouldStop } from '../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { interval } from './stratgy';
import { getBinanceOrderStatus } from '../binance/order';
import { token } from '../types/tokenTypes';
import { closePositions } from './closePositions';

export async function executeArbitrage(token: token) {
  try {
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

          if (longPositionStatus.status === 'FILLED') {
              console.log(`<<<< Long Position filled on Binance >>>>`);
              await enterShortPosition(token, shortPositionId);
              await monitorClosePositions(token);
              positionFilled = true;
          } else if (shortPositionStatus.status === 'FILLED') {
              console.log(`<<<< Short Position filled on Binance >>>>`);
              await enterLongPosition(token, longPositionId);
              await monitorClosePositions(token);
              positionFilled = true;
          } else {
              orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
              console.log(`[Orderly] ${token.orderlySymbol} Mark Price: `, orderlyPrice);

              if (orderlyPrice !== previousOrderlyPrice) {
                  await handleOrder(token.binanceSymbol, orderlyPrice, token.arbitrageThreshold, longPositionId, shortPositionId);
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
        while (!shouldStop) {
            await executeArbitrage(token);
            console.log('<<<< Arbitrage iteration completed >>>>');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } catch (error) {
        console.error('Error in manageArbitrage:', error);
        await closePositions(token);
        throw error;
    } finally {
        console.log('Exiting manageOrders...');
    }
}

