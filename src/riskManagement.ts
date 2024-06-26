import axios from 'axios';
import { orderlyAccountInfo, binanceAccountInfo, 
  symbol, orderSize, 
  orderlyAxios, binanceAxios, 
} from './utils';
import { getBinancePositions } from './binance/binancePositions';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';
import { BinanceAccount, OrderlyAccount } from './types';

async function adjustPosition(account: BinanceAccount | OrderlyAccount, position : number, targetPosition : number , isOrderly : boolean) {
  const marketData = isOrderly 
    ? await orderlyAxios.get(`/market/ticker?symbol=${symbol}`) 
    : await binanceAxios.get(`/fapi/v1/ticker/price?symbol=${symbol.replace('/', '')}`);
    //TODO: 리턴값 맞는지 확인ㄴ
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
