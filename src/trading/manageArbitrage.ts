import { orderSize, interval, shortInterval, arbitrageThreshold, closeThreshold, trailingThreshold } from './stratgy';
import { placeOrderlyOrder } from '../orderly/order';
import { placeBinanceOrder, cancelBinanceOrder } from '../binance/order';
import { getBinancePrice } from '../binance/market';
import { getOrderlyPrice } from '../orderly/market';
import { getOrderlyPositions } from '../orderly/account';
import { getBinancePositions } from '../binance/account';
import { markPriceWSClient } from 'orderly/websocket/markPriceStream';
import { closePositions } from './closePositioins';
import { shouldStop, setInitialPriceDifference, forceStop } from '../globals';
import { placeOrder, enterPosition, handleOrder } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'


// 현재 포지션이 있는지 확인하는 함수
export async function hasOpenPositions(): Promise<boolean> {
    const [orderlyPosition, binancePosition] = await Promise.all([getOrderlyPositions(), getBinancePositions()]);
  
    const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
    const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
  
    console.log('Orderly position_qty:', orderlyAmt !== null ? orderlyAmt : 'null');
    console.log('Binance positionAmt:', positionAmt !== null ? positionAmt : 'null');
  
    return (orderlyAmt !== null && orderlyAmt !== 0) || (positionAmt !== null && positionAmt !== 0);
  }


  export async function executeArbitrage() {
    // TODO: Balance가 없으면 루프문 중지, 또는 에러 발생 시 중지
    try {
      // 오덜리에서 api로 가격 가져온 다음에 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
      const orderlyPrice = await getOrderlyPrice();
      const { longPositionId, shortPositionId } = await placeOrder(orderlyPrice);

      // 오덜리에서 웹소켓으로 가격 가져오기
      const orderlyClient = new markPriceWSClient();
      let positionFilled = false;

      orderlyClient.setMessageCallback(async (data: any) => {
          if (positionFilled) {
              return; // 포지션이 체결되었으면 추가 처리를 중지
          }
          const orderlyPrice = data?.data?.price;
          console.log('Received Orderly Mark Price:', orderlyPrice);

          const binancePosition = await getBinancePositions();
          if (binancePosition !== null && binancePosition.positionAmt !== 0) {
              console.log('Position filled on Binance:', binancePosition);
              positionFilled = true;

              // 남아있는 주문 취소 및 오덜리 시장가 진입
              await enterPosition(binancePosition.positionAmt,longPositionId, shortPositionId);

              // WebSocket 클라이언트 중지
              orderlyClient.stop();

              // 포지션을 종료하는 로직 시작
              await monitorClosePositions();
              return;
          }

          // 오덜리 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
          await handleOrder(orderlyPrice, longPositionId, shortPositionId);
      });

      // 새로운 주문을 실행하기 전에 약간의 시간 대기
      await new Promise(resolve => setTimeout(resolve, interval));
  } catch (error) {
      console.error('Error in executeArbitrage loop:', error);
      // 필요한 경우 루프를 중지하거나 에러 핸들링 로직 추가
  }
}

export async function manageOrders() {
  while (!shouldStop) {
    await executeArbitrage();
    //인터벌 조정 필요
    await new Promise(resolve => setTimeout(resolve, interval));
    console.log();
  }

  console.log('Exiting manageOrders...');
}



// // 트레일링 스탑 로직
// async function monitorTrailingStop(positionType: 'BUY_BINANCE' | 'BUY_ORDERLY', initialDifference: number) {
//   let maxPriceDifference = initialDifference;

//   while (!shouldStop) {
//     const [orderlyPrice, binancePrice] = await Promise.all([getOrderlyPrice(), getBinancePrice()]);

//     const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

//     console.log('Orderly price:', orderlyPrice);
//     console.log('Binance price:', binancePrice);
//     console.log('Price difference:', priceDifference);

//     const hasPositions = await hasOpenPositions();
//     console.log('Has open positions:', hasPositions);

//     if (positionType === 'BUY_BINANCE') {
//       if (priceDifference > maxPriceDifference) {
//         maxPriceDifference = priceDifference;
//       }
//       if (priceDifference < maxPriceDifference - trailingThreshold && hasPositions) {
//         console.log('Trailing stop activated. Closing positions...');
//         await closePositions();
//         break;
//       }
//     } else if (positionType === 'BUY_ORDERLY') {
//       if (priceDifference < maxPriceDifference) {
//         maxPriceDifference = priceDifference;
//       }
//       if (priceDifference > maxPriceDifference + trailingThreshold && hasPositions) {
//         console.log('Trailing stop activated. Closing positions...');
//         await closePositions();
//         break;
//       }
//     }

//     await new Promise(resolve => setTimeout(resolve, shortInterval));
//     console.log();
//   }
// }

