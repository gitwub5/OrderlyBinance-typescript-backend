import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL, orderlySymbol } from "../utils";

export async function getOrderlyPositions() {
    try {
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/position/${orderlySymbol}`
        );
    
        const json = await response.json();
        console.log('getClientPositions:', JSON.stringify(json, undefined, 2));
        const position = json.data.mark_price;
        console.log("current position:", position);
        return position;
      } catch (error) {
        console.error('Error:', error);
      }
}