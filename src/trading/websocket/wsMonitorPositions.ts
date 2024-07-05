import { MarkPriceStreamClient } from "../../binance/websocket/markPriceStream";
import { markPriceWSClient } from "../../orderly/websocket/markPriceStream";
import { closePositions } from "../closePositioins";

// //모니터링 웹소켓 ver
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