import { orderlyAccountInfo, binanceAccountInfo, symbol, orderSize, interval, arbitrageThreshold, orderlyAxios, binanceAxios } from './utils';
import { manageRisk } from './riskManagement';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';

async function getOrderlyPrice() {
  const marketData = await orderlyAxios.get(`/market/ticker?symbol=${symbol}`);
  return marketData.data.last;
}

async function getBinancePrice() {
  const marketData = await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
  return parseFloat(marketData.data.price);
}

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
