import { getOrderlyPositions } from "../orderly/account";
import { getBinancePositions } from "../binance/account";
import { getBinancePrice } from "../binance/market";
import { getOrderlyPrice } from "../orderly/market";
import { shortInterval} from "./stratgy";
import { closePositions } from "./closePositioins";

// 현재 포지션이 있는지 확인하는 함수
export async function hasOpenPositions(): Promise<boolean> {
    const [orderlyPosition, binancePosition] = await Promise.all([getOrderlyPositions(), getBinancePositions()]);
  
    const orderlyAmt = orderlyPosition ? parseFloat(orderlyPosition.position_qty.toString()) : null;
    const positionAmt = binancePosition ? parseFloat(binancePosition.positionAmt.toString()) : null;
  
    console.log('Orderly position_qty:', orderlyAmt !== null ? orderlyAmt : 'null');
    console.log('Binance positionAmt:', positionAmt !== null ? positionAmt : 'null');
  
    return (orderlyAmt !== null && orderlyAmt !== 0) || (positionAmt !== null && positionAmt !== 0);
  }

  export async function monitorClosePositions(closeThreshold: number) {
    let isClosePosition : boolean = false;

    while (!isClosePosition) {
        const [orderlyPrice, binancePrice] = await Promise.all([getOrderlyPrice(), getBinancePrice()]);

        // 가격차이(%) -> 양수이면 바이낸스 가격이 높은거고, 음수이면 오덜리 가격이 높은거
        // 바이낸스에서 숏포지션, 오덜리에서 롱포지션이면 -> 가격차이가 양수여야함
        // 바이낸스에서 롱포지션, 오덜리에서 숏포지션이면 -> 가격차이가 음수여야함
        const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

        console.log(`<<<< Price Difference: ${priceDifference}% >>>>`);

        // 청산 조건 확인
        const shouldClosePosition = Math.abs(priceDifference) <= closeThreshold;

        if (shouldClosePosition) {
            console.log('<<<< Closing positions due to close threshold >>>>.');
            await closePositions();
            isClosePosition = true;
        }

        // shortInterval 간격으로 반복
        await new Promise(resolve => setTimeout(resolve, shortInterval));
    }
  }