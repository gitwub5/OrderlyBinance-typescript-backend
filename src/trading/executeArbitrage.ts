import { getOrderlyPrice } from '../orderly/market';
import { shouldStop } from '../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { interval } from './stratgy';
import { getBinanceOrderStatus } from '../binance/order';
import { token } from '../types/tokenTypes';

export async function executeArbitrage(token: token) {
    try {
      // 초기 시장가 가져오기

      const orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
      console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
      // 새로운 주문 배치
      const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } = await placeNewOrder(token, orderlyPrice);
      
      let positionFilled = false;
      let previousOrderlyPrice = orderlyPrice;
      let binanceBuyPrice = longPositionPrice;
      let binanceSellPrice = shortPositionPrice;
  
      // 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      while (!positionFilled) {
        const [longPositionStatus, shortPositionStatus] = await Promise.all([
          getBinanceOrderStatus(token.binanceSymbol, longPositionId),
          getBinanceOrderStatus(token.binanceSymbol, shortPositionId)
        ]);
  
        // 롱 포지션이 채워졌을 때
        if (longPositionStatus === 'FILLED') {
          console.log(`<<<< [${token.binanceSymbol}] Long Position filled on Binance >>>>`);
          const orderlySellPrice = await enterShortPosition(token, shortPositionId);
  
          await monitorClosePositions(token);
  
          const priceDifference = ((binanceBuyPrice - orderlySellPrice) / orderlySellPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
          return;
        } 
        // 숏 포지션이 채워졌을 때
        else if (shortPositionStatus === 'FILLED') {
          console.log(`<<<< [${token.binanceSymbol}] Short Position filled on Binance >>>>`);
          const orderlyBuyPrice = await enterLongPosition(token, longPositionId);
  
          await monitorClosePositions(token);
  
          const priceDifference = ((binanceSellPrice - orderlyBuyPrice) / orderlyBuyPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
          return;
        } 
        // 포지션이 채워지지 않았을 때
        else {
          const orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
          console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
  
          if (orderlyPrice !== previousOrderlyPrice) {
            const { longPositionPrice, shortPositionPrice } = await handleOrder(token, orderlyPrice, longPositionId, shortPositionId, binanceBuyPrice, binanceSellPrice);
            binanceBuyPrice = longPositionPrice;
            binanceSellPrice = shortPositionPrice;
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
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    } catch (error) {
        console.error('Error in manageArbitrage:', error);
        throw error;
    } finally {
        console.log('Exiting manageOrders...');
    }
}

