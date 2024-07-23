import { getOrderlyPrice } from '../../orderly/api/market';
import { placeNewOrder, enterShortPosition, enterLongPosition } from '../api/manageOrders';
import { Token } from '../../types/tokenTypes';
import { cancelAllOrders, closeAllPositions as closeAllPositionsAPI } from '../api/closePositions';
import { closeAllPositions } from './closePositions';
import { initClients, clients, disconnectClients } from './websocketManger';
import { shouldStop, forceStop } from '../../globals';
import { recordTrade } from '../../db/queries';
import { handleOrder } from './manageOrder';
import { shutdown } from '../../index';
import { sendTelegramMessage } from '../../utils/telegram/telegramBot';

export async function executeArbitrage(token: Token) {
  let errorCounter = 0;
  let lastPositionCheck = 0;

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
            const { longPositionPrice, shortPositionPrice } = await handleOrder(binanceAPIws, token, orderlyPrice, binanceBuyId, binanceSellId, binanceBuyPrice, binanceSellPrice);
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

    //바이낸스 유저 데이터 스트림 핸들러
    binanceUserDataStream.setHandler('ORDER_TRADE_UPDATE', async (message) => {
      const orderUpdate = message.o;
      //포지션 체결되었을 시
      if (
        orderUpdate.s === token.binanceSymbol &&
        orderUpdate.X === "FILLED" &&
        orderUpdate.o === "LIMIT" &&
        (orderUpdate.i === binanceBuyId || orderUpdate.i === binanceSellId)
      ) {
        positionFilled = true;
        console.log("Binance order filled:", JSON.stringify(orderUpdate));

        if (orderUpdate.S === "SELL") {
          const orderlyBuyPrice = await enterLongPosition(token, binanceBuyId);

          const binanceEnterPrice = parseFloat(orderUpdate.ap);
          token.state.setEnterPrice(binanceEnterPrice);
          const priceDifference = ((binanceEnterPrice - orderlyBuyPrice) / orderlyBuyPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
        } else {
          const orderlySellPrice = await enterShortPosition(token, binanceSellId);

          const binanceEnterPrice = parseFloat(orderUpdate.ap);
          token.state.setEnterPrice(binanceEnterPrice);
          const priceDifference = ((binanceEnterPrice - orderlySellPrice) / orderlySellPrice) * 100;
          token.state.setInitialPriceDifference(priceDifference);
        }
      }

      //포지션 정리되었을 때
      if (
        orderUpdate.s === token.binanceSymbol &&
        orderUpdate.X === "FILLED" &&
        orderUpdate.o === "MARKET"
      ) {
        token.state.setClosePrice(parseFloat(orderUpdate.ap));
      }
    });

    // ACCOUNT_UPDATE 핸들러
    binanceUserDataStream.setHandler('ACCOUNT_UPDATE', (message) => {
      //console.log('Binance ACCOUNT_UPDATE:', JSON.stringify(message));
    });

    //바이낸스 시장가 스트림 핸들러
    binanceMarketStream.setHandler('markPriceUpdate', (params) => {
      binancePrice = parseFloat(params.p);
      binanceTimestamp = params.E;  
      console.log(`[${token.binanceSymbol}][B] Mark Price: `, binancePrice);
      
      if(positionFilled){
        binancePriceUpdated = true;
        checkAndComparePrices();
      }
      else { //10초마다 한번씩 열린 포지션 있는지 확인 (요청 너무 많아져서 줄임)
        const currentTime = Date.now();
        if (currentTime - lastPositionCheck >= 10000) {
          lastPositionCheck = currentTime;
          binanceAPIws.positionInfo(token.binanceSymbol);
        }
      }
    });

    //바이낸스 API 웹소켓 핸들러
    binanceAPIws.setMessageCallback(async (message) => {
      //주문가 변경시 에러 3번 연속으로 발생 시 종료 (재시작)
      if (message.error) {
        console.log(`${token.binanceSymbol}:`, message.error);
        if (message.error.code === -2013) {
          errorCounter++;
          if (errorCounter >= 3) {
            console.error(
              "Error code -2013 encountered 3 times. Throwing error and shutting down."
            );
            await shutdown();
            throw new Error(
              "Order does not exist error occurred 3 times consecutively."
            );
          }
        } else {
          errorCounter = 0; // Reset the counter for other errors
        }
      }

       //아비트리징 아닌데 열려있는 포지션이 있다면 닫고 다시 시작
      if(!positionFilled){
        if (message.id === "id-positionInformation") {
          console.log(`[${token.binanceSymbol}][B]Position Information: ${parseFloat(message.result[0].positionAmt)}`);
          if(parseFloat(message.result[0].positionAmt) !== 0.0){
            await closeAllPositions(binanceAPIws, token);
            await cancelAllOrders(token);
            token.state.reset();
            await executeArbitrage(token);
          }
        } else {
          //console.log("Other Message:", message);
        }
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

              // 손절 조건 확인
              // 버전#2: 초기 갭차이의 절반 이하로 떨어지면 손절
              if (Math.abs(priceDifference) < Math.abs(token.state.getInitialPriceDifference() / 2)) {
              // //버전#1: 손절 갭 임의로 설정
              // if (Math.abs(priceDifference) <= token.closeThreshold) {
                await closeAllPositions(binanceAPIws, token);
                await cancelAllOrders(token);
                console.log(`<<<< [${token.binanceSymbol}] Closing positions due to close threshold >>>>`);

                await orderlyClient.unsubMarkPrice(token.orderlySymbol);
                positionFilled = false;

                token.state.setClosePriceDifference(priceDifference);

                console.log(token.state.getEnterPrice());
                console.log(token.state.getClosePrice());
                console.log(token.state.getInitialPriceDifference());
                console.log(token.state.getClosePriceDifference());

                await sendTelegramMessage(
                  token.binanceSymbol,
                  token.orderSize,
                  token.state.getEnterPrice(),
                  token.state.getClosePrice(),
                  token.state.getInitialPriceDifference()
                );
                await recordAndReset(token);

                //주문 다시 실행 
                await executeArbitrage(token);

                // orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
                // console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
                // const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } 
                // = await placeNewOrder(token, orderlyPrice);
                
                // previousOrderlyPrice = orderlyPrice;
                // binanceBuyId = longPositionId;
                // binanceSellId = shortPositionId;
                // binanceBuyPrice = longPositionPrice;
                // binanceSellPrice = shortPositionPrice;

                // await orderlyClient.markPrice(token.orderlySymbol);

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
    await closeAllPositionsAPI(token);
    await cancelAllOrders(token);
    await disconnectClients(token);
    throw error;
  } 
}

export async function recordAndReset(token: Token) {
  try {
    await recordTrade(
      token.binanceSymbol,
      token.state.getInitialPriceDifference(),
      token.state.getClosePriceDifference(),
      token.state.getEnterPrice(),
      token.state.getClosePrice(),
      token.orderSize
    );

    console.log(`[${token.binanceSymbol}] Recorded at table`);
  } catch (err) {
    console.log("Error during recording at table", err);
  } finally {
    token.state.reset();
  }
}