import { signAndSendRequest } from "./signer";
import { orderlyAccountInfo, orderlySymbol, ORDERLY_API_URL } from "../utils";
import { OrderlyBalanceResponse } from "./types";


export async function getOrderlyBalance(): Promise<number | null>{
    try{
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/client/holding`
        );
        const json = await response.json();
        //console.log('getClientHolding:', JSON.stringify(json, undefined, 2));

        if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
            const data = (json as OrderlyBalanceResponse).data;
            const holding = data.holding[0].holding;
            console.log(`Orderly ${orderlySymbol} holding: `, holding);
            return holding;
        } else {
            console.error('Invalid response structure:', json);
            return null;
        }
    } catch(error){
        console.error('Error checking account info:', error);
        return null;
    }
}

export async function getOrderlyOpenOrders(){
    const res = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
      `${ORDERLY_API_URL}/v1/orders?status=INCOMPLETE`
    );
    const json = await res.json();
    //console.log('getOpenOrders:', JSON.stringify(json, undefined, 2));
    //console.log(json.data.rows);
    return json.data.rows;
}