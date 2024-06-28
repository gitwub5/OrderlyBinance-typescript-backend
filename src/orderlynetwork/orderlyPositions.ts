import { signAndSendRequest } from "./orderlySignRequest";
import { orderlyAccountInfo, ORDERLY_API_URL, orderlySymbol } from "../utils";

interface OrderlyPositionResponse {
  success: boolean;
  data: {
    symbol: string;
    position_qty: number;
    cost_position: number;
    last_sum_unitary_funding: number;
    pending_long_qty: number;
    pending_short_qty: number;
    settle_price: number;
    average_open_price: number;
    unsettled_pnl: number;
    mark_price: number;
    est_liq_price: number;
    timestamp: number;
    mmr: number;
    imr: number;
    IMR_withdraw_orders: number;
    MMR_with_orders: number;
    pnl_24_h: number;
    fee_24_h: number;
  };
  timestamp: number;
}

export async function getOrderlyPositions() : Promise<number | null> {
    try {
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/position/${orderlySymbol}`
        );
        const json = await response.json();
        //console.log('getClientPositions:', JSON.stringify(json, undefined, 2));

        if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
          const data = (json as OrderlyPositionResponse).data;
          const position = data.mark_price
          console.log(`Orderly ${orderlySymbol} position: `, position);
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

//getOrderlyPositions();