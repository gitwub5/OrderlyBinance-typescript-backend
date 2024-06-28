import { orderlyAccountInfo, binanceAccountInfo, orderSize, interval, arbitrageThreshold } from './utils';
import { manageRisk } from './riskManagement';
import { placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeBinanceOrder } from './binance/binanceOrders';
import { getBinancePrice } from './binance/binanceGetPrice';
import { getOrderlyPrice } from './orderlynetwork/orderlyGetPrice';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { getBinancePositions } from './binance/binancePositions';

let shouldStop = false;
const profitTarget = 1000; // 수익 목표 예시 (USD 기준)

async function executeArbitrage() {
  const orderlyPrice = await getOrderlyPrice();
  const binancePrice = await getBinancePrice();

  const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

  //테스트
  console.log('Orderly price:', orderlyPrice);
  console.log('Binance price:', binancePrice);
  console.log('Price difference:', priceDifference);

  if (priceDifference > arbitrageThreshold) {
    // 바이낸스에서 매수, 오덜리에서 매도
    console.log('Executing arbitrage: BUY on Binance, SELL on Orderly');
    await placeBinanceOrder.limitOrder(binanceAccountInfo, 'BUY', binancePrice, orderSize);
    await placeOrderlyOrder.limitOrder(orderlyAccountInfo, 'SELL', orderlyPrice, orderSize);
  } else if (priceDifference < -arbitrageThreshold) {
    // 오덜리에서 매수, 바이낸스에서 매도
    console.log('Executing arbitrage: BUY on Orderly, SELL on Binance');
    await placeOrderlyOrder.limitOrder(orderlyAccountInfo, 'BUY', orderlyPrice, orderSize);
    await placeBinanceOrder.limitOrder(binanceAccountInfo, 'SELL', binancePrice, orderSize);
  }
}

async function closePositions() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  console.log('Closing positions...');

  if (orderlyPosition !== null) {
    if (orderlyPosition > 0) {
      console.log(`Closing Orderly long position: SELL ${orderlyPosition}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'SELL', orderlyPosition);
    } else if (orderlyPosition < 0) {
      console.log(`Closing Orderly short position: BUY ${-orderlyPosition}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'BUY', -orderlyPosition);
    }
  } else {
    console.log('No Orderly position to close.');
  }

  if (binancePosition !== null) {
    if (binancePosition > 0) {
      console.log(`Closing Binance long position: SELL ${binancePosition}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'SELL', binancePosition);
    } else if (binancePosition < 0) {
      console.log(`Closing Binance short position: BUY ${-binancePosition}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'BUY', -binancePosition);
    }
  } else {
    console.log('No Binance position to close.');
  }
}

async function checkProfitAndClosePositions() {
  const orderlyPrice = await getOrderlyPrice();
  const binancePrice = await getBinancePrice();

  // 수익 계산 (여기서는 간단히 차이만 계산, 실제로는 더 정교한 수익 계산 필요)
  const currentProfit = (binancePrice - orderlyPrice) * orderSize; // 단순 예시

  console.log('Current Profit:', currentProfit);

  if (currentProfit >= profitTarget) {
    console.log('Profit target reached. Closing all positions.');
    await closePositions();
    shouldStop = true; // 루프 종료를 위해 설정
  }
}

async function manageOrders() {
  while (true) {
    console.log(`<<<< Timestamp: ${Date.now()} >>>>`);
    await executeArbitrage();
    await manageRisk();
    //TODO: Close Position 구현 -> 목표 이익 설정 밎 포지션 정리
    await checkProfitAndClosePositions();
    await new Promise(resolve => setTimeout(resolve, interval));
    console.log();
  }
}

// 종료 신호 핸들러
process.on('SIGINT', () => {
  shouldStop = true;
  console.log('Received SIGINT. Stopping manageOrders...');
  closePositions(); // 종료 신호를 받으면 포지션을 정리합니다.
});

manageOrders();
