import { orderlyAccount, binanceAccount, symbol, orderSize, interval, arbitrageThreshold, orderlyAxios, binanceAxios } from './utils';
import { manageRisk } from './riskManagement';
import { placeOrder as placeOrderlyOrder } from './orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binanceOrders';

async function getOrderlyPrice() {
  const marketData = await orderlyAxios.get(`/market/ticker?symbol=${symbol}`);
  return marketData.data.last;
}

async function getBinancePrice() {
  const marketData = await binanceAxios.get(`/api/v3/ticker/price?symbol=${symbol.replace('/', '')}`);
  return parseFloat(marketData.data.price);
}

async function executeArbitrage() {
  const orderlyPrice = await getOrderlyPrice();
  const binancePrice = await getBinancePrice();

  const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

  if (priceDifference > arbitrageThreshold) {
    // 바이낸스에서 매수, 오덜리에서 매도
    await placeBinanceOrder(binanceAccount, 'BUY', binancePrice, orderSize);
    await placeOrderlyOrder(orderlyAccount, 'SELL', orderlyPrice, orderSize);
  } else if (priceDifference < -arbitrageThreshold) {
    // 오덜리에서 매수, 바이낸스에서 매도
    await placeOrderlyOrder(orderlyAccount, 'BUY', orderlyPrice, orderSize);
    await placeBinanceOrder(binanceAccount, 'SELL', binancePrice, orderSize);
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
