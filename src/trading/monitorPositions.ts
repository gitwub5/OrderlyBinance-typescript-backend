import { getOrderlyPositions } from "../orderly/account";
import { getBinancePositions } from "../binance/account";
import { getBinancePrice } from "../binance/market";
import { getOrderlyPrice } from "../orderly/market";
import { shortInterval, closeThreshold, trailingThreshold } from "./stratgy";
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

  export async function monitorClosePositions() {
 
    let isClosePosition = false;
    let maxPriceDifference = 0

    while(!isClosePosition){
        const [orderlyPrice, binancePrice] = await Promise.all([getOrderlyPrice(), getBinancePrice()]);

        //가격차이(%) -> 양수이면 바이낸스 가격이 높은거고, 음수이면 오덜리 가격이 높은거
        //바이낸스에서 숏포지션, 오덜리에서 롱포지션이면 -> 가격차이가 양수이여야함
        //바이낸스에서 롱포지션, 오덜리에서 숏포지션이면 -> 가격차이가 음수여야함
        const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;

        // 가격 차이가 가장 컸던 값 업데이트
        if (Math.abs(priceDifference) > Math.abs(maxPriceDifference)) {
            maxPriceDifference = priceDifference;
        }

        //청산 조건 확인
        if (Math.abs(priceDifference) < closeThreshold || Math.abs(priceDifference) > Math.abs(maxPriceDifference - trailingThreshold)) {
            console.log('<<<<Closing positions due to close threshold>>>>.');
            await closePositions();
            isClosePosition = true;
        }

        //shortInterval 간격으로 반복
        await new Promise(resolve => setTimeout(resolve, shortInterval));
    }

  }


// 모니터링 웹소켓 ver
// export async function monitorClosePositions() {
//     const orderlyClient = new markPriceWSClient();
//     const binanceClient = new MarkPriceStreamClient('1s');

//     let maxPriceDifference = 0;
//     let positionClosed = false;
//     let orderlyPrice: number | null = null;
//     let binancePrice: number | null = null;

//     const checkAndClosePositions = async () => {
//         if (positionClosed) return; // 이미 포지션이 청산된 경우 중복 실행 방지

//         if (orderlyPrice !== null && binancePrice !== null) {
//             const priceDifference = ((binancePrice - orderlyPrice) / orderlyPrice) * 100;
//             console.log(`Orderly Price: ${orderlyPrice}, Binance Price: ${binancePrice}, Price Difference: ${priceDifference}%`);

//             // 가격 차이가 가장 컸던 값 업데이트
//             if (Math.abs(priceDifference) > Math.abs(maxPriceDifference)) {
//                 maxPriceDifference = priceDifference;
//             }

//             // 청산 조건 확인
//             if (Math.abs(priceDifference) < closeThreshold || Math.abs(priceDifference) > Math.abs(maxPriceDifference - trailingThreshold)) {
//                 console.log('Closing positions due to close threshold or trailing stop.');
//                 await closePositions();
//                 positionClosed = true;
//                 orderlyClient.stop();
//                 binanceClient.stop();
//             }
//         }
//     };

//     orderlyClient.setMessageCallback(async (orderlyData: any) => {
//         if (!orderlyData || !orderlyData.data || orderlyData.data.price === undefined) {
//             console.warn('Invalid orderly data received:', orderlyData);
//             return;
//         }
//         orderlyPrice = orderlyData.data.price;
//         await checkAndClosePositions();
//     });

//     binanceClient.setMessageCallback(async (binanceData: any) => {
//         if (!binanceData || binanceData.p === undefined) {
//             console.warn('Invalid binance data received:', binanceData);
//             return;
//         }
//         binancePrice = binanceData.p;
//         await checkAndClosePositions();
//     });

//     return new Promise<void>((resolve) => {
//         const interval = setInterval(() => {
//             if (positionClosed) {
//                 clearInterval(interval);
//                 resolve();
//             }
//         }, 100);
//     });
// }


// async function main() {
//     try {
//         await monitorClosePositions();
//         console.log('monitorClosePositions completed.');
//         // 추가 후속 작업 수행
//     } catch (error) {
//         console.error('Error in main function:', error);
//     }
// }

// main().catch(error => {
//   console.error('Unhandled error in main function:', error);
// });