import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL, orderlySymbol } from "../utils";
import { OrderlyPosition, OrderlyPositionResponse } from "./orderlyTypes";

export async function getOrderlyPositions() : Promise<OrderlyPosition | null> {
    try {
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/position/${orderlySymbol}`
        );
        const json: OrderlyPositionResponse = await response.json();
        //console.log('Orderly Positions data:', JSON.stringify(json, undefined, 2));

        if (json && json.success && json.data) {
          const position = json.data;
          return position;
        } else {
          console.error('Invalid response structure:', json);
          return null;
        }

      } catch (error) {
        console.error('Error:', error);
        return null;
      }
}

// getOrderlyPositions().then(position => {
//   if (position) {
//     console.log('Orderly Position:', position);
//   } else {
//     console.log('No position data available.');
//   }
// });