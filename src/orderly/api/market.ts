import { ORDERLY_API_URL, orderlyAccountInfo } from '../../utils/utils';
import { signAndSendRequest } from './signer';

export async function getOrderlyPrice(symbol:string) {
    const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/public/futures/${symbol}`
    );
    const json = await response.json();
    const price = json.data.mark_price;
    //console.log(`Orderly ${symbol} price: `, parseFloat(price));
    return parseFloat(price);
}

//Snapshot of the current orderbook. Price of asks/bids are in descending order.
type Level = { price: number; quantity: number };
export type OrderbookSnapshot = { data: { asks: Level[]; bids: Level[] } };

//TODO: 수정필요 & maxLevel은 몇으로 잡아야하는가?
export async function getOrderlyOrderbook(symbol: string, maxLevel: number): Promise<OrderbookSnapshot> {
  const res = await signAndSendRequest(
    orderlyAccountInfo.accountId,
    orderlyAccountInfo.privateKey,
    `${ORDERLY_API_URL}/v1/orderbook/${symbol}${maxLevel != null ? `?max_level=${maxLevel}` : ''}`
  );
  const json = await res.json();
  console.log('getOrderbook:', JSON.stringify(json, undefined, 2));
  return json;
}

//TODO: 과거 가격 불러오는 함수
//나중에 가격갭찾을때 한달이나 일주일 과거 가격 불러와서 비교해서 찾기