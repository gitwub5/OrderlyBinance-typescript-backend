import { getOrderlyPrice } from '../../orderly/api/market';
import { Token } from '../../types/tokenTypes';
import { closeAllPositions as closeAllPositionsAPI } from '../api/closePositions';
import { closeAllPositions, cancelAllOrders, closeOrderlyPositionsMarketOrder } from './closePositions';
import { initClients, clients, disconnectClients } from './websocketManger';
import { placeNewOrder, handleOrder, placeBuyOrder, placeSellOrder } from './manageOrder';
import { shutdown } from '../../index';
import { recordTrade } from '../../db/queries';
import { sendTelegramMessage } from '../../utils/telegram/telegramBot';
import { delay } from '../../utils/delay'
import { shouldStop, forceStop } from '../../globals';

class ArbitrageState {
  orderlyPrice: number | null = null;
  orderlyTimestamp: number | null = null;
  binancePrice: number | null = null;
  binanceTimestamp: number | null = null;
  positionFilled: boolean = false;
  isOrderlyPositionClosed: boolean = false;
  binanceBuyId: number | null = null;
  binanceSellId: number | null = null;
  binanceBuyPrice: number | null = null;
  binanceSellPrice: number | null = null;
  previousOrderlyPrice: number | null = null;

  reset() {
    this.orderlyPrice = null;
    this.orderlyTimestamp = null;
    this.binancePrice = null;
    this.binanceTimestamp = null;
    this.positionFilled = false;
    this.isOrderlyPositionClosed = false;
    this.binanceBuyId = null;
    this.binanceSellId = null;
    this.binanceBuyPrice = null;
    this.binanceSellPrice = null;
    this.previousOrderlyPrice = null;
  }
}

