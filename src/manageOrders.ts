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

  if (priceDifference > arbitrageThreshold) {
    // 바이낸스에서 매수, 오덜리에서 매도
    await placeBinanceOrder(binanceAccountInfo, 'BUY', binancePrice, orderSize);
    await placeOrderlyOrder(orderlyAccountInfo, 'SELL', orderlyPrice, orderSize);
  } else if (priceDifference < -arbitrageThreshold) {
    // 오덜리에서 매수, 바이낸스에서 매도
    await placeOrderlyOrder(orderlyAccountInfo, 'BUY', orderlyPrice, orderSize);
    await placeBinanceOrder(binanceAccountInfo, 'SELL', binancePrice, orderSize);
  }
}

async function manageOrders() {
  while (true) {
    await executeArbitrage();
    await manageRisk();
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

manageOrders();
