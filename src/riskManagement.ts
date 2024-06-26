import { orderlyAccountInfo, binanceAccountInfo, symbol, orderSize, orderlyAxios, binanceAxios, 
  ORDERLY_API_URL
 } from './utils';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { signAndSendRequest } from './orderlynetwork/orderlySignRequest'
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';
import { BinanceAccount, OrderlyAccount, BinanceBalance } from './types';

async function getOrderlyPositions() {
  const res = await signAndSendRequest(
    orderlyAccountInfo.accountId,
    orderlyAccountInfo.apiKey,
    `${ORDERLY_API_URL}/v1/client/holding`
  );
  const json = await res.json();
  console.log('getClientHolding:', JSON.stringify(json, undefined, 2));
}

//TODO: futures로 바꿔야함
async function getBinancePositions() {
  try {
    const response = await binanceAxios.get('/fapi/v2/account', {
      headers: {
        'X-MBX-APIKEY': binanceAccountInfo.apiKey,
      },
    });
    const balances: BinanceBalance[] = response.data.balances;
    const baseAsset = symbol.split('/')[0];
    const balance = balances.find(b => b.asset === baseAsset);
    if (!balance) {
      throw new Error(`Asset ${symbol.split('/')[0]} not found in Binance account.`);
    }
    return parseFloat(balance.free);
  } catch (error) {
    console.error('Error fetching Binance balance:', error);
    return 0;
  }
}

async function adjustPosition(account: BinanceAccount | OrderlyAccount, position : number, targetPosition : number , isOrderly : boolean) {
  const marketData = isOrderly 
    ? await orderlyAxios.get(`/market/ticker?symbol=${symbol}`) 
    : await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
  const currentPrice = isOrderly ? marketData.data.last : parseFloat(marketData.data.price);

  if (position > targetPosition) {
      if (isOrderly) {
        await placeOrderlyOrder(account as OrderlyAccount, 'SELL', currentPrice, position - targetPosition);
      } else {
        await placeBinanceOrder(account as BinanceAccount, 'SELL', currentPrice, position - targetPosition);
      }
    } else if (position < targetPosition) {
      if (isOrderly) {
        await placeOrderlyOrder(account as OrderlyAccount, 'BUY', currentPrice, targetPosition - position);
      } else {
        await placeBinanceOrder(account as BinanceAccount, 'BUY', currentPrice, targetPosition - position);
    }
  }
}

export async function manageRisk() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();
  const totalPosition = orderlyPosition - binancePosition;

  const targetPosition = orderSize * 5;

  if (totalPosition > targetPosition) {
    await adjustPosition(binanceAccountInfo, binancePosition, binancePosition + (totalPosition - targetPosition) / 2, false);
  } else if (totalPosition < -targetPosition) {
    await adjustPosition(orderlyAccountInfo, orderlyPosition, orderlyPosition - (targetPosition + totalPosition) / 2, true);
  }
}
