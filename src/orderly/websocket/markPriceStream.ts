import { WebSocketStreamBase } from './wsStreamBase';

export class markPriceWSClient extends WebSocketStreamBase {
  constructor(symbol:string) {
    const subscriptionMessage = JSON.stringify({
      id: `id-${Math.random().toString(36).substring(7)}`,
      topic: `${symbol}@markprice`,
      event: "subscribe",
    });
    super(subscriptionMessage);
  }

  protected handleMessage(data: any) {
    // Check if it's a subscription confirmation
    if (data.event === "subscribe") {
      console.log("Subscription confirmed:", data);
      return;
    }

    // Check if it's a valid price update
    if (
      data.topic &&
      data.topic.includes("markprice") &&
      data.data &&
      data.data.price
    ) {
      const { price } = data.data;
      this.messageCallback && this.messageCallback({ price });
    } else {
      console.warn("Invalid orderly data received:", data);
    }
  }
}
    
  //   const orderlyClient = new markPriceWSClient('PERP_TON_USDT');
  //   orderlyClient.setMessageCallback((data: any) => {
  //     const price = data.price;
  //     if (price !== undefined) {
  //       console.log('Received Orderly Mark Price:', price);
  //     }
  //   }
  // );