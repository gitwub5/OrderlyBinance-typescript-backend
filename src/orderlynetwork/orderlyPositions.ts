import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL } from "../utils";

export async function getOrderlyPositions() {
    try{
        const res = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.apiKey,
        `${ORDERLY_API_URL}/v1/client/holding`
        );
        const json = await res.json();
        console.log('getClientHolding:', JSON.stringify(json, undefined, 2));

        //TODO: balance 값 리턴하게
        return parseFloat(json.data.balance);
    } catch(error){
        console.error('Error checking account info:', error);
        return 0;
    }
}