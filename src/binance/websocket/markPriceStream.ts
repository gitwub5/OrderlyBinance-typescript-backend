import WebSocketStreamBase from './wsStreamBase';
import { binanceSymbol } from 'utils/utils';

//Mark price and funding rate for a single symbol pushed every 3 seconds or every second.
class MarkPriceStream extends WebSocketStreamBase {
  constructor(symbol: string, interval: '3s' | '1s' = '3s') {
    super(symbol, `@markPrice@${interval}`);
  }

  protected handleMessage(data: any) {
    const { e: eventType, E: eventTime, s: symbol, p: markPrice, i: indexPrice, P: estimatedSettlePrice, r: fundingRate, T: nextFundingTime } = data;
    // console.log(`Event Type: ${eventType}`);
    // console.log(`Event Time: ${eventTime}`);
    // console.log(`Symbol: ${symbol}`);
    // console.log(`Mark Price: ${markPrice}`);
    // console.log(`Index Price: ${indexPrice}`);
    // console.log(`Estimated Settle Price: ${estimatedSettlePrice}`);
    // console.log(`Funding Rate: ${fundingRate}`);
    // console.log(`Next Funding Time: ${nextFundingTime}`);
  }
}

export default MarkPriceStream;


const markPriceClient = new MarkPriceStream(binanceSymbol, '1s');

markPriceClient.setMessageCallback((data: any) => {
    const { p: markPrice } = data;
    console.log('Received Mark Price:', markPrice);
    // 여기서 markPrice를 사용하세요.
  });