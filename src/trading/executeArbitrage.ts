import { getOrderlyPrice } from '../orderly/market';
import { getBinancePositions } from '../binance/account';
import { shouldStop } from '../globals';
import { placeOrder, enterPosition, handleOrder } from './manageOrders';
import { monitorClosePositions } from './monitorPositions'
import { orderlySymbol } from '../utils/utils';
import { interval, shortInterval } from './stratgy';


  export async function executeArbitrage() {
    // TODO: Balance가 없으면 루프문 중지, 또는 에러 발생 시 중지
    // 오덜리에서 api로 가격 가져온 다음에 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
    let orderlyPrice = await getOrderlyPrice();
    console.log(`[Orderly] ${orderlySymbol} Mark Price: `, orderlyPrice);
    const { longPositionId, shortPositionId } = await placeOrder(orderlyPrice);

    let positionFilled = false;
    let previousOrderlyPrice = orderlyPrice;

    while (!positionFilled) {
      const binancePosition = await getBinancePositions();
      const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
      if (binancePosition !== null && positionAmt !== 0) {
        console.log(`<<<< Position filled on Binance: ${binancePosition.positionAmt} >>>>`);
        await enterPosition(
          binancePosition.positionAmt,
          longPositionId,
          shortPositionId
        );
        
        positionFilled = true;

        //1초마다 가격 모니터링
        await monitorClosePositions();

        return; // 포지션이 체결되었으면 추가 처리를 중지
      }

      orderlyPrice = await getOrderlyPrice();
      console.log(`[Orderly] ${orderlySymbol} Mark Price: `, orderlyPrice);

      //가격 변화없으면 주문 수정 실행 X -> 같은 가격으로 주문 실행하면 에러 메시지 반환됨
      if (orderlyPrice !== previousOrderlyPrice) {
        await handleOrder(orderlyPrice, longPositionId, shortPositionId);
        previousOrderlyPrice = orderlyPrice;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }


export async function manageArbitrage() {
  while (!shouldStop) {
    await executeArbitrage();
    console.log('<<<< Arbitrage iteration completed >>>>');
    //5초후 다시 실행
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('Exiting manageOrders...');
}

// //TODO: 토큰값 받아서 해당 심볼에 대한 아비트리지 진행하게... 모든 함수 고쳐야함 토큰값 받아서 하는거로... -> 아이디어: 토큰값 없으면 그냥 유틸에 있는 값 쓰고 입력 들어오면 해당값 쓰는거로?
// // Modify related functions (getOrderlyPrice, getBinancePrice, etc.) to accept token parameter
// async function manageOrders(token: string) {
//   while (!shouldStop) {
//       await executeArbitrage(token);
//       await new Promise(resolve => setTimeout(resolve, interval));
//       console.log(`Iteration for ${token} completed.`);
//   }

//   console.log(`Exiting manageOrders for ${token}...`);
// }

// async function executeArbitrage(token: string) {
//   let orderlyPrice = await getOrderlyPrice(token);
//   console.log(`Orderly ${token} Mark Price: `, orderlyPrice);
//   const { longPositionId, shortPositionId } = await placeOrder(token, orderlyPrice);
//   console.log(`Long Position ID, Short Position ID: `, longPositionId, shortPositionId);

//   let positionFilled = false;
//   while (!positionFilled) {
//       const binancePosition = await getBinancePositions(token);
//       const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
//       if (binancePosition !== null && positionAmt !== 0) {
//           await enterPosition(
//               binancePosition.positionAmt,
//               longPositionId,
//               shortPositionId
//           );

//           console.log(`Position filled on Binance for ${token}:`, binancePosition.positionAmt);
//           positionFilled = true;

//           await monitorClosePositions(token);

//           return;
//       }
//       orderlyPrice = await getOrderlyPrice(token);
//       console.log(`Orderly ${token} Mark Price: `, orderlyPrice);
//       await handleOrder(token, orderlyPrice, longPositionId, shortPositionId);

//       await new Promise(resolve => setTimeout(resolve, shortInterval));
//   }
// }

