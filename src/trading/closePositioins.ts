import { cancelAllOrderlyOrders, placeOrderlyOrder } from '../orderly/order';
import { cancelAllBinanceOrders, placeBinanceOrder } from '../binance/order';
import { getBinancePrice } from '../binance/market';
import { getOrderlyPrice } from '../orderly/market';
import { getOrderlyPositions } from '../orderly/account';
import { getBinancePositions } from '../binance/account';
import { recordTrade } from '../db/queries';
import { forceStop, initialPriceDifference } from '../globals';
import { token } from 'types/tokenTypes';

// 포지션 청산(Market Order) 및 DB에 기록
export async function closePositions(token : token) {
  console.log('Closing positions...');

  const [orderlyPosition, binancePosition] = await Promise.all([
    getOrderlyPositions(token.orderlySymbol), 
    getBinancePositions(token.binanceSymbol)
    ]);

  const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
  const binanceAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
  
  const [orderlyPrice, binancePrice] = await Promise.all([getOrderlyPrice(token.orderlySymbol), getBinancePrice(token.binanceSymbol)]);

  const closePriceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

  //let profitLoss = 0;
  let buyPrice = 0;
  let sellPrice = 0;

  // 오덜리 포지션 청산
  if (orderlyAmt !== null) {
      if (orderlyAmt > 0) {
          console.log(`Closing Orderly long position: SELL ${orderlyAmt}`);
          await placeOrderlyOrder.marketOrder(token.orderlySymbol,'SELL', orderlyAmt);
          //profitLoss += orderlyAmt * (orderlyPrice - binancePrice);
          buyPrice = orderlyPrice; // 롱 포지션의 경우, 오덜리 가격이 매수 가격
          sellPrice = binancePrice; // 롱 포지션의 경우, 바이낸스 가격이 매도 가격
      } else if (orderlyAmt < 0) {
          console.log(`Closing Orderly short position: BUY ${-orderlyAmt}`);
          await placeOrderlyOrder.marketOrder(token.orderlySymbol, 'BUY', -orderlyAmt);
          //profitLoss += orderlyAmt * (binancePrice - orderlyPrice);
          buyPrice = binancePrice; // 숏 포지션의 경우, 바이낸스 가격이 매수 가격
          sellPrice = orderlyPrice; // 숏 포지션의 경우, 오덜리 가격이 매도 가격
      }
  } else {
      console.log('No Orderly position to close.');
  }

  // 바이낸스 포지션 청산
  if (binanceAmt !== null) {
      if (binanceAmt > 0) {
          console.log(`Closing Binance long position: SELL ${binanceAmt}`);
          await placeBinanceOrder.marketOrder(token.binanceSymbol, 'SELL', binanceAmt);
          //profitLoss += binanceAmt * (binancePrice - orderlyPrice);
          if (orderlyAmt === null) { // 오덜리 포지션이 없는 경우 바이낸스 포지션으로 buyPrice와 sellPrice 설정
              buyPrice = binancePrice;
              sellPrice = orderlyPrice;
          }
      } else if (binanceAmt < 0) {
          console.log(`Closing Binance short position: BUY ${-binanceAmt}`);
          await placeBinanceOrder.marketOrder(token.binanceSymbol, 'BUY', -binanceAmt);
          //profitLoss += binanceAmt * (orderlyPrice - binancePrice);
          if (orderlyAmt === null) { // 오덜리 포지션이 없는 경우 바이낸스 포지션으로 buyPrice와 sellPrice 설정
              buyPrice = orderlyPrice;
              sellPrice = binancePrice;
          }
      }
  } else {
      console.log('No Binance position to close.');
  }

  // 오덜리 & 바이낸스 모든 주문 취소
  await cancelAllBinanceOrders(token.binanceSymbol);
  await cancelAllOrderlyOrders(token.orderlySymbol);
  console.log('All Open Orders are canceled...');

  if (!forceStop) {
    try {
        await recordTrade(
            token.binanceSymbol,
            initialPriceDifference,
            closePriceDifference,
            buyPrice,
            sellPrice
        );
        console.log('Recorded at table');
    } catch (err) {
        console.log('Error during recording at table', err);
    }
}
}

//DB에 저장할 값 변경하기!
//TODO: Profit을 따로 계산해서 저장하는데 거의 대부분의 주문이 원하는 가격으로 안들어갈 확률이 높아서 
//수익률이 정확하지 않을 수 있어서 주문 기록을 거래소에서 가져와서 저장하는거로 바꾸기