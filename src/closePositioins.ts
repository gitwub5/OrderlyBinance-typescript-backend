import { arbitrageThreshold, closeThreshold} from './utils';
import { cancelAllOrderlyOrders, placeOrderlyOrder } from './orderlynetwork/order';
import { cancelAllBinanceOrders, placeBinanceOrder } from './binance/order';
import { getBinancePrice } from './binance/market';
import { getOrderlyPrice } from './orderlynetwork/market';
import { getOrderlyPositions } from './orderlynetwork/account';
import { getBinancePositions } from './binance/account';
import { recordTrade } from './db/queries';
import { forceStop } from './globals';

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
  
    //오덜리 포지션 청산
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
  
    //바이낸스 포지션 청산
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

    //오덜리 & 바이낸스 모든 주문 취소
    await cancelAllBinanceOrders();
    await cancelAllOrderlyOrders();
    console.log('All Open Orders are canceled...');
  
    if (!forceStop) {
      await recordTrade(orderlyPrice, binancePrice, orderlyAmt !== null ? orderlyAmt : 0, profitLoss, arbitrageThreshold, closeThreshold);
    }
  }


//TODO: Profit을 따로 계산해서 저장하는데 거의 대부분의 주문이 원하는 가격으로 안들어갈 확률이 높아서 
//수익률이 정확하지 않을 수 있어서 주문 기록을 거래소에서 가져와서 저장하는거로 바꾸기