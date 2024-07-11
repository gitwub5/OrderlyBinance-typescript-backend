import { getOrderlyPrice } from '../../orderly/market';
import { shouldStop, forceStop } from '../../globals';
import { placeNewOrder, handleOrder, enterShortPosition, enterLongPosition } from '../manageOrders';
import { monitorClosePositions } from '../monitorPositions'
import { interval, tokensArray } from '../stratgy';
import { getBinanceOrderStatus } from '../../binance/order';
import { recordTrade } from '../../db/queries';
import { token } from '../../types/tokenTypes';
import { WebSocketManager as OrderlyWs } from '../../orderly/websocket/public';
import { SocketClient as BinanceWs } from '../../binance/websocketStream/socketClient';
import { deleteListenKey, getListenKey } from '../../binance/websocketStream/listenKey';
import { closeAllPositions, cancelAllOrders } from '../../trading/closePositions';
import { setForceStop } from '../../globals';

export async function executeArbitrage(token: token) {
  try {
    //오덜리 웹소켓 open
    const orderlyClient = new OrderlyWs();
    await orderlyClient.connect();
    
    //바이낸스 웹소켓 open
    const listenKey = await getListenKey();
    console.log('ListenKey received:', listenKey);
    const binanceClient = new BinanceWs(`ws/${listenKey}`);

    // 초기 시장가 가져오기
    const orderlyPrice = await getOrderlyPrice(token.orderlySymbol);
    console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
    // 새로운 주문 배치
    const { longPositionId, longPositionPrice, shortPositionId, shortPositionPrice } = await placeNewOrder(token, orderlyPrice);
     
    let positionFilled = false;
    let previousOrderlyPrice = orderlyPrice;
    let binanceBuyPrice = longPositionPrice;
    let binanceSellPrice = shortPositionPrice;
 
     
    await orderlyClient.markPrice(token.orderlySymbol);

    
    orderlyClient.setMessageCallback(async (message) => {
        if (message.topic === `${token.orderlySymbol}@markprice`){
        const data = message.data;
        const orderlyPrice = data.price;
        console.log(`[${token.binanceSymbol}][O] Mark Price: `, orderlyPrice);
        
        if (orderlyPrice !== previousOrderlyPrice) {
          const { longPositionPrice, shortPositionPrice } = await handleOrder(token, orderlyPrice, longPositionId, shortPositionId, binanceBuyPrice, binanceSellPrice);
          binanceBuyPrice = longPositionPrice;
          binanceSellPrice = shortPositionPrice;
          previousOrderlyPrice = orderlyPrice;
        }
        
        //이벤트 핸들러 구현
        //체결되었다는 Event 받을 시에 오덜리 마켓 주문 체결 및 모니터링 시작
        binanceClient.setHandler('ORDER_TRADE_UPDATE', (message) => {
          const orderUpdate = message.o;
      
          if (orderUpdate.X === 'FILLED' && (orderUpdate.i === longPositionId || orderUpdate.i === shortPositionId)) {
            console.log('Order filled:', JSON.stringify(orderUpdate));
            //숏 포지션 체결
            if(orderUpdate.S === 'SELL'){

            }
            //롱 포지션 체결
            else{

            }
            // 원하는 함수 호출
          }
        });

        // if(!forceStop){
        //   orderlyClient.disconnect();
        //   binanceClient.disconnect();
        //   await deleteListenKey();
        // }
      }
    });
    
    //바이낸스는 한시간 넘기전에 listenKey 업데이트 해줘야함!!!
  } catch (error) {
    console.error('Error in executeArbitrage:', error);
    throw error;
  } finally {
  }
}

async function main() {
    try {
      const token = tokensArray[0];

      process.on('SIGINT', async () => {
        setForceStop(true);
        await closeAllPositions(token);
        await cancelAllOrders(token);
        process.exit(0);
      });
      
      await executeArbitrage(token);
    } catch (error) {
      console.error('Error in createApp:', error);
    }
  }
  
  main();


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
