import { signAndSendRequest } from "./signer";
import { orderlyAccountInfo, orderlySymbol, ORDERLY_API_URL } from "../utils/utils";
import { OrderlyBalanceResponse, OrderlyPosition, OrderlyPositionResponse } from "./types";
import { formatDate } from "./utils/formatDate";

//문제: 현재 제대로 값을 불러오지 못하고 있음!!
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
//문제: 현재 제대로 값을 불러오지 못하고 있음!!
export async function getOrderlyPnLHis(
    start_t : number,
    end_t: number
){
    const query: Record<string, any> = {
        start_t: start_t,
        end_t: end_t,
    };

    // Query string 생성
    const queryString = new URLSearchParams(query).toString();

    try {
        const res = await signAndSendRequest(
            orderlyAccountInfo.accountId,
            orderlyAccountInfo.privateKey,
            `${ORDERLY_API_URL}/v1/pnl_settlement/history/?${queryString}`,
            {
                method: 'GET',
            }
        );
        const json = await res.json();
        console.log(json.data);
        return json.data.rows;
    } catch (error) {
        console.error('Error checking daily status:', error);
        return null;
    }
}
