import { orderlyAccountInfo, binanceAccountInfo, symbol, orderSize, } from './utils';
import { getBinancePositions } from './binance/binancePositions';
import { getOrderlyPositions } from './orderlynetwork/orderlyPositions';
import { placeOrderlyOrder } from './orderlynetwork/orderlyOrders';
import { placeBinanceOrder } from './binance/binanceOrders';
import { BinanceAccount, OrderlyAccount } from './types';


async function adjustPosition(account: BinanceAccount | OrderlyAccount, position : number, targetPosition : number , isOrderly : boolean) {
  if (position === targetPosition) {
    console.log('No adjustment needed. Position is already at target.');
    return;
  }

  if (position > targetPosition) {
    const adjustmentAmount = position - targetPosition;
    console.log(`Adjusting position by selling ${adjustmentAmount}`);
    if (isOrderly) {
      await placeOrderlyOrder.marketOrder(account as OrderlyAccount, 'SELL', adjustmentAmount);
    } else {
      await placeBinanceOrder.marketOrder(account as BinanceAccount, 'SELL', adjustmentAmount);
    }
  } else if (position < targetPosition) {
    const adjustmentAmount = targetPosition - position;
    console.log(`Adjusting position by buying ${adjustmentAmount}`);
    if (isOrderly) {
      await placeOrderlyOrder.marketOrder(account as OrderlyAccount, 'BUY', adjustmentAmount);
    } else {
      await placeBinanceOrder.marketOrder(account as BinanceAccount, 'BUY', adjustmentAmount);
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
  const targetPosition = orderSize * 5; //현재는 고정된 값 사용, 비즈니스 로직에 맞게 동적으로 설정 가능 

  if (totalPosition > targetPosition) {
    await adjustPosition(binanceAccountInfo, binancePosition, binancePosition + (totalPosition - targetPosition) / 2, false);
  } else if (totalPosition < -targetPosition) {
    await adjustPosition(orderlyAccountInfo, orderlyPosition, orderlyPosition - (targetPosition + totalPosition) / 2, true);
  } else {
    console.log('No position adjustment needed.');
  }
}
