import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL } from "../utils";

export async function getOrderlyBalance() {
    try{
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/client/holding`
        );
        const json = await response.json();
        console.log('getClientHolding:', JSON.stringify(json, undefined, 2));

    } catch(error){
        console.error('Error checking account info:', error);
        return 0;
    }
}