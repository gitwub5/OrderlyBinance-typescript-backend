import { cancelAllOrderlyOrders, placeOrderlyOrder, getOrderlyOrderById } from '../orderly/order';
import { cancelAllBinanceOrders, placeBinanceOrder } from '../binance/order';
import { getOrderlyPositions } from '../orderly/account';
import { getBinancePositions } from '../binance/account';
import { recordTrade } from '../db/queries';
import { forceStop} from '../globals';
import { token } from '../types/tokenTypes';

async function closePositionAndPrice(token: token, side: 'BUY' | 'SELL', amount: number) {
  const response = await placeOrderlyOrder.marketOrder(token.orderlySymbol, side, amount);
  const orderId = response.order_id;
  const response2 = await getOrderlyOrderById(orderId);
  token.state.setClosePrice(response2.average_executed_price);
}

async function closeOrderlyPositions(token: token, orderlyAmt: number) {
  if (orderlyAmt > 0) {
    console.log(`<<<< Closing Orderly long position: SELL ${orderlyAmt} >>>>`);
    await closePositionAndPrice(token, 'SELL', orderlyAmt);
  } else if (orderlyAmt < 0) {
    console.log(`<<<< Closing Orderly short position: BUY ${-orderlyAmt} >>>>`);
    await closePositionAndPrice(token, 'BUY', -orderlyAmt);
  } else {
    console.log('No Orderly position to close.');
  }
}

async function closeBinancePositions(token: token, binanceAmt: number) {
  if (binanceAmt > 0) {
    console.log(`<<<< Closing Binance long position: SELL ${binanceAmt} >>>>`);
    await placeBinanceOrder.marketOrder(token.binanceSymbol, 'SELL', binanceAmt);
  } else if (binanceAmt < 0) {
    console.log(`<<<< Closing Binance short position: BUY ${-binanceAmt} >>>>`);
    await placeBinanceOrder.marketOrder(token.binanceSymbol, 'BUY', -binanceAmt);
  } else {
    console.log('No Binance position to close.');
  }
}

// 포지션 청산(Market Order) 및 DB에 기록
export async function closePositions(token: token) {
  console.log(`<<<< ${token.binanceSymbol} Closing positions >>>>`);

  const [orderlyPosition, binancePosition] = await Promise.all([
    getOrderlyPositions(token.orderlySymbol),
    getBinancePositions(token.binanceSymbol)
  ]);

  const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
  const binanceAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;

  const closeOrderPromises = [];

  if (orderlyAmt !== null) {
    closeOrderPromises.push(closeOrderlyPositions(token, orderlyAmt));
  }

  if (binanceAmt !== null) {
    closeOrderPromises.push(closeBinancePositions(token, binanceAmt));
  }

  try {
    await Promise.all(closeOrderPromises);
  } catch (error) {
    console.error('Error during position close:', error);
  }

  if (!forceStop) {
    try {
      await recordTrade(
        token.binanceSymbol,
        token.state.initialPriceDifference,
        token.state.closePriceDifference,
        token.state.enterPrice,
        token.state.closePrice
      );
      console.log('Recorded at table');
    } catch (err) {
      console.log('Error during recording at table', err);
    }
  }
}

//포지션 전부 닫기링 주문 전부 취소 나누기
export async function cancelAllOrders(token : token){
  // 오덜리 & 바이낸스 모든 주문 취소
  const cancelOrderPromises = [
    cancelAllBinanceOrders(token.binanceSymbol),
    cancelAllOrderlyOrders(token.orderlySymbol)
  ];    

  try {
    await Promise.all(cancelOrderPromises);
    console.log('All Open Orders are canceled...');
  } catch (error) {
    console.error('Error during order cancelation:', error);
  }

}


//DB에 저장할 값 변경하기!
//TODO: Profit을 따로 계산해서 저장하는데 거의 대부분의 주문이 원하는 가격으로 안들어갈 확률이 높아서 
//수익률이 정확하지 않을 수 있어서 주문 기록을 거래소에서 가져와서 저장하는거로 바꾸기