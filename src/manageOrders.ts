import { orderSize, interval, arbitrageThreshold, closeThreshold} from './utils';
import { placeOrderlyOrder } from './orderlynetwork/order';
import { placeBinanceOrder } from './binance/order';
import { getBinancePrice } from './binance/market';
import { getOrderlyPrice } from './orderlynetwork/market';
import { getOrderlyPositions } from './orderlynetwork/position';
import { getBinancePositions } from './binance/position';
import { recordTrade } from './db/queries';
import { shouldStop, forceStop } from './globals';

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
    await placeBinanceOrder.limitOrder('BUY', binancePrice, orderSize);
    await placeOrderlyOrder.limitOrder('SELL', orderlyPrice, orderSize);
    
  } else if (priceDifference < -arbitrageThreshold) {
    // 오덜리에서 매수, 바이낸스에서 매도
    console.log('Executing arbitrage: BUY on Orderly, SELL on Binance');
    await placeOrderlyOrder.limitOrder('BUY', orderlyPrice, orderSize);
    await placeBinanceOrder.limitOrder('SELL', binancePrice, orderSize);
  } else if (Math.abs(priceDifference) < closeThreshold) {
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
export async function closePositions() {
  console.log('Closing positions...');

  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
  const binanceAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
  
  const orderlyPrice = await getOrderlyPrice();
  const binancePrice = await getBinancePrice();

  let profitLoss = 0;

  if (orderlyAmt !== null) {
    if (orderlyAmt > 0) {
      console.log(`Closing Orderly long position: SELL ${orderlyAmt}`);
      await placeOrderlyOrder.marketOrder('SELL', orderlyAmt);
      profitLoss += orderlyAmt * (orderlyPrice - binancePrice);
    } else if (orderlyAmt < 0) {
      console.log(`Closing Orderly short position: BUY ${-orderlyAmt}`);
      await placeOrderlyOrder.marketOrder('BUY', -orderlyAmt);
      profitLoss += orderlyAmt * (binancePrice - orderlyPrice);
    }
  } else {
    console.log('No Orderly position to close.');
  }

  if (binanceAmt !== null) {
    if (binanceAmt > 0) {
      console.log(`Closing Binance long position: SELL ${binanceAmt}`);
      await placeBinanceOrder.marketOrder('SELL', binanceAmt);
      profitLoss += binanceAmt * (binancePrice - orderlyPrice);
    } else if (binanceAmt < 0) {
      console.log(`Closing Binance short position: BUY ${-binanceAmt}`);
      await placeBinanceOrder.marketOrder('BUY', -binanceAmt);
      profitLoss += binanceAmt * (orderlyPrice - binancePrice);
    }
  } else {
    console.log('No Binance position to close.');
  }

  if (!forceStop) {
    await recordTrade(orderlyPrice, binancePrice, orderlyAmt !== null ? orderlyAmt : 0, profitLoss, arbitrageThreshold, closeThreshold);
  }
}

export async function manageOrders() {
  while (!shouldStop) {
    await executeArbitrage();
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.log('Exiting manageOrders...');
}