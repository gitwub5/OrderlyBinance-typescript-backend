import { WebSocketStreamBase } from './wsStreamBase';
import { orderlySymbol } from '../../utils/utils';

export class markPriceWSClient extends WebSocketStreamBase {
    constructor() {
        const subscriptionMessage = JSON.stringify({
            id: `id-${Math.random().toString(36).substring(7)}`,
            topic: `${orderlySymbol}@markprice`,
            event: 'subscribe',
        });
        super(subscriptionMessage);
      }
    
      protected handleMessage(data: any) {
        if (data.topic && data.topic.includes('markprice')) {
          const { topic, ts, data: markData } = data;
          // console.log(`Topic: ${topic}`);
          // console.log(`Timestamp: ${ts}`);
          // console.log(`Symbol: ${markData.symbol}`);
          // console.log(`Price: ${markData.price}`);
        } else {
          //console.warn('Unknown event type:', data);
        }
      }
    }
    
  //   const orderlyClient = new markPriceWSClient();
  //   orderlyClient.setMessageCallback((data: any) => {
  //     const price = data?.data?.price;
  //     if (price !== undefined) {
  //       console.log('Received Orderly Mark Price:', price);
  //     }
  //   }
  // );