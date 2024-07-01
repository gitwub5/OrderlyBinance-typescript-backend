import { orderlyAccountInfo, binanceAccountInfo, orderSize, interval, arbitrageThreshold } from './utils';
import { manageRisk } from './riskManagement';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';
import { getBinancePrice } from './binance/binanceGetPrice';
import { getOrderlyPrice } from './orderlynetwork/orderlyGetPrice';

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
    await placeBinanceOrder(binanceAccountInfo, 'BUY', binancePrice, orderSize);
    await placeOrderlyOrder(orderlyAccountInfo, 'SELL', orderlyPrice, orderSize);
  } else if (priceDifference < -arbitrageThreshold) {
    // 오덜리에서 매수, 바이낸스에서 매도
    console.log('Executing arbitrage: BUY on Orderly, SELL on Binance');
    await placeOrderlyOrder(orderlyAccountInfo, 'BUY', orderlyPrice, orderSize);
    await placeBinanceOrder(binanceAccountInfo, 'SELL', binancePrice, orderSize);
  }
}

async function manageOrders() {
  while (true) {
    console.log(`<<<< Timestamp: ${Date.now()} >>>>`);
    await executeArbitrage();
    await manageRisk();
    await new Promise(resolve => setTimeout(resolve, interval));
    console.log();
  }
}

manageOrders();