export async function executeArbitrage(token: Token) {
  const state = new ArbitrageState();
  let errorCounter = 0;
  let lastPositionCheck = 0;
  let orderlyPriceUpdated = false;
  let binancePriceUpdated = false;

  try {
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
    state.orderlyPrice  = await getOrderlyPrice(token.orderlySymbol);
    console.log(`[${token.symbol}][O] Initial Mark Price: `, state.orderlyPrice );
    const {
      longPositionId,
      longPositionPrice,
      shortPositionId,
      shortPositionPrice,
    } = await placeNewOrder(token, state.orderlyPrice );

    state.binanceBuyId = longPositionId;
    state.binanceSellId = shortPositionId;
    state.binanceBuyPrice = longPositionPrice;
    state.binanceSellPrice = shortPositionPrice;
    state.previousOrderlyPrice = state.orderlyPrice;

    //오덜리 시장가 가져오기 (public)
    await orderlyPublic.markPrice(token.orderlySymbol);
    orderlyPublic.setMessageCallback(async (message) => {
      if (message.topic === `${token.orderlySymbol}@markprice`) {
        const data = message.data;
        state.orderlyPrice = parseFloat(data.price);
        state.orderlyTimestamp = message.ts;

        //console.log(`[${token.symbol}][O] Mark Price: `, orderlyPrice);

        //시장가에 따라 바이낸스 주문 수정
        if (state.orderlyPrice !== state.previousOrderlyPrice && !state.positionFilled) {
          const { longPositionPrice, shortPositionPrice } = await handleOrder(
            binanceAPIws,
            token,
            state.orderlyPrice,
            state.binanceBuyId!,
            state.binanceSellId!,
            state.binanceBuyPrice!,
            state.binanceSellPrice!
          );
          state.binanceBuyPrice = longPositionPrice;
          state.binanceSellPrice = shortPositionPrice;
          state.previousOrderlyPrice = state.orderlyPrice;
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
        if (data.status === "FILLED") {
          if (!token.state.getOrderlySide()) {
            // enter
            token.state.setOrderlyEnterPrice(data.executedPrice);
            token.state.setOrderlySide(data.side);
          } 
          else {
            // close (반대 side)
            token.state.setOrderlyClosePrice(data.executedPrice);
            state.isOrderlyPositionClosed = true;
          }
        }
      }
    });

    //바이낸스 유저 데이터 스트림 핸들러
    binanceUserDataStream.setHandler("ORDER_TRADE_UPDATE", async (message) => {
      const orderUpdate = message.o;
      if (
        orderUpdate.s === token.binanceSymbol &&
        orderUpdate.X === "FILLED" &&
        orderUpdate.o === "LIMIT" &&
        (orderUpdate.i === state.binanceBuyId || orderUpdate.i === state.binanceSellId)
      ) {
        state.positionFilled = true;
        //console.log("Binance order filled:", JSON.stringify(orderUpdate));
        
        let orderlyEnterPrice;
        if (orderUpdate.S === 'BUY') {
          orderlyEnterPrice = await placeSellOrder(token);
          await binanceAPIws.cancelOrder(token.binanceSymbol, state.binanceSellId!);
          console.log(`<<<< [${token.symbol}][B] SELL order canceled >>>>`);
        } else if (orderUpdate.S === 'SELL') {
          orderlyEnterPrice = await placeBuyOrder(token);
          await binanceAPIws.cancelOrder(token.binanceSymbol, state.binanceBuyId!);
          console.log(`<<<< [${token.symbol}][B] BUY order canceled >>>>`);
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
        state.binancePrice = parseFloat(params.p);
        state.binanceTimestamp = params.E;

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
    binanceAPIws.setMessageCallback(async (message: any) => {
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
      if (!state.positionFilled) {
        if (message.id === "id-positionInformation") {
          console.log(`[${token.symbol}][B]Position Information: ${parseFloat(message.result[0].positionAmt)}`);

          if (parseFloat(message.result[0].positionAmt) !== 0.0) {
            await closeAllPositions(binanceAPIws, token);
            await cancelAllOrders(token);
            token.state.reset();
            await delay(2000);
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
          state.orderlyPrice !== null &&
          state.binancePrice !== null &&
          state.orderlyTimestamp !== null &&
          state.binanceTimestamp !== null
        ) {
          const timestampDifference = Math.abs(
            state.orderlyTimestamp - state.binanceTimestamp
          );
          if (timestampDifference <= 100) {
            // 0.1초 이내의 차이인 경우
            const priceDifference =
              ((state.binancePrice - state.orderlyPrice) / state.orderlyPrice) * 100;
            
            console.log(`[${token.symbol}] Binance: ${state.binancePrice.toFixed(4)} | Orderly: ${state.orderlyPrice.toFixed(4)} | Diff: ${priceDifference.toFixed(8)}%`);

            // console.log(`
            //   ===================================
            //   Token: ${token.symbol}
            //   -----------------------------------
            //   Binance Price:    ${binancePrice.toFixed(4)}
            //   Orderly Price:    ${orderlyPrice.toFixed(4)}
            //   Price Difference: ${priceDifference.toFixed(8)}%
            //   ===================================
            //   `);

            if(state.positionFilled){    
              // //버전#1: 손절 갭 임의로 설정
              // if (Math.abs(priceDifference) <= token.closeThreshold) {
              // //버전#2: 초기 갭차이의 절반 이하로 떨어지면 손절
              if (Math.abs(priceDifference) < Math.abs(token.state.getInitialPriceDifference() / 2)) {
                await closeAllPositions(binanceAPIws, token);

                await orderlyPublic.unsubMarkPrice(token.orderlySymbol);

                //ASK, BID 주문으로 포지션을 닫는 경우 -> 포지션이 닫힐 때까지 기다려야함
                //지정가 주문 ->  주문 체결될때까지 대기  -> 웹소켓에 주문 체결 이벤트 오면 주문 번호랑 동일한지 확인하고 체결이 되면 그때부터 밑 코드 진행 
                await waitForOrderlyPositionToClose(10000); // 최대 10초 대기
                state.isOrderlyPositionClosed = false;

                await cancelAllOrders(token);
                console.log(`<<<< [${token.symbol}] Arbitrage close complete: Positions closed and orders canceled >>>>`);

                state.positionFilled = false;

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

                state.reset();
                await executeArbitrage(token);
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

    async function waitForOrderlyPositionToClose(maxWaitTime = 10000) {
      const startTime = Date.now();
    
      return new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(async () => {
          const elapsed = Date.now() - startTime;
    
          if (state.isOrderlyPositionClosed) {
            clearInterval(checkInterval);
            resolve();
          } else if (elapsed >= maxWaitTime) {
            clearInterval(checkInterval);
            await closeOrderlyPositionsMarketOrder(token);
            reject(new Error('Limit Order not filled within the maximum wait time.'));
          }
        }, 1000); // 1초마다 체크
      });
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
