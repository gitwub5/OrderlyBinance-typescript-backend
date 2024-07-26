import { getOrderlyPrice } from '../../orderly/api/market';
import { Token } from '../../types/tokenTypes';
import { closeAllPositions as closeAllPositionsAPI } from '../api/closePositions';
import { closeAllPositions, cancelAllOrders } from './closePositions';
import { initClients, clients, disconnectClients } from './websocketManger';
import { placeNewOrder, handleOrder, placeBuyOrder, placeSellOrder } from './manageOrder';
import { shutdown } from '../../index';
import { recordTrade } from '../../db/queries';
import { sendTelegramMessage } from '../../utils/telegram/telegramBot';
import { shouldStop, forceStop } from '../../globals';

export async function executeArbitrage(token: Token) {
  let errorCounter = 0;
  let lastPositionCheck = 0;

  try {
    let orderlyPrice: number | null = null;
    let orderlyTimestamp: number | null = null;
    let binancePrice: number | null = null;
    let binanceTimestamp: number | null = null;

    if (!clients[token.symbol]) {
      await initClients(token);
    }

    const {
      orderlyPublic,
      orderlyPrivate,
      binanceUserDataStream,
      binanceMarketStream,
      binanceAPIws,
    } = clients[token.symbol];

    // 초기 시장가 가져와서 주문
    orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
    console.log(`[${token.symbol}][O] Initial Mark Price: `, orderlyPrice);
    const {
      longPositionId,
      longPositionPrice,
      shortPositionId,
      shortPositionPrice,
    } = await placeNewOrder(token, orderlyPrice);

    let previousOrderlyPrice = orderlyPrice;
    let binanceBuyId = longPositionId;
    let binanceSellId = shortPositionId;
    let binanceBuyPrice = longPositionPrice;
    let binanceSellPrice = shortPositionPrice;
    let orderlyPriceUpdated = false;
    let binancePriceUpdated = false;
    let positionFilled = false;

    //오덜리 시장가 가져오기 (public)
    await orderlyPublic.markPrice(token.orderlySymbol);
    orderlyPublic.setMessageCallback(async (message) => {
      if (message.topic === `${token.orderlySymbol}@markprice`) {
        const data = message.data;
        orderlyPrice = parseFloat(data.price);
        orderlyTimestamp = message.ts;
        //console.log(`[${token.symbol}][O] Mark Price: `, orderlyPrice);

        //시장가에 따라 바이낸스 주문 수정
        if (orderlyPrice !== previousOrderlyPrice && !positionFilled) {
          const { longPositionPrice, shortPositionPrice } = await handleOrder(
            binanceAPIws,
            token,
            orderlyPrice,
            binanceBuyId,
            binanceSellId,
            binanceBuyPrice,
            binanceSellPrice
          );
          binanceBuyPrice = longPositionPrice;
          binanceSellPrice = shortPositionPrice;
          previousOrderlyPrice = orderlyPrice;
        }

        orderlyPriceUpdated = true;
        checkAndComparePrices();
      }
    });

    //오덜리 Execution Report 가져오기 (private)
    await orderlyPrivate.executionReport();
    orderlyPrivate.setPrivateMessageCallback((message) => {
      if (
        message.topic === "executionreport" &&
        message.data.symbol === token.orderlySymbol
      ) {
        const data = message.data;
        // 거래 FILLED 경우에 저장
        // && data.type === market 추가 고려 (limit 거래로 바꾸면 필요x)
        if (data.status === "FILLED") {
          if (token.state.getOrderlySide() === "") {
            // enter
            token.state.setOrderlyEnterPrice(data.executedPrice);
            token.state.setOrderlySide(data.side);
          } else if (data.side !== token.state.getOrderlySide()) {
            // close (반대 side)
            token.state.setOrderlyClosePrice(data.executedPrice);
          }
        }
      }
    });

    //바이낸스 유저 데이터 스트림 핸들러
    binanceUserDataStream.setHandler("ORDER_TRADE_UPDATE", async (message) => {
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
        
        let orderlyEnterPrice;
        if (orderUpdate.S === 'BUY'){
          orderlyEnterPrice = await placeSellOrder(token);
          await binanceAPIws.cancelOrder(token.binanceSymbol, binanceSellId);
          console.log(`<<<< [${token.symbol}][B] SELL order canceled >>>>`);
        }
        else if(orderUpdate.S === 'SELL'){
          orderlyEnterPrice = await placeBuyOrder(token);
          await binanceAPIws.cancelOrder(token.binanceSymbol, binanceBuyId);
          console.log(`<<<< [${token.symbol}][B] BUY order canceled >>>>`);
        }
        else{
          console.error(`Unexpected order side: ${orderUpdate.S}`);
          await shutdown();
          return;
        }

        const binanceEnterPrice = parseFloat(orderUpdate.ap);
        token.state.setBinanceEnterPrice(binanceEnterPrice);
        token.state.setBinanceSide(orderUpdate.S);
        const priceDifference = ((binanceEnterPrice - orderlyEnterPrice) / orderlyEnterPrice) * 100;
        token.state.setInitialPriceDifference(priceDifference);
        console.log(`<<<< Initial Price Difference: ${token.state.getInitialPriceDifference()} >>>>`);
      }
      //포지션 정리되었을 때
      if (
        orderUpdate.s === token.binanceSymbol &&
        orderUpdate.X === "FILLED" &&
        orderUpdate.o === "MARKET"
      ) {
        token.state.setBinanceClosePrice(parseFloat(orderUpdate.ap));
      }
    });

    // 바이낸스 유저 데이터 스트림 ACCOUNT_UPDATE 핸들러
    binanceUserDataStream.setHandler("ACCOUNT_UPDATE", (message) => {
      //console.log('Binance ACCOUNT_UPDATE:', JSON.stringify(message));
    });

    //바이낸스 시장가 스트림 핸들러
    binanceMarketStream.setHandler("markPriceUpdate", (params) => {
      if (params.s === token.binanceSymbol) { // Filter updates for the specific token symbol
        binancePrice = parseFloat(params.p);
        binanceTimestamp = params.E;
        //console.log(`[${token.symbol}][B] Mark Price: `, binancePrice);

        binancePriceUpdated = true;
        checkAndComparePrices();

        const currentTime = Date.now();
        // 10초마다 한번씩 열린 포지션 있는지 확인 (요청 너무 많아져서 10초 인터벌 부여)
        if (currentTime - lastPositionCheck >= 10000) {
          lastPositionCheck = currentTime;
          binanceAPIws.positionInfo(token.binanceSymbol);
        }
      } else {
        console.log(`Ignored update for ${params.s}`);
      }
    });

    //바이낸스 API 웹소켓 핸들러
    binanceAPIws.setMessageCallback(async (message) => {
      //주문가 변경시 에러 3번 연속으로 발생 시 종료 (재시작)
      if (message.error) {
        console.log(`${token.symbol}:`, message.error);
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
      if (!positionFilled) {
        if (message.id === "id-positionInformation") {
          console.log(`[${token.symbol}][B]Position Information: ${parseFloat(message.result[0].positionAmt)}`);

          if (parseFloat(message.result[0].positionAmt) !== 0.0) {
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
        if (
          orderlyPrice !== null &&
          binancePrice !== null &&
          orderlyTimestamp !== null &&
          binanceTimestamp !== null
        ) {
          const timestampDifference = Math.abs(
            orderlyTimestamp - binanceTimestamp
          );
          if (timestampDifference <= 100) {
            // 0.1초 이내의 차이인 경우
            const priceDifference =
              ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
            
            console.log(`
              ===================================
              Token: ${token.symbol}
              -----------------------------------
              Binance Price:    ${binancePrice.toFixed(4)}
              Orderly Price:    ${orderlyPrice.toFixed(4)}
              Price Difference: ${priceDifference.toFixed(8)}%
              ===================================
              `);

            if(positionFilled){    
              // //버전#1: 손절 갭 임의로 설정
              // if (Math.abs(priceDifference) <= token.closeThreshold) {
              // //버전#2: 초기 갭차이의 절반 이하로 떨어지면 손절
              if (Math.abs(priceDifference) < Math.abs(token.state.getInitialPriceDifference() / 2)) {
                await closeAllPositions(binanceAPIws, token);
                await cancelAllOrders(token);
                console.log(`<<<< [${token.symbol}] Arbitrage close complete: Positions closed and orders canceled >>>>`);

                await orderlyPublic.unsubMarkPrice(token.orderlySymbol);
                positionFilled = false;

                token.state.setClosePriceDifference(priceDifference);

                await sendTelegramMessage(
                  token.binanceSymbol,
                  token.orderSize,
                  token.state.getBinanceSide(),
                  token.state.getBinanceEnterPrice(),
                  token.state.getBinanceClosePrice(),
                  token.state.getOrderlySide(),
                  token.state.getOrderlyEnterPrice(),
                  token.state.getOrderlyClosePrice(),
                  token.state.getInitialPriceDifference()
                );
                await recordAndReset(token);

                //주문 다시 실행
                orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
                console.log(`[${token.symbol}][O] Mark Price: `, orderlyPrice);
                const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice }
                = await placeNewOrder(token, orderlyPrice);

                previousOrderlyPrice = orderlyPrice;
                binanceBuyId = longPositionId;
                binanceSellId = shortPositionId;
                binanceBuyPrice = longPositionPrice;
                binanceSellPrice = shortPositionPrice;

                await orderlyPublic.markPrice(token.orderlySymbol);

                //await executeArbitrage(token);
                //return;
              }
            }
          }
        }
      } catch (error) {
        console.error("Error in comparePrices:", error);
        throw error;
      }
    }

    async function checkAndComparePrices() {
      if (orderlyPriceUpdated && binancePriceUpdated) {
        await comparePrices();
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
      token.state.getBinanceSide(),
      token.state.getBinanceEnterPrice(),
      token.state.getBinanceClosePrice(),
      token.state.getOrderlySide(),
      token.state.getOrderlyEnterPrice(),
      token.state.getOrderlyClosePrice(),
      token.orderSize
    );

    console.log(`[${token.symbol}] Recorded at table`);
  } catch (err) {
    console.log("Error during recording at table", err);
  } finally {
    token.state.reset();
  }
}