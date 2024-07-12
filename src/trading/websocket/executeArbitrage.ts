import { getOrderlyPrice } from '../../orderly/api/market';
import { shouldStop, forceStop } from '../../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from '../manageOrders';
import { token } from '../../types/tokenTypes';
import { closeAllPositions, cancelAllOrders } from '../../trading/closePositions';
import { initClients, clients } from './websocketManger';


export async function executeArbitrage(token: token) {
  try {
    let orderlyPrice: number | null = null;
    let orderlyTimestamp: number | null = null;
    let binancePrice: number | null = null;
    let binanceTimestamp: number | null = null;
    let orderlyPriceUpdated = false;
    let binancePriceUpdated = false;

    if (!clients[token.binanceSymbol]) {
      await initClients(token);
    }

    const { orderlyClient, binanceClient, binanceClient2 } = clients[token.binanceSymbol];

    // 초기 시장가 가져와서 주문
    orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
    console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
    const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } 
    = await placeNewOrder(token, orderlyPrice);
     
    let previousOrderlyPrice = orderlyPrice;
    let binanceBuyPrice = longPositionPrice;
    let binanceSellPrice = shortPositionPrice;
    let positionFilled = false;

    //오덜리 시장가 가져오기 + 바이낸스 주문 수정
    await orderlyClient.markPrice(token.orderlySymbol);
    orderlyClient.setMessageCallback(async (message) => {
        if (message.topic === `${token.orderlySymbol}@markprice`){
        const data = message.data;
        orderlyPrice = parseFloat(data.price);
        orderlyTimestamp = message.ts;
        console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
        
        if (orderlyPrice !== previousOrderlyPrice && !positionFilled) {
          const { longPositionPrice, shortPositionPrice } 
          = await handleOrder(token, orderlyPrice, longPositionId, shortPositionId, binanceBuyPrice, binanceSellPrice);
          binanceBuyPrice = longPositionPrice;
          binanceSellPrice = shortPositionPrice;
          previousOrderlyPrice = orderlyPrice;
        }

        if(positionFilled){
          checkAndComparePrices();
        }
      }
    });

    //바이낸스 유저 데이터 스트림
    binanceClient.setHandler('ORDER_TRADE_UPDATE', async (message) => {
      const orderUpdate = message.o;
      if (orderUpdate.X === 'FILLED' && (orderUpdate.i === longPositionId || orderUpdate.i === shortPositionId)) {
        console.log('Binance order filled:', JSON.stringify(orderUpdate));
        //숏 포지션 체결
        if(orderUpdate.S === 'SELL'){
          const orderlyBuyPrice = await enterLongPosition(token, longPositionId);
          
          token.state.setEnterPrice(binanceSellPrice);
          const priceDifference = ((binanceSellPrice - orderlyBuyPrice) / orderlyBuyPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
          binanceClient.disconnect();
        }
        //롱 포지션 체결
        else{
          const orderlySellPrice = await enterShortPosition(token, shortPositionId);
         
          token.state.setEnterPrice(binanceBuyPrice);
          const priceDifference = ((binanceBuyPrice - orderlySellPrice) / orderlySellPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
          positionFilled = true;
          binanceClient.disconnect();
        }
      }
    });

    //바이낸스 시장가 스트림
    binanceClient2.setHandler('markPriceUpdate', (params) => {
      binancePrice = parseFloat(params.p);
      binanceTimestamp = params.E;  
      // console.log('binancePrice ws:', binancePrice);
      // console.log('binanceTIME ws:', binanceTimestamp);
      binancePriceUpdated = true;

      if(positionFilled){
        checkAndComparePrices();
      }
    });

    async function comparePrices() {
      if (orderlyPrice !== null && binancePrice !== null && orderlyTimestamp !== null && binanceTimestamp !== null) {
          const timestampDifference = Math.abs(orderlyTimestamp - binanceTimestamp);
          if (timestampDifference <= 500) {  // 0.5초 이내의 차이인 경우
              const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
              console.log(`Price Difference: ${priceDifference}%`);
              // 여기에 원하는 함수 호출

              // 청산 조건 확인
              if (Math.abs(priceDifference) <= token.closeThreshold) {
                console.log(`<<<< [${token.binanceSymbol}] Closing positions due to close threshold >>>>`);

                await closeAllPositions(token);
                await cancelAllOrders(token);

                token.state.setClosePriceDifference(priceDifference);
                return;
              }
          }
      }
    }

    async function checkAndComparePrices() {
        if (orderlyPriceUpdated && binancePriceUpdated) {
            comparePrices();
            orderlyPriceUpdated = false;
            binancePriceUpdated = false;
        }
    }
    
    //바이낸스는 한시간 넘기전에 listenKey 업데이트 해줘야함!!!
  } catch (error) {
    console.error('Error in executeArbitrage:', error);
    throw error;
  } finally {
  }
}