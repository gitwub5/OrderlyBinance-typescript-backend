import { orderlyAccountInfo, binanceAccountInfo, orderSize, interval, arbitrageThreshold } from './utils';
import { placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeBinanceOrder } from './binance/binanceOrders';
import { getBinancePrice } from './binance/binanceGetPrice';
import { getOrderlyPrice } from './orderlynetwork/orderlyGetPrice';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { getBinancePositions } from './binance/binancePositions';

let shouldStop = false;

// 현재 포지션이 있는지 확인하는 함수
async function hasOpenPositions(): Promise<boolean> {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
  const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;

  console.log('Orderly position_qty:', orderlyPosition ? orderlyAmt : 'null');
  console.log('Binance positionAmt:', binancePosition ? positionAmt : 'null');

  return (orderlyAmt !== null && orderlyAmt !== 0) || 
         (positionAmt !== null && positionAmt !== 0);
}

//아비트리지 실행
async function executeArbitrage() {
  const orderlyPrice = await getOrderlyPrice();
  const binancePrice = await getBinancePrice();

  const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

  //로그
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
  } else if (Math.abs(priceDifference) < arbitrageThreshold / 2) {
    // 가격 차이가 임계값 이하로 감소하면 포지션 청산
    const hasPositions = await hasOpenPositions();
    console.log('Has open positions:', hasPositions); 
    if (hasPositions) {
      console.log('Price difference below threshold. Closing positions...');
      await closePositions();
    }
  }
}

//포지션 청산(Market Order)
async function closePositions() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
  const binanceAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;

  console.log('Closing positions...');

  // 오덜리 청산
  if (orderlyAmt !== null) {
    if (orderlyAmt > 0) {
      console.log(`Closing Orderly long position: SELL ${orderlyAmt}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'SELL', orderlyAmt);
    } else if (orderlyAmt < 0) {
      console.log(`Closing Orderly short position: BUY ${-orderlyAmt}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'BUY', -orderlyAmt);
    }
  } else {
    console.log('No Orderly position to close.');
  }

  // 바이낸스 청산
  if (binanceAmt !== null) {
    if (binanceAmt > 0) {
      console.log(`Closing Binance long position: SELL ${binanceAmt}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'SELL', binanceAmt);
    } else if (binanceAmt < 0) {
      console.log(`Closing Binance short position: BUY ${-binanceAmt}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'BUY', -binanceAmt);
    }
  } else {
    console.log('No Binance position to close.');
  }
}


async function manageOrders() {
  while (!shouldStop) {
    await executeArbitrage();
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.log('Exiting manageOrders...');
}

// 종료 신호 핸들러
process.on('SIGINT', async () => {
  shouldStop = true;
  console.log('Received SIGINT. Stopping manageOrders...');
  await closePositions(); 
  console.log('Exiting manageOrders...');
  process.exit(0); 
});

manageOrders();