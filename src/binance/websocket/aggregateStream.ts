import WebSocketStreamBase from './wsStreamBase';

//The Aggregate Trade Streams push market trade information that is aggregated for fills with same price and taking side every 100 milliseconds.
class AggregateTradeStream extends WebSocketStreamBase {
  constructor(symbol: string) {
    super(symbol, '@aggTrade');
  }

  protected handleMessage(data: any) {
    const { e: eventType, E: eventTime, s: symbol, a: aggId, p: price, q: quantity, f: firstTradeId, l: lastTradeId, T: tradeTime, m: isBuyerMaker } = data;
    console.log(`Event Type: ${eventType}`);
    console.log(`Event Time: ${eventTime}`);
    console.log(`Symbol: ${symbol}`);
    console.log(`Aggregate ID: ${aggId}`);
    console.log(`Price: ${price}`);
    console.log(`Quantity: ${quantity}`);
    console.log(`First Trade ID: ${firstTradeId}`);
    console.log(`Last Trade ID: ${lastTradeId}`);
    console.log(`Trade Time: ${tradeTime}`);
    console.log(`Is Buyer Maker: ${isBuyerMaker}`);
  }
}

export default AggregateTradeStream;