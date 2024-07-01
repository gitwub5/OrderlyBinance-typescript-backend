import { orderlyAccountInfo, binanceAccountInfo, orderSize, interval, arbitrageThreshold } from './utils';
import { placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeBinanceOrder } from './binance/binanceOrders';
import { getBinancePrice } from './binance/binanceGetPrice';
import { getOrderlyPrice } from './orderlynetwork/orderlyGetPrice';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { getBinancePositions } from './binance/binancePositions';

let shouldStop = false;

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

//포지션 청산(Market Order)
async function closePositions() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  console.log('Closing positions...');

  if (orderlyPosition !== null) {
    if (orderlyPosition.position_qty > 0) {
      console.log(`Closing Orderly long position: SELL ${orderlyPosition}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'SELL', orderlyPosition.position_qty);
    } else if (orderlyPosition.position_qty < 0) {
      console.log(`Closing Orderly short position: BUY ${-orderlyPosition}`);
      await placeOrderlyOrder.marketOrder(orderlyAccountInfo, 'BUY', -orderlyPosition.position_qty);
    }
  } else {
    console.log('No Orderly position to close.');
  }

  if (binancePosition !== null) {
    if (binancePosition.positionAmt > 0) {
      console.log(`Closing Binance long position: SELL ${binancePosition}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'SELL', binancePosition.positionAmt);
    } else if (binancePosition.positionAmt < 0) {
      console.log(`Closing Binance short position: BUY ${-binancePosition}`);
      await placeBinanceOrder.marketOrder(binanceAccountInfo, 'BUY', -binancePosition.positionAmt);
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
process.on('SIGINT', () => {
  shouldStop = true;
  console.log('Received SIGINT. Stopping manageOrders...');
  closePositions();
});

manageOrders();
