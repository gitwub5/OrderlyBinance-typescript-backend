import { getOrderlyPrice } from '../orderly/market';
import { shouldStop } from '../globals';
import { placeOrder, handleOrder, enterShortPosition, enterLongPosition } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { orderlySymbol } from '../utils/utils';
import { interval } from './stratgy';
import { getOrderStatus } from '../binance/order';
import { token } from '../types/tokenTypes';


  export async function executeArbitrage(token: token) {
    // TODO: Balance가 없으면 루프문 중지, 또는 에러 발생 시 중지
    // 오덜리에서 api로 가격 가져온 다음에 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
    let orderlyPrice = await getOrderlyPrice();
    console.log(`[Orderly] ${orderlySymbol} Mark Price: `, orderlyPrice);
    const { longPositionId, shortPositionId } = await placeOrder(orderlyPrice, token.arbitrageThreshold);

    let positionFilled = false;
    let previousOrderlyPrice = orderlyPrice;

    while (!positionFilled) {
      const [longPositionStatus, shortPositionStatus] = await Promise.all([
        getOrderStatus(longPositionId),
        getOrderStatus(shortPositionId)
      ]);
      
      if(longPositionStatus && longPositionStatus.status === 'FILLED'){
        console.log(`<<<< Long Position filled on Binance >>>>`);
        enterShortPosition(token.orderSize, shortPositionId);

        await monitorClosePositions(token.closeThreshold);

        positionFilled = true;
        return;
      }
      else if(shortPositionStatus && shortPositionStatus.status === 'FILLED'){
        console.log(`<<<< Short Position filled on Binance >>>>`);
        enterLongPosition(token.orderSize, longPositionId);

        await monitorClosePositions(token.closeThreshold);

        positionFilled = true;
        return;
      }

      orderlyPrice = await getOrderlyPrice();
      console.log(`[Orderly] ${orderlySymbol} Mark Price: `, orderlyPrice);

      //가격 변화없으면 주문 수정 실행 X -> 같은 가격으로 주문 실행하면 에러 메시지 반환됨
      if (orderlyPrice !== previousOrderlyPrice) {
        await handleOrder(orderlyPrice, token.arbitrageThreshold, longPositionId, shortPositionId);
        previousOrderlyPrice = orderlyPrice;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

export async function manageArbitrage(token: token) {
  while (!shouldStop) {
    await executeArbitrage(token);
    console.log('<<<< Arbitrage iteration completed >>>>');
    //5초후 다시 실행
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Exiting manageOrders...');
}

