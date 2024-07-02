import { ORDERLY_API_URL, orderlySymbol, orderlyAccountInfo } from '../utils';
import { signAndSendRequest } from './signer';

type Level = { price: number; quantity: number };
export type OrderbookSnapshot = { data: { asks: Level[]; bids: Level[] } };

//TODO: 수정필요 & maxLevel은 몇으로 잡아야하는가?
export async function getOrderlyOrderbook(maxLevel: number): Promise<OrderbookSnapshot> {
  const res = await signAndSendRequest(
    orderlyAccountInfo.accountId,
    orderlyAccountInfo.privateKey,
    `${ORDERLY_API_URL}/v1/orderbook/${orderlySymbol}${maxLevel != null ? `?max_level=${maxLevel}` : ''}`
  );
  const json = await res.json();
  console.log('getOrderbook:', JSON.stringify(json, undefined, 2));
  return json;
}
