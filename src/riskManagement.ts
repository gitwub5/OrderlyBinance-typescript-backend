import { orderlyAccountInfo, binanceAccountInfo, symbol, orderSize, } from './utils';
import { getBinancePositions } from './binance/binancePositions';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { placeOrder as placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeOrder as placeBinanceOrder } from './binance/binanceOrders';
import { BinanceAccount, OrderlyAccount } from './types';
import { getOrderlyPrice } from './orderlynetwork/orderlyGetPrice';
import { getBinancePrice } from './binance/binanceGetPrice';


async function adjustPosition(account: BinanceAccount | OrderlyAccount, position : number, targetPosition : number , isOrderly : boolean) {
  const currentPrice = isOrderly ? await getOrderlyPrice() : await getBinancePrice();

  if (position === targetPosition) {
    console.log('No adjustment needed. Position is already at target.');
    return;
  }

  if (position > targetPosition) {
    const adjustmentAmount = position - targetPosition;
    console.log(`Adjusting position by selling ${adjustmentAmount}`);
    if (isOrderly) {
      await placeOrderlyOrder(account as OrderlyAccount, 'SELL', currentPrice, adjustmentAmount);
    } else {
      await placeBinanceOrder(account as BinanceAccount, 'SELL', currentPrice, adjustmentAmount);
    }
  } else if (position < targetPosition) {
    const adjustmentAmount = targetPosition - position;
    console.log(`Adjusting position by buying ${adjustmentAmount}`);
    if (isOrderly) {
      await placeOrderlyOrder(account as OrderlyAccount, 'BUY', currentPrice, adjustmentAmount);
    } else {
      await placeBinanceOrder(account as BinanceAccount, 'BUY', currentPrice, adjustmentAmount);
    }
  }
}

export async function manageRisk() {
  const orderlyPosition = await getOrderlyPositions();
  const binancePosition = await getBinancePositions();

  console.log('Orderly position:', orderlyPosition);
  console.log('Binance position:', binancePosition);

  if (orderlyPosition === null || binancePosition === null) {
    console.error('Failed to fetch positions.');
    return;
  }

  const totalPosition = orderlyPosition - binancePosition;
  const targetPosition = orderSize * 5;

  if (totalPosition > targetPosition) {
    await adjustPosition(binanceAccountInfo, binancePosition, binancePosition + (totalPosition - targetPosition) / 2, false);
  } else if (totalPosition < -targetPosition) {
    await adjustPosition(orderlyAccountInfo, orderlyPosition, orderlyPosition - (targetPosition + totalPosition) / 2, true);
  } else {
    console.log('No position adjustment needed.');
  }
}
