import { getOrderlyPrice } from '../../orderly/api/market';
import { placeNewOrder, enterShortPosition, enterLongPosition } from '../api/manageOrders';
import { token } from '../../types/tokenTypes';
import { closeAllPositions, cancelAllOrders } from '../api/closePositions';
import { initClients, clients, disconnectClients } from './websocketManger';
import { shouldStop, forceStop } from '../../globals';
import { recordTrade } from '../../db/queries';
import { handleOrder } from './manageOrder';

export async function executeArbitrage(token: token) {
  try {
    let orderlyPrice: number | null = null;
    let orderlyTimestamp: number | null = null;
    let binancePrice: number | null = null;
    let binanceTimestamp: number | null = null;

    if (!clients[token.binanceSymbol]) {
      await initClients(token);
    }

    const {
      orderlyClient,
      binanceUserDataStream,
      binanceMarketStream,
      binanceAPIws,
    } = clients[token.binanceSymbol];

    // 초기 시장가 가져와서 주문
    orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
    console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
    const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } 
    = await placeNewOrder(token, orderlyPrice);
     
    let previousOrderlyPrice = orderlyPrice;
    let binanceBuyId = longPositionId;
    let binanceSellId = shortPositionId;
    let binanceBuyPrice = longPositionPrice;
    let binanceSellPrice = shortPositionPrice;
    let orderlyPriceUpdated = false;
    let binancePriceUpdated = false;
    let positionFilled = false;
   
    //오덜리 시장가 가져오기
    await orderlyClient.markPrice(token.orderlySymbol);
    orderlyClient.setMessageCallback(async (message) => {
      try {
        if (message.topic === `${token.orderlySymbol}@markprice`){
          const data = message.data;
          orderlyPrice = parseFloat(data.price);
          orderlyTimestamp = message.ts;
          console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
          
          //시장가에 따라 바이낸스 주문 수정
          if (orderlyPrice !== previousOrderlyPrice && !positionFilled) {
            const { longPositionPrice, shortPositionPrice } 
            = await handleOrder(binanceAPIws, token, orderlyPrice, binanceBuyId, binanceSellId, binanceBuyPrice, binanceSellPrice);
            binanceBuyPrice = longPositionPrice;
            binanceSellPrice = shortPositionPrice;
            previousOrderlyPrice = orderlyPrice;
          }

          if(positionFilled){
            orderlyPriceUpdated = true;
            checkAndComparePrices();
          }
        }
      } catch (error) {
        console.error('Error in orderlyClient message callback:', error);
        throw error;
      }
    });

    //바이낸스 유저 데이터 스트림
    binanceUserDataStream.setHandler('ORDER_TRADE_UPDATE', async (message) => {
      const orderUpdate = message.o;
      //포지션 체결되었을 시
      if (orderUpdate.X === 'FILLED' && (orderUpdate.i === binanceBuyId || orderUpdate.i === binanceSellId)) {
        await orderlyClient.unsubMarkPrice(token.orderlySymbol);

        console.log('Binance order filled:', JSON.stringify(orderUpdate));
        console.log('Binance order filled:', orderUpdate.S);
        console.log('Binance order filled:', typeof(orderUpdate.S));

        if(orderUpdate.S === 'SELL'){
          const orderlyBuyPrice = await enterLongPosition(token, binanceBuyId);
          await orderlyClient.markPrice(token.orderlySymbol);
          
          token.state.setEnterPrice(binanceSellPrice);
          const priceDifference = ((binanceSellPrice - orderlyBuyPrice) / orderlyBuyPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
        }
        else{
          const orderlySellPrice = await enterShortPosition(token, binanceSellId);
          await orderlyClient.markPrice(token.orderlySymbol);
        
          token.state.setEnterPrice(binanceBuyPrice);
          const priceDifference = ((binanceBuyPrice - orderlySellPrice) / orderlySellPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
        }
      }
    });

    // ACCOUNT_UPDATE
    binanceUserDataStream.setHandler('ACCOUNT_UPDATE', (message) => {
      //console.log('Binance ACCOUNT_UPDATE:', JSON.stringify(message));
    });

    //바이낸스 시장가 스트림
    binanceMarketStream.setHandler('markPriceUpdate', (params) => {
      binancePrice = parseFloat(params.p);
      binanceTimestamp = params.E;  
      console.log(`[${token.binanceSymbol}][B] Mark Price: `, binancePrice);
      
      if(positionFilled){
        binancePriceUpdated = true;
        checkAndComparePrices();
      }
    });

    async function comparePrices() {
      try {
        if (orderlyPrice !== null && binancePrice !== null && orderlyTimestamp !== null && binanceTimestamp !== null) {
          const timestampDifference = Math.abs(orderlyTimestamp - binanceTimestamp);
          if (timestampDifference <= 500) {  // 0.5초 이내의 차이인 경우
              const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
              console.log(`<<<< INIT PRICE DIFFERENCE: ${token.state.getInitialPriceDifference()} >>>>`)
              console.log(`<<<< Current Price Difference: ${priceDifference}% >>>>`);

              // 청산 조건 확인
              if (Math.abs(priceDifference) <= token.closeThreshold) {
                await closeAllPositions(token);
                await cancelAllOrders(token);
                console.log(`<<<< [${token.binanceSymbol}] Closing positions due to close threshold >>>>`);

                token.state.setClosePriceDifference(priceDifference);
                await recoredAndReset(token);
                
                await orderlyClient.unsubMarkPrice(token.orderlySymbol);
                positionFilled = false;

                //주문 다시 실행 
                orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
                console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
                const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } 
                = await placeNewOrder(token, orderlyPrice);
                
                previousOrderlyPrice = orderlyPrice;
                binanceBuyId = longPositionId;
                binanceSellId = shortPositionId;
                binanceBuyPrice = longPositionPrice;
                binanceSellPrice = shortPositionPrice;

                await orderlyClient.markPrice(token.orderlySymbol);

                //return;
              }
          }
        }
      } catch (error) {
        console.error('Error in comparePrices:', error);
        throw error;
      }
    }

    async function checkAndComparePrices() {
        if (orderlyPriceUpdated && binancePriceUpdated) {
            comparePrices();
            orderlyPriceUpdated = false;
            binancePriceUpdated = false;
        }
    }
  } catch (error) {
    console.error('Error in executeArbitrage:', error);
    await closeAllPositions(token);
    await cancelAllOrders(token);
    await disconnectClients(token);
    throw error;
  } 
}

export async function recoredAndReset(token: token) {
  try {
    await recordTrade(
      token.binanceSymbol,
      token.state.getInitialPriceDifference(),
      token.state.getClosePriceDifference(),
      token.state.getEnterPrice(),
      token.state.getClosePrice()
    );
    console.log(`[${token.binanceSymbol}] Recorded at table`);
  } catch (err) {
    console.log('Error during recording at table', err);
  } finally {
    token.state.reset();
  }
}
