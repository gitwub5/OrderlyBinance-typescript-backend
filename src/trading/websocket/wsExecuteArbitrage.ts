
// <<웹소켓 ver>>
// export async function executeArbitrage() {
//   // TODO: Balance가 없으면 루프문 중지, 또는 에러 발생 시 중지
//   try {
//     // 오덜리에서 api로 가격 가져온 다음에 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
//     // const orderlyPrice = await getOrderlyPrice();
//     // const { longPositionId, shortPositionId } = await placeOrder(orderlyPrice);

//     // 오덜리에서 웹소켓으로 가격 가져오기
//     const orderlyClient = new markPriceWSClient();
//     let positionFilled = false;

//     orderlyClient.setMessageCallback(async (data: any) => {
//         // if (positionFilled) {
//         //     return; // 포지션이 체결되었으면 추가 처리를 중지
//         // }
//         const orderlyPrice = data.price;
//         console.log('Received Orderly Mark Price:', orderlyPrice);

//         // const binancePosition = await getBinancePositions();
//         // if (binancePosition !== null && binancePosition.positionAmt !== 0) {
//         //     console.log('Position filled on Binance:', binancePosition);
//         //     positionFilled = true;

//         //     // 남아있는 주문 취소 및 오덜리 시장가 진입
//         //     await enterPosition(binancePosition.positionAmt,longPositionId, shortPositionId);

//         //     // WebSocket 클라이언트 중지
//             //orderlyClient.stop();

//         //     // 포지션을 종료하는 로직 시작
//         //     await monitorClosePositions();
//         //     return;
//         // }
//       return;

//         // // 오덜리 시장가에 맞춰 아비트리지 임계값 차이만큼 매수, 매도 포지션 걸어놓기
//         // await handleOrder(orderlyPrice, longPositionId, shortPositionId);
//     });

//     // 새로운 주문을 실행하기 전에 약간의 시간 대기
//     await new Promise(resolve => setTimeout(resolve, interval));
// } catch (error) {
//     console.error('Error in executeArbitrage loop:', error);
//     // 필요한 경우 루프를 중지하거나 에러 핸들링 로직 추가
// }
// }
