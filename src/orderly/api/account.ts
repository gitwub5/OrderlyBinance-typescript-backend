import { signPnLMessage, signAndSendRequest } from "./signer";
import { orderlyAccountInfo, ORDERLY_API_URL } from "../../utils/utils";
import { OrderlyBalanceResponse, OrderlyPosition, OrderlyPositionResponse } from "../types/types";
import { formatDate } from "../utils/formatDate";

//문제: PnL settlement를 해야지 됨
export async function getOrderlyBalance(): Promise<number | null>{
    try{
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/client/holding`
        );
        const json = await response.json();
       // console.log('getClientHolding:', JSON.stringify(json, undefined, 2));
        const data = (json as OrderlyBalanceResponse).data;
        const holding = data.holding[0].holding;
        //console.log(`Orderly ${data.holding[0].token} holding: `, holding);
        return holding;
        
    } catch(error){
        console.error('Error checking account info:', error);
        return null;
    }
}

export async function getOrderlyPositions(symbol: string){
    try {
        const response = await signAndSendRequest(
        orderlyAccountInfo.accountId,
        orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/position/${symbol}`
        );
        const json: OrderlyPositionResponse = await response.json();
        //console.log('Orderly Positions data:', JSON.stringify(json, undefined, 2));
        const position = json.data;
        return position;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
}

//모든 Open Orders(의 orderId) 가져오기
export async function getOrderlyOpenOrders(): Promise<number[] | null> {
    try{
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
        `${ORDERLY_API_URL}/v1/orders?status=INCOMPLETE`
        );
        const json = await res.json();
        const orderIds = json.data.rows.map((order: any) => order.order_id);
        return orderIds;
    } catch(error){
        console.error('Error checking orders info:', error);
        return null;
    }
}

//TODO: 주문 기록 가져오는 함수 구현

//Get user daily statistics of assets/pnl/volume.
//당일날 데이터는 못 가져옴(입력값 없으면 전날 데이터만 가져옴)
export async function getOrderlyDailyStats(
    startDate: Date = new Date(new Date().setDate(new Date().getDate() - 1)), 
    endDate: Date = new Date(new Date().setDate(new Date().getDate() - 1))
){
    const query: Record<string, any> = {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
    };

    // Query string 생성
    const queryString = new URLSearchParams(query).toString();

    try {
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
            `${ORDERLY_API_URL}/v1/client/statistics/daily?${queryString}`,
            {
                method: 'GET',
            }
        );
        const json = await res.json();
        console.log(json.data.rows);
        return json.data.rows;
    } catch (error) {
        console.error('Error checking daily status:', error);
        return null;
    }
}

//Retrieve the historical PnL settlement history of the account.
//PnL 정산 내역 불러오기: 발생한 손익(PnL, Profit and Loss)을 정산한 기록
//문제: PnL settlement를 해야지 됨
export async function getPnLSettleLHis(start_t?: number, end_t?: number) {
    const query: Record<string, any> = {};

    if (start_t !== undefined) {
        query.start_t = start_t;
    }

    if (end_t !== undefined) {
        query.end_t = end_t;
    }

    // Query string 생성
    const queryString = new URLSearchParams(query).toString();
    const url = queryString ? `${ORDERLY_API_URL}/v1/pnl_settlement/history/?${queryString}` : `${ORDERLY_API_URL}/v1/pnl_settlement/history/`;

    try {
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
            url,
            {
                method: 'GET',
            }
        );
        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error('Error checking daily status:', error);
        return null;
    }
}

//Retrieve a nonce used for requesting a withdrawal on Orderly Network. Each nonce can only be used once.
//https://orderly.network/docs/build-on-evm/evm-api/restful-api/private/get-settle-pnl-nonce
//Limit: 10 requests per 1 second
export async function getSettlePnLNonce(){
    try {
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
            `${ORDERLY_API_URL}/v1/settle_nonce`,
            {
                method: 'GET',
            }
        );
        const json = await res.json();
        return json.data.settle_nonce;
    } catch (error) {
        console.error('Error checking Settle PnL Nonce:', error);
        return null;
    }
}

// verifyingContract should use: 0x6F7a338F2aA472838dEFD3283eB360d4Dff5D203.
// https://orderly.network/docs/build-on-evm/evm-api/restful-api/private/request-pnl-settlement
export async function reqPnLSettlement(){
    try {
        const settle_nonce = await getSettlePnLNonce();
        const messageObject = {
            brokerId: 'woofi_pro',
            chainId: 42161, // Orderly Network의 체인 ID
            settleNonce: settle_nonce,
            timestamp: Date.now(),
        };

        const [walletAddress, signature] = await signPnLMessage(orderlyAccountInfo.privateKey, messageObject);
        
        const body: Record<string, any> = {
            signature: signature,
            userAddress: walletAddress,
            verifyingContract: '0x6F7a338F2aA472838dEFD3283eB360d4Dff5D203',
            message: messageObject
        };

        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
            `${ORDERLY_API_URL}/v1/settle_pnl`,
            {
                method: 'POST',
                body: JSON.stringify(body)
            }
        );

        const json = await res.json();
        return json;
    } catch (error) {
        console.error('Error request PnL settlement:', error);
        return null;
    }
}

// async function main() {
//     try {
//     //   console.log(await getSettlePnLNonce());
//     //   console.log(await getPnLSettleLHis());
//      console.log(await getOrderlyPositions('PERP_TON_USDC'))
//     } catch (error) {
//         console.error('Error in main function:', error);
//     }
// }
// main().catch(error => {
//   console.error('Unhandled error in main function:', error);
// });