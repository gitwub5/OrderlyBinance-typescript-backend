import { orderlyAccount, binanceAccount, symbol, orderSize, orderlyAxios, binanceAxios } from './utils';
import { placeOrder as placeOrderlyOrder } from './orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binanceOrders';

async function getOrderlyPositions() {
  try {
    const response = await orderlyAxios.get('/account/balance', {
      headers: {
        'API-KEY': orderlyAccount.apiKey,
      },
    });
    const balance = response.data;
    return balance[symbol.split('/')[0]];
  } catch (error) {
    console.error('Error fetching Orderly balance:', error);
  }
}

async function getBinancePositions() {
  try {
    const response = await binanceAxios.get('/api/v3/account', {
      headers: {
        'X-MBX-APIKEY': binanceAccount.apiKey,
      },
    });
    const balance = response.data.balances.find(b => b.asset === symbol.split('/')[0]);
    return parseFloat(balance.free);
  } catch (error) {
    console.error('Error fetching Binance balance:', error);
  }
}

async function adjustPosition(account, position, targetPosition, isOrderly) {
  const marketData = isOrderly ? await orderlyAxios.get(`/market/ticker?symbol=${symbol}`) : await binanceAxios.get(`/api/v3/ticker/price?symbol=${symbol.replace('/', '')}`);
  const currentPrice = isOrderly ? marketData.data.last : parseFloat(marketData.data.price);

  if (position > targetPosition) {
    await (isOrderly ? placeOrderlyOrder : placeBinanceOrder)(account, 'SELL', currentPrice, position - targetPosition);
  } else if (position < targetPosition) {
    await (isOrderly ? placeOrderlyOrder : placeBinanceOrder)(account, 'BUY', currentPrice, targetPosition - position);
  }
}

export async function manageRisk() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();
  const totalPosition = orderlyPosition - binancePosition;

  const targetPosition = orderSize * 5;

  if (totalPosition > targetPosition) {
    await adjustPosition(binanceAccount, binancePosition, binancePosition + (totalPosition - targetPosition) / 2, false);
  } else if (totalPosition < -targetPosition) {
    await adjustPosition(orderlyAccount, orderlyPosition, orderlyPosition - (targetPosition + totalPosition) / 2, true);
  }
}
