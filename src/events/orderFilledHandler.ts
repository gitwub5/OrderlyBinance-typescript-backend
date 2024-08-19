// import { EventEmitter } from 'events';

// const eventEmitter = new EventEmitter();

// function handleOrderFilled(tokenSymbol: string, order: any) {
//     console.log(`[${tokenSymbol}] Order filled:`, order);
//     // 해당 토큰에 대한 로직 처리
// }

// // 지정가 주문이 체결될 때까지 대기하는 함수
// async function waitForOrderFill(orderId: string, symbol: string) {
//     return new Promise<void>((resolve, reject) => {
//       registerOrderFilledHandler(eventEmitter, orderId, (order) => {
//         resolve();
//       });
  
//       const interval = setInterval(async () => {
//         try {
//           await checkOrderStatus(orderId, symbol);
//         } catch (error) {
//           clearInterval(interval);
//           reject(error);
//         }
//       }, 1000);
//     });
//   }
  
// // 이벤트 등록 시 각 토큰 정보를 포함
// eventEmitter.on('orderFilled', handleOrderFilled);

// // 이벤트 발생 시에도 토큰 정보를 함께 전달
