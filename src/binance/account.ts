import { createSignAndRequest } from "./signer";
import { BinanceBalance } from "./types";
import { BinancePosition } from './types';

//Query account balance info
//https://developers.binance.com/docs/derivatives/usds-margined-futures/account/rest-api/Futures-Account-Balance-V2
export async function getBinanceBalance(){
  const endpoint = '/fapi/v2/balance';
  const queryParams = {
      recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
    //USDT로 검색
      const balance = data.find((account: any) => account.asset === 'USDT') as BinanceBalance;
      return balance.balance;
  }
  return null;
}

// 현재 포지션 정보 조회
//https://developers.binance.com/docs/derivatives/usds-margined-futures/trade/rest-api/Position-Information-V2
export async function getBinancePositions(symbol: string){
  const endpoint = '/fapi/v2/positionRisk';
  const queryParams = {
      symbol: symbol,
      recvWindow: '5000'
  };

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data && Array.isArray(data)) {
      const position = data.find((pos: any) => pos.symbol === symbol);
      return position;
  }
}


//Query income history (start_time ~ end_time)
//https://developers.binance.com/docs/derivatives/usds-margined-futures/account/rest-api/Get-Income-History
export async function getBinanceIncomeHis(symbol: string, startTime?: number, endTime?: number) {
  const endpoint = '/fapi/v1/income';
  const queryParams: Record<string, string> = {
    symbol: symbol,
    recvWindow: '5000',
};
if (startTime) {
  queryParams.startTime = startTime.toString();
}
if (endTime) {
  queryParams.endTime = endTime.toString();
}

  const data = await createSignAndRequest(endpoint, queryParams, 'GET');
  if (data) {
      console.log(data);
      return data;
  }
  return null;
}

// async function main() {
//   const position = await getBinancePositions();
//   console.log(position?.positionAmt);
// }

// main().catch(error => {
//   console.error('Error in main function:', error);
// });

