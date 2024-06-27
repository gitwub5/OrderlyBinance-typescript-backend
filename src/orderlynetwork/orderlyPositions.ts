import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL } from "../utils";


//TODO: Position return 하는 api인지 확인
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
        //Question: 리턴값 0으로 해도 되는지 아니면 중단해야하는지? -> 바이낸스 포지션 함수도 마찬가지로
        return 0;
    }
}