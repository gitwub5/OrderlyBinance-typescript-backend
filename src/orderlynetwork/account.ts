import { signAndSendRequest } from "./signer";
import { orderlyAccountInfo, orderlySymbol, ORDERLY_API_URL } from "../utils";
import { OrderlyBalanceResponse, OrderlyPosition, OrderlyPositionResponse } from "./types";


export async function getOrderlyBalance(): Promise<number | null>{
    try{
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/client/holding`
        );
        const json = await response.json();
        //console.log('getClientHolding:', JSON.stringify(json, undefined, 2));
        const data = (json as OrderlyBalanceResponse).data;
        const holding = data.holding[0].holding;
        console.log(`Orderly ${orderlySymbol} holding: `, holding);
        return holding;
        
    } catch(error){
        console.error('Error checking account info:', error);
        return null;
    }
}

export async function getOrderlyPositions() : Promise<OrderlyPosition | null> {
    try {
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/position/${orderlySymbol}`
        );
        const json: OrderlyPositionResponse = await response.json();
        //console.log('Orderly Positions data:', JSON.stringify(json, undefined, 2));
        const position = json.data;
        return position;

      } catch (error) {
        console.error('Error:', error);
        return null;
      }
}

//모든 Open Orders 가져오기
export async function getOrderlyOpenOrders(): Promise<number[] | null> {
    try{
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/orders?status=INCOMPLETE`
        );
        const json = await res.json();
        const orderIds = json.data.rows.map((order: any) => order.order_id);
        console.log(orderIds);
        return orderIds;
    } catch(error){
        console.error('Error checking orders info:', error);
        return null;
    }
}

//TODO: 주문 기록 가져오는 함수